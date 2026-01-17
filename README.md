# Shirayuki — API Endpoints, Contributing, and License

## Endpoints ✅
All endpoints are exposed via the `ENDPOINTS` constants in `src/context/api/endpoints.js`.

- Anime endpoints
  - `HOME` — `/api/v2/hianime/home`
  - `SCHEDULE(date)` — `/api/v2/hianime/schedule?date=${date}`
  - `AZ_LIST(letter, page)` — `/api/v2/hianime/azlist/${letter}?page=${page}`
  - `ANIME_DETAILS(animeId)` — `/api/v2/hianime/anime/${animeId}`
  - `ANIME_EPISODES(animeId)` — `/api/v2/hianime/anime/${animeId}/episodes`
  - `SEARCH(query, page)` — `/api/v2/hianime/search?q=<query>&page=<page>`
  - `SEARCH_SUGGESTION(query)` — `/api/v2/hianime/search/suggestion?q=<query>`
  - `SEARCH_ADVANCED(params)` — `/api/v2/hianime/search/advanced?...` (uses URLSearchParams)
  - `PRODUCER(id, page)` — `/api/v2/hianime/producer/${id}?page=${page}`
  - `GENRE(id, page)` — `/api/v2/hianime/genre/${id}?page=${page}`
  - `CATEGORY(id, page)` — `/api/v2/hianime/category/${id}?page=${page}`
  - `EPISODE_SERVERS(animeEpisodeId)` — `/api/v2/hianime/episode/servers?animeEpisodeId=${animeEpisodeId}`
  - `EPISODE_SOURCES(animeEpisodeId, episodeId, ep, server, category)` — `/api/v2/hianime/episode/sources?...`

- Backend endpoints
  - `AUTH` — `/api/auth/*` (register, login, forgot-password, update-password, send-verification, verify-email)
  - `USER` — `/api/user/*` (profile endpoints)
  - `PROFILE` — `/api/profile/*` (pfp endpoints)
  - `PROGRESS` — `/api/progress/*` (watch progress endpoints)

(See `src/context/api/endpoints.js` for precise signatures.)

---

## How to contribute 💡
- Fork the repo and create a branch: `git checkout -b feat/your-feature`
- Install & run locally: `npm install` and `npm run dev`
- Lint & build before PR: `npm run lint` and `npm run build`
- Open a clear Pull Request describing your change and tests

---

## License 📝
This project is licensed under the **MIT License**. See `LICENSE` for details.


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
