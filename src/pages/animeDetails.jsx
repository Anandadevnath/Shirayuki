import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getAnimeDetails } from "@/context/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SmallAnimeCard,
  CharacterCard,
  DetailsSkeleton,
  InfoRow,
  PlayIcon,
  PlusIcon,
  ChevronRightIcon,
} from "@/components/details";
import { AnimeCard } from "@/components/home/AnimeCard";


export default function AnimeDetails() {
  const { animeId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const seasonsScrollRef = useRef(null);
  const SCROLL_AMOUNT = 440;
  const scrollSeasons = useCallback((direction) => {
    if (seasonsScrollRef.current) {
      seasonsScrollRef.current.scrollBy({
        left: direction === 'left' ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
        behavior: 'smooth',
      });
    }
  }, []);
  const scrollSeasonsLeft = useCallback(() => scrollSeasons('left'), [scrollSeasons]);
  const scrollSeasonsRight = useCallback(() => scrollSeasons('right'), [scrollSeasons]);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      setError(null);
      const { data: result, error: err } = await getAnimeDetails(animeId);
      if (err) {
        setError(err);
      } else {
        setData(result.data);
      }
      setLoading(false);
    }
    fetchDetails();
  }, [animeId]);

  if (loading) return <DetailsSkeleton />;

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Anime</h1>
        <p className="text-zinc-400">{error || "Anime not found"}</p>
        <Link to="/">
          <Button className="mt-4">Go Back Home</Button>
        </Link>
      </div>
    );
  }

  const { anime, seasons, relatedAnimes, recommendedAnimes, mostPopularAnimes } = data;
  const { info, moreInfo } = anime;

  const description = info.description || "";
  const truncatedDescription = description.length > 300 
    ? description.slice(0, 300) + "..." 
    : description;

  // Use cover/banner image for background, fallback to poster
  const backgroundImage = info.cover || info.banner || info.poster;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Background Image with Blur */}
      <div className="fixed inset-0 z-0">
        <img
          src={backgroundImage}
          alt=""
          className="w-full h-full object-cover blur-sm opacity-40 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-950/80 to-zinc-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/70 via-transparent to-zinc-950/70" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-12 pt-6 pb-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm mb-6">
            <Link to="/" className="text-zinc-400 hover:text-pink-400 transition-colors">
              Home
            </Link>
            <ChevronRightIcon />
            <Link 
              to={`/category/${info.stats?.type?.toLowerCase() || 'tv'}`} 
              className="text-zinc-400 hover:text-pink-400 transition-colors"
            >
              {info.stats?.type || "TV"}
            </Link>
            <ChevronRightIcon />
            <span className="text-zinc-500 truncate max-w-[200px]">{info.name}</span>
          </nav>

          {/* Main Content Grid */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
            {/* Left - Poster */}
            <div className="flex-shrink-0 mx-auto lg:mx-0">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-xl blur-2xl group-hover:blur-3xl transition-all duration-300" />
                <img
                  src={info.poster}
                  alt={info.name}
                  className="relative w-[260px] h-[400px] object-cover rounded-md border border-white/10 backdrop-blur-sm animate-glow"
                />
              </div>
            </div>

            {/* Center - Main Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              {/* Title */}
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                {info.name}
              </h1>

              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2.5 mb-6">
                {info.stats?.rating && (
                  <Badge className="bg-gradient-to-r from-zinc-700 to-zinc-600 text-white text-xs px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm">
                    {info.stats.rating}
                  </Badge>
                )}
                {info.stats?.quality && (
                  <Badge className="bg-gradient-to-r from-zinc-700 to-zinc-600 text-white text-xs px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm">
                    {info.stats.quality}
                  </Badge>
                )}
                {info.stats?.episodes?.sub && (
                  <Badge className="bg-gradient-to-r from-pink-600 to-pink-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-pink-400/30 backdrop-blur-sm font-semibold">
                    SUB {info.stats.episodes.sub}
                  </Badge>
                )}
                {info.stats?.episodes?.dub && (
                  <Badge className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-blue-400/30 backdrop-blur-sm font-semibold">
                    DUB {info.stats.episodes.dub}
                  </Badge>
                )}
                {info.stats?.episodes?.eps && (
                  <Badge className="bg-gradient-to-r from-zinc-700 to-zinc-600 text-white text-xs px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm">
                    {info.stats.episodes.eps}
                  </Badge>
                )}
                <span className="text-zinc-500 mx-1">•</span>
                <span className="text-zinc-400 text-sm">{info.stats?.type || "TV"}</span>
                {moreInfo?.duration && (
                  <>
                    <span className="text-zinc-500 mx-1">•</span>
                    <span className="text-zinc-400 text-sm">{moreInfo.duration}</span>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                <Link to={`/watch/${animeId}`}>
                  <Button className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-full px-8 py-3 text-base font-semibold flex items-center gap-2 shadow-lg shadow-pink-500/40 hover:shadow-pink-500/60 transition-all border border-pink-400/30 backdrop-blur-sm">
                    <PlayIcon />
                    Watch now
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="bg-white/10 border border-white/30 text-white hover:bg-white/20 rounded-full px-8 py-3 text-base font-semibold flex items-center gap-2 backdrop-blur-sm transition-all hover:border-white/50"
                >
                  <PlusIcon />
                  Add to List
                </Button>
              </div>

              {/* Description */}
              <div className="mb-4">
                <p className="text-zinc-300 text-sm leading-relaxed">
                  {showFullDescription ? description : truncatedDescription}
                  {description.length > 300 && (
                    <button 
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-pink-400 hover:text-pink-300 ml-1 font-medium"
                    >
                      {showFullDescription ? "- Less" : "+ More"}
                    </button>
                  )}
                </p>
              </div>

              {/* Promotional text */}
              <p className="text-zinc-400 text-xs mb-4">
                Shirayuki is the best site to watch <span className="text-pink-400 font-medium">{info.name}</span> SUB online, or you can even watch{" "}
                <span className="text-pink-400 font-medium">{info.name}</span> DUB in HD quality.
                {moreInfo?.studios && (
                  <> You can also find <span className="text-pink-400 font-medium">{moreInfo.studios}</span> anime on Shirayuki website.</>
                )}
              </p>
            </div>

            {/* Right Sidebar - Info Panel */}
            <div className="w-full lg:w-[280px] xl:w-[320px] flex-shrink-0">
              <div className="bg-white/5 backdrop-blur-2xl rounded-2xl p-6 space-y-3 text-sm border border-white/15 shadow-lg shadow-black/10">
                {moreInfo?.japanese && (
                  <InfoRow label="Japanese">{moreInfo.japanese}</InfoRow>
                )}
                {moreInfo?.synonyms && (
                  <InfoRow label="Synonyms">{moreInfo.synonyms}</InfoRow>
                )}
                {moreInfo?.aired && (
                  <InfoRow label="Aired">{moreInfo.aired}</InfoRow>
                )}
                {moreInfo?.premiered && (
                  <InfoRow label="Premiered">{moreInfo.premiered}</InfoRow>
                )}
                {moreInfo?.duration && (
                  <InfoRow label="Duration">{moreInfo.duration}</InfoRow>
                )}
                {moreInfo?.status && (
                  <InfoRow label="Status">{moreInfo.status}</InfoRow>
                )}
                {moreInfo?.malscore && (
                  <InfoRow label="MAL Score">
                    <span className="text-yellow-400">{moreInfo.malscore}</span>
                  </InfoRow>
                )}
                
                {/* Genres */}
                {moreInfo?.genres && moreInfo.genres.length > 0 && (
                  <div className="pt-2">
                    <span className="text-zinc-400 font-medium">Genres:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {moreInfo.genres.map((genre) => (
                        <Link key={genre} to={`/genre/${genre.toLowerCase()}`}>
                          <Badge
                            variant="outline"
                            className="border-zinc-600 text-zinc-300 hover:bg-pink-500 hover:border-pink-500 hover:text-white cursor-pointer transition-colors text-xs"
                          >
                            {genre}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Studios */}
                {moreInfo?.studios && (
                  <div className="pt-2">
                    <InfoRow label="Studios">
                      <Link to={`/producer/${moreInfo.studios.toLowerCase().replace(/\s+/g, '-')}`} className="text-pink-400 hover:text-pink-300">
                        {moreInfo.studios}
                      </Link>
                    </InfoRow>
                  </div>
                )}
                
                {/* Producers */}
                {moreInfo?.producers && moreInfo.producers.length > 0 && (
                  <div className="pt-2">
                    <span className="text-zinc-400 font-medium">Producers:</span>
                    <div className="flex flex-wrap gap-x-1 mt-1">
                      {moreInfo.producers.map((producer, index) => (
                        <span key={producer}>
                          <Link 
                            to={`/producer/${producer.toLowerCase().replace(/\s+/g, '-')}`}
                            className="text-pink-400 hover:text-pink-300"
                          >
                            {producer}
                          </Link>
                          {index < moreInfo.producers.length - 1 && <span className="text-zinc-500">, </span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Seasons */}
        {seasons && seasons.length > 1 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-white mb-4">Seasons</h2>
            <div className="relative group w-full">
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 sm:h-10 sm:w-10 rounded-full border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity -ml-3 sm:-ml-5 hidden sm:flex"
                onClick={scrollSeasonsLeft}
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 sm:h-10 sm:w-10 rounded-full border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity -mr-3 sm:-mr-5 hidden sm:flex"
                onClick={scrollSeasonsRight}
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div
                ref={seasonsScrollRef}
                className="flex gap-4 pb-4 overflow-x-auto scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {seasons.map((season) => (
                  <div key={season.id} className="w-30 sm:w-34 flex-shrink-0">
                    <AnimeCard anime={{
                      id: season.id,
                      poster: season.poster,
                      name: season.title,
                      episodes: season.episodes,
                      type: season.type,
                      rank: season.rank,
                    }} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

          {/* Tabs for Related Content */}
          <Tabs defaultValue="related" className="mt-12">
            <TabsList className="bg-zinc-900/50 border border-zinc-800">
              <TabsTrigger value="related" className="data-[state=active]:bg-pink-500 text-white">Related</TabsTrigger>
              <TabsTrigger value="characters" className="data-[state=active]:bg-pink-500 text-white">Characters</TabsTrigger>
              <TabsTrigger value="recommended" className="data-[state=active]:bg-pink-500 text-white">Recommended</TabsTrigger>
            </TabsList>

            {/* Related Anime */}
            <TabsContent value="related" className="mt-6">
              {relatedAnimes && relatedAnimes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {relatedAnimes.map((anime, index) => (
                    <SmallAnimeCard key={anime.id} anime={anime} index={index} />
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500">No related anime found.</p>
              )}
            </TabsContent>

            {/* Characters */}
            <TabsContent value="characters" className="mt-6">
              {info.charactersVoiceActors && info.charactersVoiceActors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {info.charactersVoiceActors.slice(0, 12).map((item, index) => (
                    <CharacterCard
                      key={index}
                      character={item.character}
                      voiceActor={item.voiceActor}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500">No character information available.</p>
              )}
            </TabsContent>

            {/* Recommended */}
            <TabsContent value="recommended" className="mt-6">
              {recommendedAnimes && recommendedAnimes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {recommendedAnimes.slice(0, 12).map((anime, index) => (
                    <SmallAnimeCard key={anime.id} anime={anime} index={index} />
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500">No recommendations found.</p>
              )}
            </TabsContent>
          </Tabs>

          {/* Promotional Videos */}
          {info.promotionalVideos && info.promotionalVideos.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-white mb-4">Promotional Videos</h2>
              <ScrollArea className="w-full">
                <div className="flex gap-4 pb-4">
                  {info.promotionalVideos.map((video, index) => (
                    <a
                      key={index}
                      href={video.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 group"
                    >
                      <div className="relative w-64 h-36 rounded-lg overflow-hidden">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center">
                            <PlayIcon />
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-400 mt-2">{video.title || `PV ${index + 1}`}</p>
                    </a>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </section>
          )}

          {/* Most Popular */}
          {mostPopularAnimes && mostPopularAnimes.length > 0 && (
            <section className="mt-12 mb-12">
              <h2 className="text-xl font-bold text-white mb-4">Most Popular Anime</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {mostPopularAnimes.slice(0, 10).map((anime, index) => (
                  <SmallAnimeCard key={anime.id} anime={anime} index={index} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
