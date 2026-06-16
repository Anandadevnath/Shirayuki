"use client";

import { useEffect, useRef } from "react";

/**
 * Cheap, GPU-light falling-snow canvas. Off under prefers-reduced-motion,
 * pauses when the tab is hidden, density capped. Pure ambiance — pointer-none.
 */
export function SnowLayer() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Flake = { x: number; y: number; r: number; vy: number; vx: number; o: number };
    let flakes: Flake[] = [];

    function size() {
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      const count = Math.min(70, Math.floor(window.innerWidth / 22));
      flakes = Array.from({ length: count }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        r: (Math.random() * 1.6 + 0.6) * dpr,
        vy: (Math.random() * 0.4 + 0.2) * dpr,
        vx: (Math.random() - 0.5) * 0.25 * dpr,
        o: Math.random() * 0.4 + 0.25,
      }));
    }

    function frame() {
      if (!running) return;
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (const f of flakes) {
        f.y += f.vy;
        f.x += f.vx;
        if (f.y > canvas!.height) {
          f.y = -f.r;
          f.x = Math.random() * canvas!.width;
        }
        ctx!.beginPath();
        ctx!.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(226, 240, 255, ${f.o})`;
        ctx!.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    function onVisibility() {
      running = !document.hidden;
      if (running) frame();
      else cancelAnimationFrame(raf);
    }

    size();
    frame();
    window.addEventListener("resize", size);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-dvh w-full opacity-50"
    />
  );
}
