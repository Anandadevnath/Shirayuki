import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { APIProvider } from './context/APIContext.jsx'
import Home from './Pages/home'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <APIProvider>
      <Home />
    </APIProvider>
  </StrictMode>,
)
