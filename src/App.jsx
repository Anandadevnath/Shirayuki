import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Pages/home';
import AnimeDetails from './Pages/AnimeDetails';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/anime/:animeId" element={<AnimeDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;