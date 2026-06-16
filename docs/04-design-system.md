# 04 — Design System & Brand: "Sode no Shirayuki"

The identity is the moat. Every competitor is dark-grey + purple gradient. We are **snow, ice, and Japanese minimalism** — cold, clean, premium. Calm surfaces, one glacial accent, generous space, restrained motion.

---

## §1 — Brand identity

- **Name:** Sode no Shirayuki (袖白雪) — "Sleeve White Snow," Rukia's zanpakutō, *the most beautiful in Soul Society*. Short forms: **Shirayuki**, **白雪**.
- **Personality:** serene, precise, premium, quietly confident. Think a fresh snowfield at dusk — not a neon arcade.
- **Tagline options:** *"Some no mai, Tsukishiro."* (flavor) · "Anime, in pure focus." · "Watch in white silence."
- **Logo direction:** a single snowflake/crystal mark built from clean geometric strokes (6-fold symmetry), or a minimal 雪 brushstroke. Monochrome snow-white on dark; frost-cyan glow only on hover. Avoid mascots and sword clutter (the old app's `tanjiro.png`/`sword.png` are off-brand — retire them).
- **Voice:** terse, elegant, a little poetic. Empty states and toasts can carry winter metaphors ("Nothing here yet — fresh snow.") but never cutesy.
- **Motifs (use sparingly):** falling-snow particle layer (off by default / reduced-motion aware), frost-edge dividers, crystalline hover glints, a subtle grain/noise on large dark surfaces to avoid banding.

## §2 — Color palette (dark-first, OKLCH)

Cool near-black surfaces (never pure `#000`), snow-white text, **one** glacial accent. Sakura is a whisper, used only for "new/airing" accents.

```css
/* globals.css — Tailwind v4 @theme (generates utilities) */
@import "tailwindcss";

@theme {
  /* Surfaces — glacial slate, faint blue undertone, stepped elevation */
  --color-base:        oklch(0.16 0.012 250);   /* app background     ~#0E1116 */
  --color-surface:     oklch(0.20 0.013 250);   /* cards              ~#161A21 */
  --color-surface-2:   oklch(0.24 0.014 250);   /* raised / hover     ~#1E232C */
  --color-overlay:     oklch(0.18 0.012 250 / 0.72); /* glass base */
  --color-line:        oklch(0.30 0.015 250);   /* hairline borders   ~#2A303B */

  /* Foreground — snow */
  --color-snow:        oklch(0.97 0.004 240);   /* primary text       ~#F2F5F9 */
  --color-muted:       oklch(0.74 0.012 245);   /* secondary text     ~#A6AEBC */
  --color-faint:       oklch(0.56 0.012 248);   /* tertiary / icons   ~#6E7686 */

  /* Brand — frost (the ONE accent) */
  --color-frost:       oklch(0.82 0.12 215);    /* primary accent     ~#7FD8EE */
  --color-frost-deep:  oklch(0.64 0.15 245);    /* gradient pair      ~#4C8FE0 */
  --color-frost-soft:  oklch(0.82 0.12 215 / 0.14); /* tint bg/rings */

  /* Sakura — whisper accent, "new/airing" only */
  --color-sakura:      oklch(0.83 0.07 350);    /* pale plum          ~#E9C2D6 */

  /* Semantic */
  --color-success:     oklch(0.80 0.13 165);    /* mint */
  --color-warning:     oklch(0.84 0.12 85);     /* amber */
  --color-danger:      oklch(0.68 0.18 25);     /* cold rose */
}
```

**Usage rules**
- **One accent.** `frost` for interactive/active/focus. Gradients = `frost → frost-deep` only, and only on hero/brand moments. No rainbow gradients (the old app's purple→pink→cyan is banned).
- **Contrast:** body text `snow` on `base` ≈ 14:1; `muted` ≈ 6:1 (AA+). Never put `frost` text on `base` for body copy (decorative only).
- **Elevation by surface step + hairline**, not by heavy shadow. Shadows are soft, cool, low-opacity.
- **Sakura ≤ 5% of any screen.** It marks "airing now" / "new episode," nothing else.

## §3 — Typography

Pairing: a crisp variable grotesque for UI, a Japanese-designed gothic for display (anime-appropriate, not childish), an optional mincho serif for editorial flourish, a clean mono for data.

| Role | Font | Why |
|---|---|---|
| UI / body | **Geist Sans** (variable) | Crisp, neutral, fast, free; `next/font` self-host |
| Display / headings / brand | **Zen Kaku Gothic New** | Japanese-designed geometric gothic; elegant, supports JP glyphs (袖白雪) |
| Editorial accent (optional) | **Shippori Mincho** | Mincho serif for episode titles / pull-quotes — premium print feel |
| Mono / data | **Geist Mono** | Timestamps, durations, technical chips |

```css
@theme {
  --font-sans:    "Geist Sans", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Zen Kaku Gothic New", var(--font-sans);
  --font-serif:   "Shippori Mincho", ui-serif, serif;
  --font-mono:    "Geist Mono", ui-monospace, monospace;
}
```

- **Self-host via `next/font/google`** (`display: 'swap'`, subset latin + latin-ext; add `japanese` subset for the brand/display where needed). Zero layout shift.
- **Scale (modular, ~1.2 minor third):** 12 / 14 / 16(base) / 19 / 23 / 28 / 34 / 48 / 60. Hero can go larger with tight tracking.
- **Rules:** display gets **tight tracking** (`-0.02em`) + balanced wrap (`text-wrap: balance` on headings, `pretty` on paragraphs). Line-height 1.5 body / 1.1–1.2 display. Numerals: `tabular-nums` for durations/counts.

## §4 — Spacing, radii, shadows, layout

```css
@theme {
  /* 4px base rhythm */
  --spacing: 0.25rem; /* Tailwind v4 derives the scale from this */

  --radius-sm: 0.5rem;   /* chips, inputs */
  --radius-md: 0.875rem; /* cards */
  --radius-lg: 1.25rem;  /* panels, modals */
  --radius-xl: 1.75rem;  /* hero, player shell */

  --shadow-frost: 0 8px 30px -12px oklch(0.64 0.15 245 / 0.35);
  --shadow-soft:  0 4px 24px -10px oklch(0 0 0 / 0.5);
}
```

- **Grid:** 12-col, max content width ~1280–1440px, gutters 16/24/32 responsive. Card rails are horizontally scrollable with snap.
- **Radii: pick ONE per element class and never mix** (the old app used 5 radii randomly). Cards = `md`, panels/modals = `lg`, hero/player = `xl`.
- **Density:** generous. Section vertical rhythm ≥ 64px desktop / 40px mobile. Let the snow breathe.

## §5 — Motion (with Motion / `motion`)

Restraint is the brand. Motion should feel like *settling snow*, not a fireworks show.

- **Durations:** 120ms (micro: hover, press) · 200–260ms (enter/exit, page transitions) · ≤ 400ms (hero/reveal). Nothing slower in interactive paths.
- **Easing:** springs for physical UI (`stiffness ~260, damping ~26`); `ease-out` for entrances, `ease-in` for exits.
- **Signature interactions:** card hover = lift 2–3px + subtle frost glow + poster scale 1.03; nav/active = frost underline that slides; skeletons shimmer with a cold sheen; "new episode" pip gets a slow sakura pulse.
- **Snow particle layer:** GPU-cheap canvas, **off under `prefers-reduced-motion`**, density capped, pauses when tab hidden.
- **Hard rule:** **every animation respects `prefers-reduced-motion`** (the old app respected none). No autoplaying motion on content the user is trying to read.

## §6 — Glassmorphism (where it's allowed)

Glass only over imagery/video, never over flat surfaces (that's where it looks cheap).

- ✅ Allowed: sticky top nav over hero, **player control bar**, `⌘K` command palette, modal scrims, "airing now" hero overlay, toast stack.
- ❌ Banned: content cards, list rows, forms, settings panels (use solid `surface` + hairline).
- Recipe: `background: var(--color-overlay); backdrop-filter: blur(16px) saturate(1.1); border: 1px solid var(--color-line); box-shadow: var(--shadow-soft);` Keep blur ≤ 20px (perf).

## §7 — Core component kit (shadcn/ui base, restyled)

Build on shadcn (Radix) so a11y is free, then skin to the tokens above.

- **AnimeCard** — ONE component, `variant: 'poster' | 'spotlight' | 'row' | 'episode'`, `size`, optional badges (sub/dub, type, rating, **filler/canon**, "airing"). Replaces the old app's 5 cards.
- **Rail** — horizontally scrollable, snap, lazy, arrows on desktop / swipe on mobile, "see all" affordance.
- **Player shell** — glass controls, quality menu, server menu, sub/dub toggle, skip-intro/outro buttons, speed, subtitle-style sheet, PiP, settings; keyboard + `?` help overlay.
- **CommandPalette (`⌘K`)** — search anime, jump to pages, recent, actions.
- **EpisodeList** — virtualized, range tabs (`001-012`…), filler markers, watched ticks, search.
- **Primitives** — Button (frost primary / ghost / outline), Badge, Chip, Tabs, Sheet, Dialog, Tooltip, Skeleton, Toast, Pagination, Avatar, Progress, Switch, Select, Slider, ScrollArea.
- **States kit** — Loading (frost shimmer skeletons), Empty ("fresh snow"), Error (with retry + alternate server), Offline. Never a dead-end.

**Design-token discipline:** colors/space/radii/type **only** from `@theme` tokens. No arbitrary hex, no one-off radii, no inline magic numbers. This single rule fixes the old app's biggest visual problem (inconsistency).
