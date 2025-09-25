import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Pages/home';
import AnimeDetails from './Pages/AnimeDetails';
import Episodes from './Pages/Episodes';
import AZList from './Pages/AZList';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-indigo-900 text-white">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/anime/:animeId" element={<AnimeDetails />} />
            <Route path="/anime/:animeId/episodes" element={<Episodes />} />
            <Route path="/a-zlist" element={<AZList />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;