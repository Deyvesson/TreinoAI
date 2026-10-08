import { useEffect, useState, useSyncExternalStore } from 'react'

/** Relógio que atualiza enquanto `ativo`; parado, devolve o último valor. */
export function useAgora(ativo: boolean, intervaloMs = 250): number {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    if (!ativo) return
    const id = window.setInterval(() => setAgora(Date.now()), intervaloMs)
    return () => window.clearInterval(id)
  }, [ativo, intervaloMs])
  return agora
}

/** Mantém a tela acesa durante o treino; o navegador solta o bloqueio ao esconder a aba, então pede de novo. */
export function useTelaAcesa(ativo: boolean) {
  useEffect(() => {
    if (!ativo || !('wakeLock' in navigator)) return
    let bloqueio: WakeLockSentinel | null = null
    let cancelado = false
    const pedir = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        bloqueio = await navigator.wakeLock.request('screen')
        if (cancelado) await bloqueio.release()
      } catch {
        // Bateria fraca ou permissão negada: o treino segue com a tela normal.
      }
    }
    pedir()
    document.addEventListener('visibilitychange', pedir)
    return () => {
      cancelado = true
      document.removeEventListener('visibilitychange', pedir)
      bloqueio?.release().catch(() => {})
    }
  }, [ativo])
}

export function useMovimentoReduzido(): boolean {
  return useSyncExternalStore(
    (ouvinte) => {
      const consulta = matchMedia('(prefers-reduced-motion: reduce)')
      consulta.addEventListener('change', ouvinte)
      return () => consulta.removeEventListener('change', ouvinte)
    },
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
}

// Preferência de som no fim do descanso (ligada por padrão; só um "0" salvo desliga).

const CHAVE_SOM = 'treinoai:som-descanso'
const ouvintesSom = new Set<() => void>()
const somLigado = () => localStorage.getItem(CHAVE_SOM) !== '0'

export function useSomDescanso(): [boolean, (ligado: boolean) => void] {
  const ligado = useSyncExternalStore(
    (ouvinte) => {
      ouvintesSom.add(ouvinte)
      return () => ouvintesSom.delete(ouvinte)
    },
    somLigado,
  )
  const definir = (valor: boolean) => {
    localStorage.setItem(CHAVE_SOM, valor ? '1' : '0')
    ouvintesSom.forEach((o) => o())
    if (valor) prepararSom()
  }
  return [ligado, definir]
}

let contextoAudio: AudioContext | null = null

/** O iOS só libera áudio depois de um toque; chame dentro de um gesto do usuário. */
export function prepararSom() {
  if (!somLigado()) return
  contextoAudio ??= new AudioContext()
  if (contextoAudio.state === 'suspended') contextoAudio.resume().catch(() => {})
}

/** Fim do descanso: vibra onde há suporte (Android) e toca dois bipes curtos se o som estiver ligado. */
export function avisarFimDoDescanso() {
  navigator.vibrate?.([220, 120, 220])
  if (!somLigado() || !contextoAudio) return
  const inicio = contextoAudio.currentTime
  for (const atraso of [0, 0.28]) {
    const oscilador = contextoAudio.createOscillator()
    const volume = contextoAudio.createGain()
    oscilador.frequency.value = 880
    volume.gain.setValueAtTime(0.0001, inicio + atraso)
    volume.gain.exponentialRampToValueAtTime(0.4, inicio + atraso + 0.02)
    volume.gain.exponentialRampToValueAtTime(0.0001, inicio + atraso + 0.2)
    oscilador.connect(volume).connect(contextoAudio.destination)
    oscilador.start(inicio + atraso)
    oscilador.stop(inicio + atraso + 0.22)
  }
}
