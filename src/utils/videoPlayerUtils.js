/**
 * Video player utility functions for stream proxying, source extraction, and server selection
 */

const PROXY_URL = import.meta.env.VITE_PROXY_URL?.trim();
const PREFERRED_SERVER = "hd-1";

/**
 * Add proxy middleware to video stream URLs
 * Supports template-based and query-param-based proxy patterns
 */
export const addProxy = (url) => {
  if (!url) return "";

  // Keep relative URLs untouched.
  if (url.startsWith("/")) return url;

  if (!PROXY_URL) return url;
  if (url.startsWith(PROXY_URL)) return url;

  const encodedUrl = encodeURIComponent(url);

  if (PROXY_URL.includes("{url}")) {
    return PROXY_URL.replace("{url}", encodedUrl);
  }

  if (PROXY_URL.endsWith("=")) {
    return `${PROXY_URL}${encodedUrl}`;
  }

  const separator = PROXY_URL.includes("?") ? "&" : "?";
  return `${PROXY_URL}${separator}url=${encodedUrl}`;
};

/**
 * Extract playable video sources from various API response formats
 * Handles nested qualities, renditions, and fallback patterns
 */
export const extractVideoSources = (videoData) => {
  const candidates =
    videoData.sources ||
    videoData.qualities ||
    videoData.renditions ||
    videoData.alternatives ||
    [];

  if (Array.isArray(candidates) && candidates.length) {
    return candidates
      .map((s) => ({
        label: String(s.quality || s.label || (s.res ? `${s.res}p` : s.height ? `${s.height}p` : "Unknown")),
        url:
          s.directUrl || s.file || s.url || s.src || s.path ||
          s.source?.directUrl || s.source?.url ||
          videoData.source?.directUrl || videoData.source?.url ||
          videoData.directUrl || videoData.url || "",
      }))
      .filter((s) => s.url);
  }

  const url =
    videoData.source?.directUrl || videoData.directUrl ||
    videoData.source?.url || videoData.url || "";
  return url ? [{ label: "Auto", url }] : [];
};

/**
 * Select initial server preference with fallback chain
 * Priority: preferred server (sub) > preferred server (dub) > any sub > any dub
 */
export const getInitialServer = (servers) => {
  const SUB = "sub";
  const DUB = "dub";

  const preferredSub = servers.sub?.find(
    (s) => s.serverName?.toLowerCase() === PREFERRED_SERVER.toLowerCase()
  );
  if (preferredSub) return { server: preferredSub, category: SUB };

  const preferredDub = servers.dub?.find(
    (s) => s.serverName?.toLowerCase() === PREFERRED_SERVER.toLowerCase()
  );
  if (preferredDub) return { server: preferredDub, category: DUB };

  const firstSub = servers.sub?.[0];
  if (firstSub) return { server: firstSub, category: SUB };

  const firstDub = servers.dub?.[0];
  if (firstDub) return { server: firstDub, category: DUB };

  return { server: null, category: SUB };
};

/**
 * Extract episode number from episodeId query string
 * Fallback to episode.number if extraction fails
 */
export const getEpNumber = (episode) => {
  const match = episode.episodeId?.match(/\?ep=(\d+)/);
  return match ? parseInt(match[1], 10) : episode.number;
};

/**
 * Normalize skip timings from various API response structures
 * Converts object with start/end into skip timing or returns null
 */
export const toSkipTiming = (data) =>
  data?.start !== undefined && data?.end !== undefined
    ? { start: data.start, end: data.end }
    : null;
