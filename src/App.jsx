import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/home";
import AnimeDetails from "@/pages/animeDetails";
import { Layout } from "@/components/layout";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/anime/:animeId" element={<AnimeDetails />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App
