# 02 — Market Research, Community Insight & Competitor Teardown

Sources: r/anime, r/animepiracy sentiment via aggregators, MyAnimeList & AniList forums, AlternativeTo, the Miruro GitHub README, and the Shiru/Hayase/Anime-Filler-Checker feature sets. Where a specific domain had no review footprint (anixo.online, kitsunee.moe — newer/rotating pirate domains), analysis is by archetype. Links at the bottom.

---

## §1 — What users LOVE

- **A player that just works**: instant load, no buffering, quality switching, no redirects. Repeatedly the #1 factor.
- **Skip intro / skip outro buttons** — table stakes now; users specifically seek sites that have them.
- **Autoplay next episode** + **continue watching** that remembers position *across devices*.
- **Sub AND dub**, clearly labeled, with the choice **remembered**.
- **Clean, minimal, fast UI** with **dark mode** (Miruro is praised exactly for "cutting-edge, minimalist design").
- **Organized watch history** — filterable by title/time (Miruro's history is a cited highlight).
- **AniList sync** — login, auto-update progress to your list. Big retention driver.
- **Trending with real signals** (bookmarks count, ranking).
- **Good search** with instant suggestions, posters, and fuzzy matching.
- **Mobile responsiveness** that feels native, not a squished desktop.

## §2 — What users HATE

- **Ads, popups, redirects** — the single most hated thing about pirate sites. (Our edge: we have none.)
- **Slow loading & constant buffering.**
- **Broken/dead streams & servers** with no graceful fallback ("server down, try another" hidden or missing).
- **Needing to refresh for content to load** (a known Miruro wart — don't repeat it).
- **Dated, cluttered UIs** (MAL is the canonical "likes to be outdated" complaint).
- **Weak search**, bad recommendations, missing continue-watching.
- **Players worse than pirate sites** — even Crunchyroll gets mocked for "a single play button," no server choice.
- **Poor mobile UX**, accidental taps, no gestures.
- **Excessive animation / motion** with no respect for reduced-motion.
- **Spoilers in thumbnails** on episode lists / seek previews (double-edged — offer a hide toggle).

## §3 — Quality-of-life features users beg for (and almost nobody ships)

These are the cheap-to-build, high-love wins. **Shipping even half of these is our differentiation.**

1. **Remember sub/dub preference** globally.
2. **Remember preferred server** and auto-select it; auto-fallback when it's down *with a visible note*.
3. **Filler / canon / mixed episode markers** (cross-ref AnimeFillerList) — hugely requested, rarely built.
4. **Skip-to-next-canon** for filler-skippers.
5. **Next-episode countdown** for currently-airing shows (we have the schedule API).
6. **Seek-bar preview thumbnails** (Shiru/Hayase praised for this).
7. **Picture-in-Picture** + miniplayer + media-session keys.
8. **Keyboard shortcuts** + a discoverable `?` help overlay.
9. **Playback speed** control with memory.
10. **Subtitle styling** (size, color, background, position) + remembered.
11. **"Mark as watched" / un-watch** per episode, independent of playback.
12. **Resume prompt** ("Resume from 12:34?" vs silent seek) — and a setting to auto-resume.
13. **AniList/MAL sync** of progress and scores.
14. **Cross-device sync** that's actually reliable.
15. **Download / cache for offline** (stretch).
16. **Hide-thumbnail / spoiler-safe mode**.
17. **Watch party** (stretch, high social value).

## §4 — Competitor teardown

### Miruro (miruro.tv / .to) — the bar to beat
- **Stack:** React + Vite + styled-components, Consumet provider, Bun, Vercel/Cloudflare. Open-source (BY-NC).
- **Loves:** minimalist design, AniList sync, continue-watching, filterable watch history, autoplay, skip op/ed, theater mode, force-max-quality, auto-skip, trending with bookmark counts, ad-free, no-account episode downloads.
- **Avoid:** "refresh the page for content to load," recommends an ad-blocker to stop redirects (provider-level), styled-components runtime cost.
- **Takeaway:** match its feature set, beat it on **reliability, motion design, and identity**. It's clean but generic; it has no memorable brand.

### Anixo (anixo.online) — archetype
- Modern HiAnime-style HLS streamer; thin review footprint (newer domain). Typical of the category: decent catalog, generic dark UI, provider-dependent reliability, ad/redirect risk.
- **Opportunity:** same content, dramatically better polish + trust (no ads, transparent server status).

### Kitsunee (kitsunee.moe) — archetype
- "Kitsune"-family open-source projects exist on **Next.js + Tailwind**, branding around "no ads, no popups, no redirects." Confirms the stack direction we're choosing and that "clean + ad-free" is a real positioning users notice.
- **Opportunity:** out-design it; lean into the winter/ice identity none of them have.

### Trackers (what to emulate, not compete with)
- **AniList:** real-time updates, 5 scoring systems, built-in stats, dark mode, tags/genre sorting, global feed. The modern QoL benchmark — and our **sync target**.
- **MAL:** powerful layout, alive forums, huge inertia. Secondary sync target.
- **SIMKL / Shiru / Hayase:** built-in **filler tools**, thumbnail seek, chapter-aware seekbar, PiP, filler/recap skip prompts. These are our **player feature blueprint**.

## §5 — Our unique differentiators ("why doesn't every site have this?")

| # | Differentiator | Why it wins |
|---|---|---|
| D1 | **A real identity** (Sode no Shirayuki — snow/ice/Japanese premium) | Every competitor is generic dark+purple. Memorability = retention. |
| D2 | **`⌘K` "Frost" command palette** | Instant search + jump-to-anime + actions. SaaS-grade, anime-rare. |
| D3 | **Filler/canon markers + skip-to-canon** | Begged for, almost never shipped. |
| D4 | **Trustworthy Continue Watching** (local-first, accurate next-up, resume prompt) | The feature users miss most when it's broken. |
| D5 | **AniList sync** | Highest-leverage retention feature in the space. |
| D6 | **Seek-bar preview thumbnails + PiP + remembered prefs** (sub/dub, server, speed, subs styling) | Premium player feel. |
| D7 | **Skip intro/outro from API-provided timings** + auto-skip memory | We already get `intro{start,end}` / `outro{start,end}` from `sources`. |
| D8 | **Mood/vibe discovery** (browse by tag clusters, not just genre grids) | Discovery that feels personal. |
| D9 | **Season Radar** — interactive seasonal calendar + airing countdowns | Uses the schedule API; nobody makes this beautiful. |
| D10 | **Transparent reliability** — visible server health, instant fallback, no dead-end errors | Directly attacks the #1 hate (broken streams). |

---

### Sources
- HiAnime status & shutdown — https://en.wikipedia.org/wiki/HiAnime
- Miruro repo (stack + features) — https://github.com/Miruro-no-kuon/Miruro
- Miruro alternatives / feature notes — https://alternativeto.net/software/miruro/
- Aniwave/RetroCrush ad & loading complaints — https://www.media.io/anime-tips/watch-anime-online-aniwave.html
- Crunchyroll player criticism (MAL forums) — https://myanimelist.net/forum/message/68314911?goto=topic
- HiAnime alternatives & feature roundup — https://www.kingshiper.com/screen-recording/hianime-alternatives.html
- AniList vs MAL QoL debate — https://anilist.co/forum/thread/12751
- Anime Filler Checker (filler markers) — https://chromewebstore.google.com/detail/anime-filler-checker/fnlpgfcmglenllblijbciadeldljjebj
- Shiru (thumbnails, chapter seekbar, filler skip) — https://github.com/RockinChaos/Shiru
- Hayase (PiP, seek-preview, filler indicators) — https://github.com/hayase-app
- Kitsune (Next.js + Tailwind, ad-free positioning) — https://github.com/Dovakiin0/animeworldz
