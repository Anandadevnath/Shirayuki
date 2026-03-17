# ❄️ Shirayuki

> The modern, beautiful anime streaming platform — built with React, Vite, and Tailwind CSS.

<p align="center">
  <img src="public/logo/shirayuki1.png" alt="Shirayuki Banner" width="800" />
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

## ✨ Features

- 🚀 **Blazing-fast UI** — Powered by Vite + React 19 with hot module replacement
- 🎨 **Gorgeous design** — Responsive layout with Tailwind CSS, dark/light theme support, and smooth animations
- 🔎 **Advanced search** — Search by anime, genres, categories, and filters with real-time suggestions
- 📅 **Seasonal schedules** — Track seasonal anime releases with calendar view
- 📋 **A-Z lists** — Browse anime alphabetically with pagination
- 🏢 **Studio/Producer pages** — Explore production details with studio logos and information
- 📝 **User profiles** — Track favorites, watch progress, and manage account settings
- 📺 **High-quality streaming** — Multiple server support with HLS.js for adaptive streaming
- 🔐 **Secure auth** — Authentication, email verification, password reset, and profile management
- ⌨️ **Keyboard shortcuts** — Control video playback with keyboard shortcuts
- 📱 **Mobile optimized** — Fully responsive design for all screen sizes
- ⚡ **Performance optimized** — Code splitting, image optimization, and efficient bundling

## 🗂️ Project Structure

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

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/shirayuki.git
   cd shirayuki
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your API base URL:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   VITE_PROXY_URL=http://localhost:3000/api/v2/hianime/proxy
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser** at [http://localhost:5173](http://localhost:5173)

### Building for Production

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run lint` | Lint the codebase with ESLint |
| `npm run preview` | Preview the production build locally |

## 🔌 API Integration

Shirayuki connects to a backend API for anime data and user management. All API endpoints are defined in `src/context/api/endpoints.js`.

### Key Endpoints

| Category | Endpoint | Description |
|----------|----------|-------------|
| **Anime** | `HOME` | Get homepage data (spotlight, trending, etc.) |
| | `ANIME_DETAILS` | Get detailed anime information |
| | `ANIME_EPISODES` | Get anime episode list |
| | `AZ_LIST` | Browse anime alphabetically |
| **Search** | `SEARCH` | Basic search |
| | `SEARCH_ADVANCED` | Advanced search with filters |
| | `SEARCH_SUGGESTION` | Search suggestions |
| **Browse** | `GENRE` | Browse by genre |
| | `CATEGORY` | Browse by category |
| | `PRODUCER` | Browse by studio/producer |
| **Schedule** | `SCHEDULE` | Get anime schedule for a date |
| **Streaming** | `EPISODE_SERVERS` | Get available streaming servers |
| | `EPISODE_SOURCES` | Get streaming sources |
| **Auth** | `AUTH.*` | Authentication endpoints |
| **User** | `USER.*` | User profile management |
| **Progress** | `PROGRESS.*` | Watch progress tracking |

For complete endpoint details, refer to `src/context/api/endpoints.js`.

## 🛠️ Development

### Code Style

The project uses ESLint for code quality. Run the linter before committing:

```bash
npm run lint
```

### Component Architecture

- **UI Components**: Located in `src/components/ui/` using `class-variance-authority` for variant management
- **Page Components**: Located in `src/pages/` for route-level components
- **State Management**: React Context for global state (auth, theme, etc.)
- **Routing**: React Router DOM v7 for client-side routing

### Video Player Features

The custom video player in `src/components/videoPlayer/` includes:

- HLS.js integration for adaptive streaming
- Keyboard shortcuts (space for play/pause, arrow keys for seeking)
- Subtitle track support
- Quality selection
- Picture-in-picture mode
- Custom controls with animations

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create a feature branch**: `git checkout -b feat/your-feature`
3. **Install dependencies**: `npm install`
4. **Start development server**: `npm run dev`
5. **Make your changes** following the existing code style
6. **Run linter**: `npm run lint`
7. **Test your changes** thoroughly
8. **Commit your changes**: `git commit -m "feat: description of your feature"`
9. **Push to your fork**: `git push origin feat/your-feature`
10. **Open a Pull Request** with a clear description of changes

### Pull Request Guidelines

- Ensure your code passes linting
- Update documentation if needed
- Add tests if applicable
- Keep PRs focused on a single feature or fix

## 🪪 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

## 🌸 Enjoy streaming with Shirayuki!

**If you like this project, please consider giving it a star! ⭐**

</div>