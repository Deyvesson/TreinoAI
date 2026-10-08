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

const ehIOS =
  /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** Como o aparelho vibra: API padrão (Android), o toque do iOS 18+ (experimental) ou nada. */
export const FORMA_DE_VIBRAR: 'padrao' | 'ios' | null = 'vibrate' in navigator ? 'padrao' : ehIOS ? 'ios' : null

/**
 * O Safari não tem navigator.vibrate, mas no iOS 18+ alternar um <input type="checkbox" switch>
 * dispara um toque leve do motor de vibração. Experimental: a Apple pode limitar a toques do usuário.
 */
function toqueIOS() {
  const rotulo = document.createElement('label')
  rotulo.setAttribute('aria-hidden', 'true')
  rotulo.style.display = 'none'
  const caixa = document.createElement('input')
  caixa.type = 'checkbox'
  caixa.setAttribute('switch', '')
  rotulo.append(caixa)
  document.body.append(rotulo)
  rotulo.click()
  rotulo.remove()
}

/** Padrão no formato do navigator.vibrate (vibra, pausa, vibra...); no iPhone, um toque por pulso. */
export function vibrar(padrao: readonly number[]) {
  if (FORMA_DE_VIBRAR === 'padrao') {
    navigator.vibrate([...padrao])
    return
  }
  if (FORMA_DE_VIBRAR !== 'ios') return
  let atraso = 0
  padrao.forEach((duracao, i) => {
    if (i % 2 === 0) setTimeout(toqueIOS, atraso)
    atraso += duracao
  })
}

export const PADRAO_FIM_DO_DESCANSO = [220, 120, 220] as const

/** Fim do descanso: vibra (Android; iPhone em teste) e toca dois bipes curtos se o som estiver ligado. */
export function avisarFimDoDescanso() {
  vibrar(PADRAO_FIM_DO_DESCANSO)
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
