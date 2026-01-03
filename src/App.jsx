import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/home";
import AnimeDetails from "@/pages/animeDetails";
import EpisodeList from "@/pages/episode";
import Watch from "@/pages/watch";
import AZList from "@/pages/azList";
import SearchPage from "@/pages/search";
import GenrePage from "@/pages/genre";
import CategoryPage from "@/pages/category";
import ProducerPage from "@/pages/producer";
import SchedulePage from "@/pages/schedule";
import { Layout } from "@/components/layout";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Home */}
          <Route path="/" element={<Home />} />
          
          {/* Anime */}
          <Route path="/anime/:animeId" element={<AnimeDetails />} />
          
          {/* Watch/Episodes */}
          <Route path="/watch/:animeId" element={<EpisodeList />} />
          <Route path="/watch/:animeId/:episodeId" element={<Watch />} />
          
          {/* Browse */}
          <Route path="/az-list" element={<AZList />} />
          <Route path="/az-list/:letter" element={<AZList />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/genre" element={<Navigate to="/genre/action" replace />} />
          <Route path="/genre/:genreId" element={<GenrePage />} />
          <Route path="/category" element={<CategoryPage />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/producer" element={<ProducerPage />} />
          <Route path="/producer/:producerId" element={<ProducerPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App