import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { APIProvider } from './context/APIContext.jsx'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <APIProvider>
      <App />
    </APIProvider>
  </StrictMode>,
)
