import { useEffect, useState, useCallback, useRef } from "react";
import {
  getAnimeEpisodes,
  getEpisodeServers,
  getAnimeDetails,
  getEpisodeSources,
} from "@/context/api";
import { addProxy, extractVideoSources, getEpNumber, toSkipTiming } from "@/utils/videoPlayerUtils";

const EMPTY_SOURCES_STATE = {
  streamingUrl: "",
  streamingSources: [],
  subtitleTracks: [],
  introSkip: null,
  outroSkip: null,
  serverLoading: false,
  videoReferer: "",
};

/**
 * Hook: Fetch and manage episode data, servers, and anime info
 * Handles race condition through mounted flag
 */
export const useWatchData = (animeId, episodeId) => {
  const [state, setState] = useState({
    episodes: [],
    servers: { sub: [], dub: [] },
    animeInfo: null,
    currentEpisode: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const [epsRes, infoRes] = await Promise.all([
          getAnimeEpisodes(animeId),
          getAnimeDetails(animeId),
        ]);
        if (!mounted) return;

        if (epsRes.error) {
          setState((prev) => ({ ...prev, error: epsRes.error, loading: false }));
          return;
        }

        const eps = epsRes.data?.data?.episodes || [];
        const current =
          eps.find((e) => e.episodeId === decodeURIComponent(episodeId)) || eps[0];
        const info = infoRes.error ? null : infoRes.data?.data?.anime;

        setState((prev) => ({
          ...prev,
          episodes: eps,
          currentEpisode: current,
          animeInfo: info,
        }));

        if (!current) {
          setState((prev) => ({ ...prev, loading: false }));
          return;
        }

        const serverRes = await getEpisodeServers(current.episodeId);
        if (!mounted) return;

        const serverData = serverRes.error ? {} : serverRes.data?.data || {};
        // New API structure uses data.categories
        const categories = serverData.categories || {};
        const finalSub = Array.isArray(categories.sub) ? categories.sub : [];
        const finalDub = Array.isArray(categories.dub) ? categories.dub : [];
        const finalSoftsub = Array.isArray(categories.softsub) ? categories.softsub : [];

        setState((prev) => ({
          ...prev,
          servers: { sub: finalSub, dub: finalDub, softsub: finalSoftsub },
          loading: false,
        }));
      } catch (err) {
        if (mounted)
          setState((prev) => ({
            ...prev,
            error: err.message,
            loading: false,
          }));
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [animeId, episodeId]);

  return state;
};

/**
 * Hook: Fetch and parse video sources, subtitles, and skip markers
 * Manages request racing with abort signals and request IDs
 * Extracts m3u8 URLs from multiple API response formats
 */
export const useVideoSources = (animeId) => {
  const [state, setState] = useState(EMPTY_SOURCES_STATE);
  const abortRef = useRef(null);
  const latestRequestIdRef = useRef(0);

  const loadSources = useCallback(
    async (episode, server, category) => {
      if (!episode || !server) return;

      // Cancel previous request
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const requestId = ++latestRequestIdRef.current;

      setState((prev) => ({ ...prev, serverLoading: true }));

      try {
        // Extract server identifier from serverId (e.g., "server-1" from "anime:1:sub:server-1")
        const serverIdPart = server.serverId?.split(':').pop() || 'server-1';
        const sourceRes = await getEpisodeSources(
          animeId,
          episode.episodeId,
          getEpNumber(episode),
          serverIdPart,
          category,
          { signal: abortRef.current.signal }
        );

        // Guard against stale responses
        if (requestId !== latestRequestIdRef.current) return;

        if (sourceRes.error) {
          console.error("[Watch] Failed to fetch sources:", sourceRes.error);
          setState(EMPTY_SOURCES_STATE);
          return;
        }

        const apiData = sourceRes.data?.data || sourceRes.data || sourceRes;

        // --- Video sources extraction ---
        let sourcesArray = [];
        const rawSources = apiData.sources || [];
        const linkData = apiData.link || {};
        const topLevelSource =
          typeof apiData.source === "string" ? apiData.source : "";

        if (rawSources.length) {
          sourcesArray = rawSources
            .map((s, i) => ({
              label: s.quality || s.label || `Quality ${i + 1}`,
              // Use m3u8 source directly
              url: addProxy(
                s.source || s.url || s.file || s.src || "",
                s.referer || apiData.referer || ""
              ),
              referer: s.referer || "",
            }))
            .filter((s) => s.url);
        } else if (
          linkData.proxyUrl ||
          linkData.directUrl ||
          linkData.file ||
          linkData.url ||
          typeof apiData.link === "string" ||
          topLevelSource
        ) {
          const url = addProxy(
            linkData.proxyUrl ||
            linkData.file ||
            linkData.directUrl ||
            linkData.url ||
            (typeof apiData.link === "string" ? apiData.link : "") ||
            topLevelSource,
            apiData.referer || ""
          );
          sourcesArray = [{ label: "Auto", url, referer: apiData.referer || "" }];
        } else {
          const videoData = sourceRes.data?.video || apiData.video || {};
          sourcesArray = extractVideoSources(videoData).map((s) => ({
            ...s,
            url: addProxy(s.url, s.referer || apiData.referer || ""),
            referer: s.referer || "",
          }));
        }

        const streamingUrl = sourcesArray[0]?.url || "";
        const videoReferer = sourcesArray[0]?.referer || "";

        // --- Subtitle tracks ---
        const rawTracks = (apiData.tracks || []).filter((t) => {
          const kind = String(t.kind || "").toLowerCase();
          return kind !== "thumbnails";
        });
        const captionTracks = sourceRes.data?.captions?.tracks || [];

        const subtitleTracks = (
          rawTracks.length ? rawTracks : captionTracks
        ).map((t) => ({
          url: t.url || t.file,
          file: t.file || t.url,
          lang: t.lang || t.label || "unknown",
          label: t.label || t.lang || "Subtitle",
          kind: t.kind || "subtitles",
          default: Boolean(t.default),
        }));

        // --- Intro / Outro skip markers ---
        const skipData = sourceRes.data?.skip || apiData.skip || [];
        const skipArray = Array.isArray(skipData) ? skipData : [];
        const skipObject =
          !Array.isArray(skipData) && typeof skipData === "object"
            ? skipData
            : {};
        const findSkip = (name, type) =>
          skipArray.find((s) => s.name === name || s.type === type);

        const introSkip =
          toSkipTiming(skipObject.intro) ||
          toSkipTiming(apiData.intro) ||
          toSkipTiming(findSkip("Skip Intro", "intro"));
        const outroSkip =
          toSkipTiming(skipObject.outro) ||
          toSkipTiming(apiData.outro) ||
          toSkipTiming(findSkip("Skip Outro", "outro"));

        setState({
          streamingSources: sourcesArray,
          streamingUrl,
          subtitleTracks,
          introSkip,
          outroSkip,
          serverLoading: false,
          videoReferer,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("[Watch] Error loading sources:", err);
          if (requestId === latestRequestIdRef.current) {
            setState(EMPTY_SOURCES_STATE);
          }
        }
      }
    },
    [animeId]
  );

  return { ...state, loadSources };
};