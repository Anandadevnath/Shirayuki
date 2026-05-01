# 🌸 Shirayuki

<p align="center">
<img src="public/logo/shirayuki1.png" alt="Shirayuki Banner" width="220" />
</p>
<p align="center">
<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React" />
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
<img src="https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router" alt="React Router" />
<img src="https://img.shields.io/badge/HLS.js-FFFFFF?style=for-the-badge&logo=javascript" alt="HLS.js" />
<img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js" alt="Node.js" />
<img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License" />
</p>

> **Shirayuki** (白雪) — *meaning "white snow"* — is a sleek, modern anime streaming platform where discovery meets devotion. Built for true otaku and casual watchers alike, it brings the anime universe to your fingertips with blazing speed, stunning visuals, and an experience that feels like home.

---

## ✨ Why Shirayuki Stands Out

- 🚀 **Lightning-Fast Experience** — React 19 + Vite delivers buttery-smooth navigation with instant hot reloads
- 🎨 **Eye-Catching Interface** — Dark/light modes, fluid animations, and a responsive layout that looks great on any device
- 🔎 **Smart Search Engine** — Find anime by title, genre, studio, or mood with instant autocomplete and powerful filters
- 📅 **Seasonal Calendar** — Never miss a release! Track current and upcoming anime by season
- 🅰️ **A-to-Z Library** — Explore an exhaustive alphabetical catalog with smooth pagination
- 🏭 **Studio Deep Dives** — Discover the creators behind your favorites with dedicated producer pages
- 👤 **Personal Watch Hub** — Save favorites, track progress, and customize your profile
- 📺 **Crystal-Clear Streaming** — Multi-server HLS playback with adaptive quality and subtitle support
- 🔐 **Complete Auth System** — Secure signup, email verification, password recovery, and account management
- ⌨️ **Keyboard Controls** — Play, pause, seek, and volume control without leaving the keyboard
- 📱 **Mobile-First Design** — Fully responsive from phone to 4K desktop
- ⚡ **Performance Engineering** — Lazy loading, code splitting, and optimized assets for minimal load times

---

## 📂 Project Architecture

```
src/
├── components/          # Reusable UI components
│   ├── az/             # A-Z listing components
│   ├── category/       # Category browsing components
│   ├── details/        # Anime details components
│   ├── genre/          # Genre filtering components
│   ├── home/           # Homepage components
│   ├── layout/         # Layout components (navbar, footer)
│   ├── producer/       # Studio/producer components
│   ├── profile/        # User profile components
│   ├── ui/             # Base UI components (buttons, cards, etc.)
│   ├── videoPlayer/    # Video player components
│   └── watch/          # Watch page components
├── context/            # React context providers
│   └── api/            # API configuration and endpoints
├── pages/              # Page components (routes)
├── lib/                # Utility functions
└── css/                # Additional CSS files
```

---

## 🛠️ Quick Start

### What You Need
- Node.js 18+
- npm or yarn

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-username/shirayuki.git
cd shirayuki

# 2. Install dependencies
npm install
# or
yarn install

# 3. Configure environment
cp .env.example .env
# Edit .env with your API URLs:
# VITE_API_BASE_URL=http://localhost:3000
# VITE_PROXY_URL=http://localhost:3000/api/v2/hianime/proxy

# 4. Launch
npm run dev
# Visit http://localhost:5173
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📜 NPM Scripts

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start local dev server |
| `npm run build` | Create production bundle |
| `npm run lint` | Run ESLint checks |
| `npm run preview` | Preview production build |

---

## 🔌 Backend Integration

All API routes live in `src/context/api/endpoints.js`.

| Feature | Endpoint Key | Purpose |
|---------|--------------|---------|
| **Anime** | `HOME` | Homepage spotlight & trending |
| | `ANIME_DETAILS` | Full anime info |
| | `ANIME_EPISODES` | Episode list |
| | `AZ_LIST` | Alphabetical browse |
| **Search** | `SEARCH` | Basic search |
| | `SEARCH_ADVANCED` | Filtered search |
| | `SEARCH_SUGGESTION` | Autocomplete |
| **Browse** | `GENRE` | By genre |
| | `CATEGORY` | By category |
| | `PRODUCER` | By studio |
| **Schedule** | `SCHEDULE` | Release calendar |
| **Player** | `EPISODE_SERVERS` | Server list |
| | `EPISODE_SOURCES` | Stream URLs |
| **User** | `AUTH.*`, `USER.*`, `PROGRESS.*` | Auth & profile |

---

## 🎬 Video Player Highlights

The custom player (`src/components/videoPlayer/`) packs:

- HLS.js adaptive streaming
- Keyboard shortcuts (Space = play/pause, ← → = seek)
- Subtitle selection
- Quality picker
- Picture-in-Picture mode
- Animated, custom controls

---

## 🤝 Want to Contribute?

1. 🍴 Fork the repo
2. 🌿 Create a branch: `git checkout -b feat/amazing-feature`
3. 📦 Install deps: `npm install`
4. 🔥 Dev server: `npm run dev`
5. ✏️ Make your changes
6. ✅ Lint: `npm run lint`
7. 💾 Commit: `git commit -m "feat: add amazing feature"`
8. 📤 Push & open a PR

### PR Tips
- Keep linting green
- Update docs if needed
- One feature per PR
- Write clear descriptions

---

## � MIT License

This project is open source under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<div align="center">

### 🌸 Stream Without Boundaries

**If Shirayuki brought joy to your anime journey, a ⭐ star would mean the world!**

</div>