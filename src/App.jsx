import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/home";
import AnimeDetails from "@/pages/animeDetails";
import EpisodeList from "@/pages/episode";
import Watch from "@/pages/watch";
import { Layout } from "@/components/layout";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/anime/:animeId" element={<AnimeDetails />} />
          <Route path="/watch/:animeId" element={<EpisodeList />} />
          <Route path="/watch/:animeId/:episodeId" element={<Watch />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App
