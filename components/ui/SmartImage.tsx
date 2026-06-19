import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils/cn";

/**
 * next/image with a built-in blur-up: until the bitmap decodes, a frost shimmer
 * sits in the exact same box (no layout shift), then the real image fades + eases
 * up from a hair of scale. Cached images that are already complete at mount skip
 * straight to loaded, so a warm cache shows no flash.
 *
 * Server Component — the fade-in is a pure CSS @keyframes that plays once on
 * mount. No React state, no re-render, no client boundary. Importing this from
 * a server component keeps the parent subtree server-rendered.
 *
 * Drop-in for <Image fill> usages — the wrapper is `absolute inset-0` so it fills
 * a positioned parent just like a bare `fill` image did.
 */
export function SmartImage({
  className,
  wrapperClassName,
  ...props
}: ImageProps & { wrapperClassName?: string }) {
  return (
    <span aria-hidden className={cn("absolute inset-0 overflow-hidden", wrapperClassName)}>
      {/* Shimmer placeholder — `.shimmer-stack` fades out as the image's
          `.image-stack` keyframe lands, so the two cross-fade in the same
          700ms window. Pure CSS, no React state. */}
      <span className="shimmer-stack absolute inset-0 bg-surface-2 shimmer" />
      <Image
        {...props}
        className={cn(
          "image-stack",
          "transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform]",
          "scale-100 opacity-100 blur-0",
          className,
        )}
      />
    </span>
  );
}
