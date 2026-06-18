"use client";

import { useRef, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils/cn";

/**
 * next/image with a built-in blur-up: until the bitmap decodes, a frost shimmer
 * sits in the exact same box (no layout shift), then the real image fades + eases
 * up from a hair of scale. Cached images that are already complete at mount skip
 * straight to loaded, so a warm cache shows no flash.
 *
 * Drop-in for <Image fill> usages — the wrapper is `absolute inset-0` so it fills
 * a positioned parent just like a bare `fill` image did.
 */
export function SmartImage({
  className,
  wrapperClassName,
  onLoad,
  ...props
}: ImageProps & { wrapperClassName?: string }) {
  const [loaded, setLoaded] = useState(false);
  // If the element is already complete (HTTP cache / instant decode), the
  // onLoad event may have fired before hydration — detect it on first paint.
  const imgRef = useRef<HTMLImageElement>(null);
  const ready = (el: HTMLImageElement | null) => {
    imgRef.current = el;
    if (el?.complete && el.naturalWidth > 0 && !loaded) setLoaded(true);
  };

  return (
    <span aria-hidden className={cn("absolute inset-0 overflow-hidden", wrapperClassName)}>
      {/* Shimmer placeholder — cross-fades out as the image fades in. */}
      <span
        className={cn(
          "absolute inset-0 bg-surface-2 shimmer transition-opacity duration-500 ease-out",
          loaded && "opacity-0",
        )}
      />
      <Image
        {...props}
        ref={ready}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        className={cn(
          "transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform]",
          loaded
            ? "scale-100 opacity-100 blur-0"
            : "scale-[1.04] opacity-0 blur-md motion-reduce:blur-0",
          className,
        )}
      />
    </span>
  );
}
