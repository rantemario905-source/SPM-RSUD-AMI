import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import AuthGate from './auth/AuthGate'
import ProgressProvider from './components/feedback/ProgressBar'
import { RouterProvider } from './lib/router'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider>
      <ProgressProvider>
        <AuthGate>
          <App />
        </AuthGate>
      </ProgressProvider>
    </RouterProvider>
  </StrictMode>,
)
