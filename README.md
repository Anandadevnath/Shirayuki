# ❄️ Shirayuki - Anime Streaming Platform

A modern, responsive anime streaming website built with React, Vite, and Tailwind CSS. Browse, search, and watch your favorite anime with a beautiful dark-themed interface.

## ✨ Features

- 🏠 **Home Page** - Spotlight carousel, trending anime, latest episodes, top 10 rankings
- 🔍 **Smart Search** - Real-time search suggestions as you type
- 📺 **Video Player** - Stream anime with multiple server options (SUB/DUB)
- 📋 **Episode List** - Browse all episodes with search functionality
- 🔤 **A-Z List** - Browse anime alphabetically with pagination
- 🎭 **Genre Browser** - Filter anime by genre (Action, Romance, Fantasy, etc.)
- 📁 **Category/Types** - Browse by type (TV, Movie, OVA, ONA, Special, Music)
- 🏢 **Studios** - Explore anime by production studio
- 📅 **Schedule** - View anime airing schedule with calendar picker
- 📱 **Responsive Design** - Fully responsive across all devices

## 📦 Installation

1. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your API base URL:
   ```env
   VITE_API_BASE_URL=https://shirayuki-scrapper-api-v2.vercel.app
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

## 🚀 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |


## 🛣️ Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Main landing page |
| `/anime/:animeId` | Anime Details | View anime information |
| `/watch/:animeId` | Episode List | Browse episodes |
| `/watch/:animeId/:episodeId` | Watch | Stream video player |
| `/search?q=query` | Search | Search results |
| `/az-list/:letter` | A-Z List | Browse alphabetically |
| `/genre/:genreId` | Genre | Browse by genre |
| `/category/:categoryId` | Category | Browse by type |
| `/producer/:producerId` | Studios | Browse by studio |
| `/schedule` | Schedule | Airing schedule |

## 🔌 API Endpoints

The app uses the Shirayuki Scrapper API V2:

| Endpoint | Description |
|----------|-------------|
| `/api/v2/hianime/home` | Home page data |
| `/api/v2/hianime/anime/:id` | Anime details |
| `/api/v2/hianime/anime/:id/episodes` | Episode list |
| `/api/v2/hianime/episode/servers` | Streaming servers |
| `/api/v2/hianime/search?q=:query` | Basic search |
| `/api/v2/hianime/search/suggestion?q=:query` | Search suggestions |
| `/api/v2/hianime/azlist/:letter?page=1` | A-Z list |
| `/api/v2/hianime/genre/:id?page=1` | Genre browse |
| `/api/v2/hianime/category/:id?page=1` | Category browse |
| `/api/v2/hianime/producer/:id?page=1` | Producer browse |
| `/api/v2/hianime/schedule?date=YYYY-MM-DD` | Schedule |


## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
