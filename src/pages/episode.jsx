import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getAnimeEpisodes, getAnimeDetails } from "@/context/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Search, ArrowLeft } from "lucide-react";

function EpisodeSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-10 w-10 bg-zinc-800 rounded-full" />
        <Skeleton className="h-8 w-1/3 bg-zinc-800" />
      </div>
      <Skeleton className="h-10 w-full max-w-sm mb-6 bg-zinc-800" />
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
        {[...Array(24)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full bg-zinc-800 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function EpisodeList() {
  const { animeId } = useParams();
  const navigate = useNavigate();
  const [episodes, setEpisodes] = useState([]);
  const [animeInfo, setAnimeInfo] = useState(null);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      // Fetch episodes and anime details in parallel
      const [episodesRes, detailsRes] = await Promise.all([
        getAnimeEpisodes(animeId),
        getAnimeDetails(animeId)
      ]);
      
      if (episodesRes.error) {
        setError(episodesRes.error);
      } else {
        setEpisodes(episodesRes.data.data.episodes || []);
        setTotalEpisodes(episodesRes.data.data.totalEpisodes || 0);
      }
      
      if (!detailsRes.error && detailsRes.data?.data?.anime?.info) {
        setAnimeInfo(detailsRes.data.data.anime.info);
      }
      
      setLoading(false);
    }
    fetchData();
  }, [animeId]);

  if (loading) return <EpisodeSkeleton />;

  if (error || episodes.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Episodes</h1>
        <p className="text-zinc-400">{error || "No episodes found"}</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
    );
  }

  // Filter episodes based on search (by number or title)
  const filteredEpisodes = episodes.filter((ep) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ep.number.toString().includes(query) ||
      ep.title?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/anime/${animeId}`)}
          className="text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {animeInfo?.name || "Episodes"}
          </h1>
          <p className="text-zinc-400 text-sm">
            {totalEpisodes} Episode{totalEpisodes !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          type="text"
          placeholder="Search episode by number or title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
        />
      </div>

      {/* Episodes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
        {filteredEpisodes.map((ep) => (
          <Link
            key={ep.episodeId}
            to={`/watch/${animeId}/${encodeURIComponent(ep.episodeId)}`}
          >
            <Card className="group cursor-pointer bg-zinc-900 border-zinc-800 hover:border-purple-500 hover:bg-zinc-800 transition-all duration-200">
              <CardContent className="p-3 flex flex-col items-center justify-center gap-1 relative">
                {ep.isFiller && (
                  <Badge className="absolute top-1 right-1 text-[10px] px-1 py-0 bg-orange-600">
                    Filler
                  </Badge>
                )}
                <div className="flex items-center gap-1">
                  <Play className="h-3 w-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-white font-semibold text-lg">{ep.number}</span>
                </div>
                <span className="text-zinc-500 text-xs text-center line-clamp-1" title={ep.title}>
                  {ep.title}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredEpisodes.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <p className="text-zinc-500">No episodes found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}
