/** Format seconds → "M:SS" or "H:MM:SS". */
export function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const s = Math.floor(totalSeconds % 60);
  const m = Math.floor((totalSeconds / 60) % 60);
  const h = Math.floor(totalSeconds / 3600);
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}

/** "12 / 24" style sub·dub counts, omitting nulls. */
export function epLabel(sub?: number | null, dub?: number | null): string {
  const parts: string[] = [];
  if (sub) parts.push(`SUB ${sub}`);
  if (dub) parts.push(`DUB ${dub}`);
  return parts.join(" · ");
}

export function truncate(text: string, max = 180): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}
