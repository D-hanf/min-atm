import './assets/main.css'

import App from '../src/app/App'
import { AuthProvider } from './context/AuthContext'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <StrictMode>
      <App />
    </StrictMode>
    </AuthProvider>
)
