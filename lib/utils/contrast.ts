/**
 * WCAG contrast helpers for the design-token palette.
 *
 * The app's colours are authored in OKLCH (`app/globals.css` `@theme`). To
 * assert accessibility we convert an `oklch(L C h)` triple to sRGB, then to
 * relative luminance, then to a WCAG 2.1 contrast ratio. This mirrors the
 * browser's colour math closely enough to catch a regression (a token drifting
 * below 4.5:1) without needing a canvas.
 *
 * Pure + provider-free so it stays importable under `node:test` (which cannot
 * resolve the bundler's extensionless imports).
 */

/** Parse `oklch(0.74 0.012 245)` / `oklch(0.8 0.12 215 / 0.14)` → [L, C, h, a]. */
export function parseOklch(value: string): [number, number, number, number] {
  const m = value.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)/);
  if (!m) throw new Error(`Not an oklch() colour: ${value}`);
  return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] ? Number(m[4]) : 1];
}

/** OKLCH → sRGB in [0,1]. Out-of-gamut channels are clamped, matching CSS. */
export function oklchToRgb(L: number, C: number, hDeg: number): [number, number, number] {
  const hr = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);

  // Oklab → LMS'
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  // LMS → linear sRGB
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return [r, g, bl].map((v) => Math.max(0, Math.min(1, v))) as [number, number, number];
}

/** WCAG relative luminance of an sRGB channel triple (0..1). */
export function relativeLuminance([r, g, b]: [number, number, number]): number {
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** WCAG 2.1 contrast ratio (1..21) between two sRGB triples. */
export function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
  const a = relativeLuminance(fg);
  const b = relativeLuminance(bg);
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

/** Alpha-composite `fg` over `bg` (both sRGB 0..1) at `alpha`. */
export function composite(
  fg: [number, number, number],
  bg: [number, number, number],
  alpha: number,
): [number, number, number] {
  return fg.map((v, i) => v * alpha + bg[i] * (1 - alpha)) as [number, number, number];
}

/** Convenience: contrast ratio between two `oklch()` strings. */
export function oklchContrast(fgOklch: string, bgOklch: string): number {
  const [fl, fc, fh] = parseOklch(fgOklch);
  const [bl, bc, bh] = parseOklch(bgOklch);
  return contrastRatio(oklchToRgb(fl, fc, fh), oklchToRgb(bl, bc, bh));
}

/** WCAG AA threshold for normal body text. */
export const AA_NORMAL = 4.5;
/** WCAG AA threshold for large text (≥18.66px bold / ≥24px). */
export const AA_LARGE = 3;
