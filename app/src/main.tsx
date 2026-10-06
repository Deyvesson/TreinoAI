import '@fontsource-variable/archivo/standard.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Em desenvolvimento, expõe o banco local para inspeção e para montar dados de teste pelo console.
if (import.meta.env.DEV) {
  import('./dados/db').then((modulo) => Object.assign(window, { __treinoai: modulo }))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
