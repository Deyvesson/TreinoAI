import { Download, Share, SquarePlus, X } from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

// Instalar o app na tela de início.
// Android (Chrome, Edge, Samsung Internet): o navegador entrega o evento `beforeinstallprompt` e o botão abre a
// instalação nativa. iPhone/iPad: a Apple não oferece essa API; o botão mostra o caminho pelo Compartilhar.

interface EventoInstalacao extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let eventoGuardado: EventoInstalacao | null = null
let instalado = false
const ouvintes = new Set<() => void>()
const avisar = () => ouvintes.forEach((o) => o())

// O evento pode chegar antes de qualquer tela montar, por isso é capturado no carregamento do módulo.
window.addEventListener('beforeinstallprompt', (evento) => {
  evento.preventDefault()
  eventoGuardado = evento as EventoInstalacao
  avisar()
})
window.addEventListener('appinstalled', () => {
  instalado = true
  eventoGuardado = null
  avisar()
})

const CHAVE_DISPENSA = 'treinoai:instalar-dispensado-em'
const TRINTA_DIAS = 30 * 24 * 60 * 60 * 1000

function emTelaCheia(): boolean {
  return matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function ehIos(): boolean {
  if (import.meta.env.DEV && new URLSearchParams(location.search).get('instalar') === 'ios') return true
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/** No iPhone todo navegador usa o WebKit; o que muda é onde fica o botão de compartilhar. */
function navegadorIos(): 'safari' | 'chrome' | 'outro' {
  const ua = navigator.userAgent
  if (/CriOS/.test(ua)) return 'chrome'
  if (/FxiOS|EdgiOS|OPiOS/.test(ua)) return 'outro'
  return 'safari'
}

const ONDE_COMPARTILHAR = {
  safari: 'na barra do Safari (embaixo ou no alto, conforme o seu ajuste)',
  chrome: 'ao lado do endereço, no alto à direita do Chrome',
  outro: 'no menu do seu navegador',
} as const

function dispensadoRecentemente(): boolean {
  const quando = Number(localStorage.getItem(CHAVE_DISPENSA) ?? 0)
  return Date.now() - quando < TRINTA_DIAS
}

type Modo = 'nativo' | 'ios' | null

function useModoInstalacao(): Modo {
  return useSyncExternalStore(
    (ouvinte) => {
      ouvintes.add(ouvinte)
      return () => ouvintes.delete(ouvinte)
    },
    () => {
      if (instalado || emTelaCheia() || dispensadoRecentemente()) return null
      if (eventoGuardado) return 'nativo'
      return ehIos() ? 'ios' : null
    },
  )
}

/** Aviso discreto na tela Hoje. Some quando o app já roda instalado, quando não há como instalar ou por 30 dias após "Agora não". */
export function InstalarApp() {
  const modo = useModoInstalacao()
  const [passosAbertos, setPassosAbertos] = useState(false)

  if (!modo) return null

  async function instalar() {
    if (modo === 'ios') {
      setPassosAbertos(true)
      return
    }
    const evento = eventoGuardado
    if (!evento) return
    await evento.prompt()
    const { outcome } = await evento.userChoice
    eventoGuardado = null
    if (outcome === 'dismissed') localStorage.setItem(CHAVE_DISPENSA, String(Date.now()))
    avisar()
  }

  function dispensar() {
    localStorage.setItem(CHAVE_DISPENSA, String(Date.now()))
    avisar()
  }

  return (
    <>
      <section className="instalar" aria-labelledby="instalar-titulo">
        <Download className="instalar-icone" size={24} aria-hidden="true" />
        <div className="instalar-texto">
          <h2 id="instalar-titulo">Instale o TreinoAI na tela de início</h2>
          <p>Abre como app, em tela cheia, e ajuda a manter seus treinos salvos no aparelho.</p>
          <div className="instalar-acoes">
            <button type="button" className="botao botao-contorno" onClick={instalar}>
              Instalar
            </button>
            <button type="button" className="botao botao-texto" onClick={dispensar}>
              Agora não
            </button>
          </div>
        </div>
      </section>
      {passosAbertos && <PassosIos onFechar={() => setPassosAbertos(false)} />}
    </>
  )
}

function PassosIos({ onFechar }: { onFechar: () => void }) {
  const fechar = useRef<HTMLButtonElement>(null)
  const navegador = navegadorIos()
  useEffect(() => {
    fechar.current?.focus()
    const aoTeclar = (evento: KeyboardEvent) => evento.key === 'Escape' && onFechar()
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  return (
    <>
      <div className="menu-fundo" onClick={onFechar} aria-hidden="true" />
      <div className="folha" role="dialog" aria-modal="true" aria-labelledby="passos-ios-titulo">
        <header className="folha-topo">
          <h2 id="passos-ios-titulo">Adicionar à tela de início</h2>
          <button ref={fechar} type="button" className="botao-icone" aria-label="Fechar" onClick={onFechar}>
            <X size={24} aria-hidden="true" />
          </button>
        </header>
        <ol className="passos-ios">
          <li>
            <span className="passos-ios-num num">1</span>
            <span>
              Toque em <strong>Compartilhar</strong> <Share className="passos-ios-icone" size={20} aria-label="(ícone de compartilhar)" />{' '}
              {ONDE_COMPARTILHAR[navegador]}.
            </span>
          </li>
          <li>
            <span className="passos-ios-num num">2</span>
            <span>
              Role a lista e toque em <strong>Adicionar à Tela de Início</strong>{' '}
              <SquarePlus className="passos-ios-icone" size={20} aria-label="(ícone de adicionar)" />.
            </span>
          </li>
          <li>
            <span className="passos-ios-num num">3</span>
            <span>
              Toque em <strong>Adicionar</strong>. O TreinoAI aparece na tela de início e abre como app.
            </span>
          </li>
        </ol>
        {navegador === 'outro' && (
          <p className="folha-nota">Se não encontrar a opção, abra este endereço no Safari ou no Chrome.</p>
        )}
      </div>
    </>
  )
}
