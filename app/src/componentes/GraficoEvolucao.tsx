import { ChevronDown } from 'lucide-react'
import { useId, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { formatarNumero } from '../dados/sessao'
import type { EvolucaoExercicio } from '../dados/progresso'

// Evolução de um exercício: uma série só, em tinta neutra; o recorde é o único ponto com cor (roxo, maior).
// Validado: tinta-2 × roxo com ΔE 27,6 (visão normal) e 25 (deutan); o recorde também leva legenda e tamanho.

const LARGURA = 320
const ALTURA = 160
const M = { topo: 14, direita: 56, base: 26, esquerda: 34 }

function ticksLimpos(min: number, max: number): number[] {
  if (min === max) {
    const passo = Math.max(1, Math.abs(min) * 0.1)
    return [min - passo, min, min + passo]
  }
  const bruto = (max - min) / 3
  const potencia = 10 ** Math.floor(Math.log10(bruto))
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * potencia).find((p) => p >= bruto)!
  const inicio = Math.floor(min / passo) * passo
  const ticks: number[] = []
  for (let v = inicio; v <= max + passo * 0.001; v += passo) ticks.push(Math.round(v * 100) / 100)
  if (ticks.at(-1)! < max) ticks.push(Math.round((ticks.at(-1)! + passo) * 100) / 100)
  return ticks
}

const dataCurta = (iso: string) => {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

export function GraficoEvolucao({ evolucao }: { evolucao: EvolucaoExercicio }) {
  const id = useId()
  const [ativo, setAtivo] = useState<number | null>(null)
  const { pontos, unidade } = evolucao
  const valores = pontos.map((p) => p.valor)
  const ticks = ticksLimpos(Math.min(...valores), Math.max(...valores))
  const yMin = ticks[0]
  const yMax = ticks.at(-1)!
  const larguraUtil = LARGURA - M.esquerda - M.direita
  const alturaUtil = ALTURA - M.topo - M.base
  const x = (i: number) => M.esquerda + (pontos.length === 1 ? larguraUtil / 2 : (i / (pontos.length - 1)) * larguraUtil)
  const y = (v: number) => M.topo + alturaUtil - ((v - yMin) / (yMax - yMin || 1)) * alturaUtil
  const caminho = pontos.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(' ')
  const ultimo = pontos.at(-1)!
  const temRecorde = pontos.some((p) => p.recorde)
  const formatar = (v: number) => `${formatarNumero(Math.round(v * 10) / 10)} ${unidade}`

  function aoMover(evento: PointerEvent<SVGRectElement>) {
    const caixa = evento.currentTarget.ownerSVGElement!.getBoundingClientRect()
    const xSvg = ((evento.clientX - caixa.left) / caixa.width) * LARGURA
    let melhor = 0
    pontos.forEach((_, i) => {
      if (Math.abs(x(i) - xSvg) < Math.abs(x(melhor) - xSvg)) melhor = i
    })
    setAtivo(melhor)
  }

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key === 'ArrowRight') setAtivo((a) => Math.min(pontos.length - 1, (a ?? -1) + 1))
    else if (evento.key === 'ArrowLeft') setAtivo((a) => Math.max(0, (a ?? pontos.length) - 1))
    else if (evento.key === 'Escape') setAtivo(null)
    else return
    evento.preventDefault()
  }

  const ponto = ativo === null ? null : pontos[ativo]
  const resumoAcessivel = `${evolucao.nome}: ${pontos.length} treinos, de ${formatar(pontos[0].valor)} em ${dataCurta(pontos[0].data)} a ${formatar(ultimo.valor)} em ${dataCurta(ultimo.data)}.`

  return (
    <div className="grafico">
      <div
        className="grafico-area"
        tabIndex={0}
        role="img"
        aria-label={`${resumoAcessivel} Use as setas para ver cada treino.`}
        aria-describedby={`${id}-valor`}
        onKeyDown={aoTeclar}
        onBlur={() => setAtivo(null)}
      >
        <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} aria-hidden="true">
          {ticks.map((t) => (
            <g key={t}>
              <line className="grafico-grade" x1={M.esquerda} x2={LARGURA - M.direita} y1={y(t)} y2={y(t)} />
              <text className="grafico-eixo" x={M.esquerda - 6} y={y(t)} dy="0.32em" textAnchor="end">
                {formatarNumero(t)}
              </text>
            </g>
          ))}
          <text className="grafico-eixo" x={x(0)} y={ALTURA - 6} textAnchor={pontos.length === 1 ? 'middle' : 'start'}>
            {dataCurta(pontos[0].data)}
          </text>
          {pontos.length > 1 && (
            <text className="grafico-eixo" x={x(pontos.length - 1)} y={ALTURA - 6} textAnchor="end">
              {dataCurta(ultimo.data)}
            </text>
          )}
          {ponto && <line className="grafico-mira" x1={x(ativo!)} x2={x(ativo!)} y1={M.topo} y2={M.topo + alturaUtil} />}
          {pontos.length > 1 && <path className="grafico-linha" d={caminho} />}
          {pontos.map((p, i) => (
            <circle
              key={p.sessaoId}
              className={p.recorde ? 'grafico-ponto grafico-recorde' : 'grafico-ponto'}
              cx={x(i)}
              cy={y(p.valor)}
              r={p.recorde ? 5.5 : 4}
              data-ativo={i === ativo ? '' : undefined}
            />
          ))}
          <text className="grafico-rotulo" x={x(pontos.length - 1) + 10} y={y(ultimo.valor)} dy="0.32em">
            {formatar(ultimo.valor)}
          </text>
          <rect
            className="grafico-alvo"
            x={M.esquerda - 12}
            y={0}
            width={larguraUtil + 24}
            height={ALTURA}
            onPointerMove={aoMover}
            onPointerDown={aoMover}
            onPointerLeave={() => setAtivo(null)}
          />
        </svg>
        {ponto && (
          <div
            className="grafico-dica"
            style={{ left: `${(x(ativo!) / LARGURA) * 100}%` }}
            data-lado={x(ativo!) > LARGURA / 2 ? 'esquerda' : 'direita'}
          >
            <strong className="num">{ponto.texto}</strong>
            <span>
              {dataCurta(ponto.data)}
              {ponto.recorde ? ' · recorde pessoal' : ''}
              {ponto.metaCumprida ? '' : ' · abaixo da meta'}
            </span>
          </div>
        )}
      </div>
      <p id={`${id}-valor`} className="sr-only" aria-live="polite">
        {ponto ? `${dataCurta(ponto.data)}: ${ponto.texto}${ponto.recorde ? ', recorde pessoal' : ''}` : ''}
      </p>
      {temRecorde && (
        <p className="grafico-legenda">
          <span aria-hidden="true" /> Recorde pessoal
        </p>
      )}
      <details className="grafico-tabela">
        <summary>
          Ver valores <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Data</th>
              <th scope="col">Melhor série</th>
              <th scope="col">Meta</th>
            </tr>
          </thead>
          <tbody>
            {[...pontos].reverse().map((p) => (
              <tr key={p.sessaoId}>
                <td className="num">{dataCurta(p.data)}</td>
                <td className="num">
                  {p.texto}
                  {p.recorde ? ' (recorde)' : ''}
                </td>
                <td>{p.metaCumprida ? 'cumprida' : 'abaixo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
