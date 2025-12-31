import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getAnimeDetails } from "@/context/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Icons
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-500">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
);

// Small Anime Card
function SmallAnimeCard({ anime }) {
  return (
    <Link to={`/anime/${anime.id}`} className="block">
      <Card className="group overflow-hidden bg-zinc-900 border-zinc-800 hover:border-purple-500 transition-all duration-300">
        <div className="relative">
          <img
            src={anime.poster}
            alt={anime.name}
            className="w-full h-[200px] object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          {anime.episodes && (
            <div className="absolute bottom-2 left-2 flex gap-1">
              {anime.episodes.sub && (
                <Badge className="bg-yellow-600/90 text-white text-xs px-1.5">
                  SUB {anime.episodes.sub}
                </Badge>
              )}
              {anime.episodes.dub && (
                <Badge className="bg-blue-600/90 text-white text-xs px-1.5">
                  DUB {anime.episodes.dub}
                </Badge>
              )}
            </div>
          )}
          {anime.type && (
            <Badge className="absolute top-2 right-2 bg-purple-600 text-xs">
              {anime.type}
            </Badge>
          )}
        </div>
        <CardContent className="p-2">
          <h3 className="text-sm font-medium text-white truncate">{anime.name}</h3>
        </CardContent>
      </Card>
    </Link>
  );
}

// Character Card
function CharacterCard({ character, voiceActor }) {
  return (
    <div className="flex items-center gap-3 bg-zinc-900 rounded-lg p-3">
      <img
        src={character.poster}
        alt={character.name}
        className="w-14 h-14 rounded-full object-cover border-2 border-purple-500"
      />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{character.name}</p>
        <p className="text-zinc-500 text-xs">{character.cast}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-zinc-400 text-sm truncate">{voiceActor.name}</p>
          <p className="text-zinc-500 text-xs">{voiceActor.cast}</p>
        </div>
        <img
          src={voiceActor.poster}
          alt={voiceActor.name}
          className="w-12 h-12 rounded-full object-cover"
        />
      </div>
    </div>
  );
}

// Season Card
function SeasonCard({ season }) {
  return (
    <Link
      to={`/anime/${season.id}`}
      className={`flex-shrink-0 w-24 text-center group ${
        season.isCurrent ? "ring-2 ring-purple-500 rounded-lg" : ""
      }`}
    >
      <img
        src={season.poster}
        alt={season.name}
        className="w-24 h-32 object-cover rounded-lg group-hover:opacity-80 transition-opacity"
      />
      <p className="text-xs text-zinc-400 mt-1 truncate">{season.title}</p>
    </Link>
  );
}

// Loading Skeleton
function DetailsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-8">
        <Skeleton className="w-full lg:w-[300px] h-[450px] rounded-xl bg-zinc-800" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-10 w-3/4 bg-zinc-800" />
          <Skeleton className="h-6 w-1/2 bg-zinc-800" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 bg-zinc-800" />
            <Skeleton className="h-8 w-20 bg-zinc-800" />
            <Skeleton className="h-8 w-20 bg-zinc-800" />
          </div>
          <Skeleton className="h-32 w-full bg-zinc-800" />
          <Skeleton className="h-12 w-40 bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}

export default function AnimeDetails() {
  const { animeId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative h-[400px] overflow-hidden">
        <img
          src={info.poster}
          alt={info.name}
          className="w-full h-full object-cover blur-sm opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-72 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Poster */}
          <div className="flex-shrink-0">
            <img
              src={info.poster}
              alt={info.name}
              className="w-[250px] lg:w-[300px] h-auto rounded-xl shadow-2xl mx-auto lg:mx-0"
            />
            {/* Watch Button */}
            <Link to={`/watch/${animeId}`}>
              <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-lg py-6">
                <PlayIcon />
                <span className="ml-2">Watch Now</span>
              </Button>
            </Link>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">{info.name}</h1>
            {moreInfo?.japanese && (
              <p className="text-zinc-400 text-lg mb-4">{moreInfo.japanese}</p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-3 mb-4">
              {info.stats?.rating && (
                <Badge variant="outline" className="border-red-500 text-red-500">
                  {info.stats.rating}
                </Badge>
              )}
              {info.stats?.quality && (
                <Badge className="bg-green-600">{info.stats.quality}</Badge>
              )}
              {info.stats?.type && (
                <Badge variant="outline" className="border-zinc-500 text-zinc-300">
                  {info.stats.type}
                </Badge>
              )}
              {moreInfo?.malscore && (
                <Badge className="bg-yellow-600 flex items-center gap-1">
                  <StarIcon />
                  {moreInfo.malscore}
                </Badge>
              )}
            </div>

            {/* Episode Count */}
            <div className="flex gap-4 mb-4">
              {info.stats?.episodes?.sub && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Badge className="bg-yellow-600">SUB</Badge>
                  <span>{info.stats.episodes.sub} Episodes</span>
                </div>
              )}
              {info.stats?.episodes?.dub && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Badge className="bg-blue-600">DUB</Badge>
                  <span>{info.stats.episodes.dub} Episodes</span>
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {moreInfo?.aired && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <CalendarIcon />
                  <span className="text-sm">{moreInfo.aired.split(" to ")[0]}</span>
                </div>
              )}
              {moreInfo?.duration && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <ClockIcon />
                  <span className="text-sm">{moreInfo.duration}</span>
                </div>
              )}
              {moreInfo?.status && (
                <Badge
                  variant="outline"
                  className={`w-fit ${
                    moreInfo.status === "Currently Airing"
                      ? "border-green-500 text-green-500"
                      : "border-zinc-500 text-zinc-400"
                  }`}
                >
                  {moreInfo.status}
                </Badge>
              )}
              {moreInfo?.premiered && (
                <span className="text-sm text-zinc-400">{moreInfo.premiered}</span>
              )}
            </div>

            {/* Genres */}
            {moreInfo?.genres && (
              <div className="flex flex-wrap gap-2 mb-6">
                {moreInfo.genres.map((genre) => (
                  <Link key={genre} to={`/genre/${genre.toLowerCase()}`}>
                    <Badge
                      variant="outline"
                      className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white cursor-pointer transition-colors"
                    >
                      {genre}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Synopsis</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">{info.description}</p>
            </div>

            {/* More Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {moreInfo?.studios && (
                <div>
                  <span className="text-zinc-500">Studios:</span>
                  <span className="text-zinc-300 ml-2">{moreInfo.studios}</span>
                </div>
              )}
              {moreInfo?.producers && (
                <div>
                  <span className="text-zinc-500">Producers:</span>
                  <span className="text-zinc-300 ml-2">{moreInfo.producers.slice(0, 3).join(", ")}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seasons */}
        {seasons && seasons.length > 1 && (
          <section className="mt-12">
            <h2 className="text-xl font-bold text-white mb-4">Seasons</h2>
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-4">
                {seasons.map((season) => (
                  <SeasonCard key={season.id} season={season} />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>
        )}

        {/* Tabs for Related Content */}
        <Tabs defaultValue="related" className="mt-12">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="related">Related</TabsTrigger>
            <TabsTrigger value="characters">Characters</TabsTrigger>
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
          </TabsList>

          {/* Related Anime */}
          <TabsContent value="related" className="mt-6">
            {relatedAnimes && relatedAnimes.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {relatedAnimes.map((anime) => (
                  <SmallAnimeCard key={anime.id} anime={anime} />
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
                {recommendedAnimes.slice(0, 12).map((anime) => (
                  <SmallAnimeCard key={anime.id} anime={anime} />
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
                        <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
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
              {mostPopularAnimes.slice(0, 10).map((anime) => (
                <SmallAnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
