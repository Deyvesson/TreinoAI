import { useSyncExternalStore } from 'react'

// Roteador mínimo sobre a History API; o SWA devolve o index.html para qualquer rota (navigationFallback).

const ouvintes = new Set<() => void>()

function avisar() {
  ouvintes.forEach((ouvinte) => ouvinte())
}

window.addEventListener('popstate', avisar)

export function navegar(caminho: string, opcoes: { substituir?: boolean } = {}) {
  if (caminho === location.pathname) return
  if (opcoes.substituir) history.replaceState(null, '', caminho)
  else history.pushState(null, '', caminho)
  window.scrollTo(0, 0)
  avisar()
}

export function useCaminho(): string {
  return useSyncExternalStore(
    (ouvinte) => {
      ouvintes.add(ouvinte)
      return () => ouvintes.delete(ouvinte)
    },
    () => location.pathname,
  )
}
