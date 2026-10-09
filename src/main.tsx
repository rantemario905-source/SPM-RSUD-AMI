import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import AuthGate from './auth/AuthGate'
import ProgressProvider from './components/feedback/ProgressBar'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgressProvider>
      <AuthGate>
        <App />
      </AuthGate>
    </ProgressProvider>
  </StrictMode>,
)
