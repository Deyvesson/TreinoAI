import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { formatarTempo, ROTULO_ESTADO, textoMeta, textoPrescricao, textoSerie, type LinhaTorre } from '../dados/sessao'

type Modo = 'abertura' | 'sessao' | 'classificacao'

interface Props {
  linhas: readonly LinhaTorre[]
  modo: Modo
  /** Segundos de descanso restantes, mostrados na linha atual como a diferença para o líder. */
  descanso?: number | null
  onFazerAgora?: (exercicioId: string) => void
}

function valorDaLinha(linha: LinhaTorre, modo: Modo, descanso: number | null | undefined) {
  if (modo === 'sessao' && linha.estado === 'atual' && descanso) {
    return <span className="torre-gap">+{formatarTempo(descanso)}</span>
  }
  if (linha.melhor && (modo === 'classificacao' || linha.completo)) return textoSerie(linha.melhor, linha.exercicio)
  return textoPrescricao(linha.prescrito, linha.exercicio)
}

/** A torre de tempos: os exercícios do dia por posição, com o estado de cada um numa faixa de cor. */
export function Torre({ linhas, modo, descanso, onFazerAgora }: Props) {
  const [aberto, setAberto] = useState<string | null>(null)
  const algumAberto = modo === 'sessao' && aberto !== null

  return (
    <ol className="torre" data-modo={modo} data-foco={algumAberto ? '' : undefined}>
      {linhas.map((linha) => {
        const id = linha.prescrito.exercicioId
        const estaAberto = aberto === id
        const selecionavel =
          (modo === 'abertura') || (modo === 'sessao' && !linha.completo && linha.estado !== 'atual')
        const conteudo = (
          <>
            <span className="torre-pos">{linha.posicao}</span>
            <span className="torre-faixa" aria-hidden="true" />
            <span className="torre-nome">{linha.exercicio.nome}</span>
            {modo !== 'abertura' && (
              <span className="torre-series num" aria-label={`${linha.feitas} de ${linha.total} séries`}>
                {linha.feitas}/{linha.total}
              </span>
            )}
            <span className="torre-valor num">{valorDaLinha(linha, modo, descanso)}</span>
            {modo === 'abertura' && <ChevronDown className="torre-seta" size={18} aria-hidden="true" />}
          </>
        )
        return (
          <li
            key={id}
            className="torre-linha"
            data-estado={linha.estado}
            data-aberta={estaAberto ? '' : undefined}
          >
            {selecionavel ? (
              <button
                type="button"
                className="torre-cabeca"
                aria-expanded={estaAberto}
                onClick={() => setAberto(estaAberto ? null : id)}
              >
                {conteudo}
              </button>
            ) : (
              <div className="torre-cabeca">{conteudo}</div>
            )}
            <span className="sr-only">{ROTULO_ESTADO[linha.estado]}</span>

            {estaAberto && modo === 'abertura' && (
              <div className="torre-detalhe">
                <p className="torre-meta num">
                  {textoMeta(linha.prescrito, linha.exercicio)} · descanso {formatarTempo(linha.prescrito.descansoSegundos)}
                </p>
                <p>{linha.prescrito.motivo || 'Escolhido por você.'}</p>
                {linha.prescrito.observacao && <p className="torre-obs">{linha.prescrito.observacao}</p>}
              </div>
            )}
            {estaAberto && modo === 'sessao' && (
              <div className="torre-acoes">
                <button type="button" className="botao botao-primario" onClick={() => onFazerAgora?.(id)}>
                  Fazer agora
                </button>
                <button type="button" className="botao botao-texto" onClick={() => setAberto(null)}>
                  Manter a ordem
                </button>
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/**
 * A torre recolhida no topo da sessão: uma célula por exercício, a atual no ar.
 * No descanso, a célula atual alarga e mostra a diferença, como o intervalo na transmissão.
 */
export function TorreRecolhida({
  linhas,
  descanso,
  onAbrir,
}: {
  linhas: readonly LinhaTorre[]
  descanso: number | null
  onAbrir: () => void
}) {
  const feitos = linhas.filter((l) => l.completo).length
  const colunas = linhas.map((l) => (descanso && l.estado === 'atual' ? 'minmax(0, 2.6fr)' : 'minmax(0, 1fr)'))
  return (
    <button
      type="button"
      className="torre-faixas"
      onClick={onAbrir}
      aria-label={`Abrir a torre: ${feitos} de ${linhas.length} exercícios feitos`}
      style={{ gridTemplateColumns: colunas.join(' ') }}
    >
      {linhas.map((linha) => (
        <span key={linha.prescrito.exercicioId} className="torre-celula num" data-estado={linha.estado}>
          {linha.posicao}
          {descanso && linha.estado === 'atual' ? <span className="torre-celula-gap">+{formatarTempo(descanso)}</span> : null}
        </span>
      ))}
    </button>
  )
}

export function LegendaTorre() {
  return (
    <ul className="legenda" aria-label="Cores da torre">
      {(['meta', 'recorde', 'abaixo', 'pendente'] as const).map((estado) => (
        <li key={estado} data-estado={estado}>
          <span aria-hidden="true" />
          {ROTULO_ESTADO[estado]}
        </li>
      ))}
    </ul>
  )
}
