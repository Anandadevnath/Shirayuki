import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ShirayukiAPIProvider } from './context';
import Home from './Pages/home';
import AnimeDetails from './Pages/AnimeDetails';
import StreamingPage from './Pages/StreamingPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './index.css';

function App() {
  return (
    <ShirayukiAPIProvider>
      <BrowserRouter>
  <div className="min-h-screen bg-black text-white">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/anime/:animeId" element={<AnimeDetails />} />
              <Route path="/anime/:animeId/episodes" element={<StreamingPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </ShirayukiAPIProvider>
  );
}

export default App;