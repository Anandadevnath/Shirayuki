/**
 * Passthrough image loader.
 *
 * AnimeX serves posters/banners from many rotating CDN hosts
 * (s4.anilist.co, cdn.anipixcdn.co, cdn.anizara.store, …) that can't be
 * exhaustively allow-listed in next.config. A custom loader lets <Image>
 * render any host while keeping lazy-loading + layout behaviour. The source
 * images are already CDN-optimised (webp/jpg at cover size), so we serve them
 * as-is rather than routing through the Next optimiser.
 */
export default function shirayukiImageLoader({ src }: { src: string; width: number; quality?: number }) {
  return src;
}
