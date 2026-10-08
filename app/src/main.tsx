import '@fontsource-variable/archivo/standard.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { carregarPersonalizados } from './dados/catalogo'
import './index.css'

// Em desenvolvimento, expõe o banco local para inspeção e para montar dados de teste pelo console.
if (import.meta.env.DEV) {
  import('./dados/db').then((modulo) => Object.assign(window, { __treinoai: modulo }))
}

// Os exercícios pessoais precisam estar em memória antes da primeira tela (as consultas ao catálogo são síncronas).
await carregarPersonalizados().catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
