import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ActiveDateProvider } from './context/ActiveDateContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ActiveDateProvider>
      <App />
    </ActiveDateProvider>
  </StrictMode>,
)
