import { useEffect, useState } from 'react'
import { EXERCICIO_POR_ID } from '../../shared/exercicios'
import type { PerfilTreino } from '../../shared/plano'
import { gerarPlano } from './dados/api'
import { ativarPlano, pedirArmazenamentoPersistente, planoAtivo, salvarPerfil, type PlanoSalvo } from './dados/db'

// Tela de diagnóstico das fases 1 e 2. Será substituída pelas telas reais na fase 3.

type PingResult =
  | { ok: true; model: string; reply: string; latencyMs: number }
  | { ok: false; error: string; latencyMs?: number }

type Status<T> = { kind: 'idle' } | { kind: 'loading' } | { kind: 'done'; result: T }

const PERFIL_DE_TESTE: PerfilTreino = {
  objetivo: 'hipertrofia',
  nivel: 'iniciante',
  diasPorSemana: 3,
  minutosPorSessao: 45,
  equipamento: ['halteres', 'banco', 'elastico'],
  limitacoes: null,
}

async function ping(): Promise<PingResult> {
  try {
    const response = await fetch('/api/ping')
    return (await response.json()) as PingResult
  } catch {
    return { ok: false, error: 'A API não respondeu. Verifique sua conexão e tente de novo.' }
  }
}

function prescricao(p: PlanoSalvo['plano']['dias'][number]['exercicios'][number]): string {
  if (p.repeticoesMin !== null) return `${p.series} × ${p.repeticoesMin}–${p.repeticoesMax}`
  if (p.duracaoSegundos !== null) return `${p.series} × ${p.duracaoSegundos} s`
  return `${p.series} × ${p.distanciaKm} km`
}

export default function App() {
  const [pingStatus, setPingStatus] = useState<Status<PingResult>>({ kind: 'idle' })
  const [geracao, setGeracao] = useState<{ kind: 'idle' } | { kind: 'loading'; desde: number } | { kind: 'erro'; mensagem: string }>({
    kind: 'idle',
  })
  const [plano, setPlano] = useState<PlanoSalvo | undefined>()
  const [persistente, setPersistente] = useState<boolean | null>(null)

  useEffect(() => {
    planoAtivo().then(setPlano)
    navigator.storage?.persisted?.().then(setPersistente)
  }, [])

  async function handlePing() {
    setPingStatus({ kind: 'loading' })
    setPingStatus({ kind: 'done', result: await ping() })
  }

  async function handleGerar() {
    setGeracao({ kind: 'loading', desde: Date.now() })
    setPersistente(await pedirArmazenamentoPersistente())
    const resultado = await gerarPlano(PERFIL_DE_TESTE)
    if (!resultado.ok) {
      setGeracao({ kind: 'erro', mensagem: resultado.erro })
      return
    }
    await salvarPerfil(PERFIL_DE_TESTE)
    await ativarPlano(resultado.valor)
    setPlano(await planoAtivo())
    setGeracao({ kind: 'idle' })
  }

  return (
    <main className="probe">
      <h1>TreinoAI</h1>
      <p className="lede">
        Tela de diagnóstico: conexão com o Azure AI Foundry e geração de plano salvo no aparelho.
      </p>

      <section>
        <h2>Conexão com a IA</h2>
        <button type="button" onClick={handlePing} disabled={pingStatus.kind === 'loading'}>
          {pingStatus.kind === 'loading' ? 'Testando…' : 'Testar conexão'}
        </button>
        <div className="result" role="status" aria-live="polite">
          {pingStatus.kind === 'done' && pingStatus.result.ok && (
            <dl>
              <dt>Modelo</dt>
              <dd>{pingStatus.result.model}</dd>
              <dt>Tempo</dt>
              <dd className="num">{pingStatus.result.latencyMs} ms</dd>
            </dl>
          )}
          {pingStatus.kind === 'done' && !pingStatus.result.ok && <p className="error">{pingStatus.result.error}</p>}
        </div>
      </section>

      <section>
        <h2>Plano de teste</h2>
        <p className="lede">Iniciante, hipertrofia, 3 dias de 45 min, com halteres, banco e elástico.</p>
        <button type="button" onClick={handleGerar} disabled={geracao.kind === 'loading'}>
          {geracao.kind === 'loading' ? 'Gerando o plano…' : plano ? 'Gerar outro plano' : 'Gerar plano'}
        </button>
        <div className="result" role="status" aria-live="polite">
          {geracao.kind === 'loading' && <p className="lede">Isso leva cerca de 20 segundos.</p>}
          {geracao.kind === 'erro' && <p className="error">{geracao.mensagem}</p>}
        </div>

        {plano && (
          <article className="plano">
            <h3>{plano.plano.nome}</h3>
            <p className="meta">
              {plano.plano.duracaoSemanas} semanas · gerado em {new Date(plano.geradoEm).toLocaleString('pt-BR')} · salvo
              no aparelho{persistente ? ' (armazenamento persistente)' : ''}
            </p>
            <p>{plano.plano.resumo}</p>
            {plano.plano.dias.map((dia) => (
              <div key={dia.nome} className="dia">
                <h4>{dia.nome}</h4>
                <p className="meta">{dia.foco}</p>
                <ol>
                  {dia.exercicios.map((p) => (
                    <li key={p.exercicioId}>
                      <span>{EXERCICIO_POR_ID.get(p.exercicioId)?.nome ?? p.exercicioId}</span>
                      <span className="num">{prescricao(p)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </article>
        )}
      </section>
    </main>
  )
}
