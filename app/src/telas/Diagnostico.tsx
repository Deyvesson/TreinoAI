import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import type { PerfilTreino } from '../../../shared/plano'
import { gerarPlano } from '../dados/api'
import { ativarPlano, pedirArmazenamentoPersistente, planoAtivo, salvarPerfil, type PlanoSalvo } from '../dados/db'
import { exercicioDe } from '../dados/sessao'
import { apagarHistoricoDeTeste, contarTreinosDeTeste, gerarHistoricoDeTeste } from '../dados/teste'
import { navegar } from '../rotas'
import './diagnostico.css'

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

export default function Diagnostico() {
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
      <button type="button" className="probe-voltar" onClick={() => navegar('/')}>
        ← Voltar ao treino
      </button>

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
                      <span>{exercicioDe(p.exercicioId).nome}</span>
                      <span className="num">{prescricao(p)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </article>
        )}
      </section>

      <HistoricoDeTeste />
    </main>
  )
}

/** Cria treinos de exemplo para testar a tela de progresso e a análise da IA sem precisar treinar 4 vezes. */
function HistoricoDeTeste() {
  const quantos = useLiveQuery(() => contarTreinosDeTeste(), [])
  const [estado, setEstado] = useState<{ tipo: 'parado' | 'trabalhando' } | { tipo: 'feito' | 'erro'; mensagem: string }>({ tipo: 'parado' })

  async function gerar() {
    setEstado({ tipo: 'trabalhando' })
    try {
      const criados = await gerarHistoricoDeTeste()
      setEstado({ tipo: 'feito', mensagem: `${criados} treinos de exemplo criados nas últimas 6 semanas.` })
    } catch (falha) {
      setEstado({ tipo: 'erro', mensagem: (falha as Error).message })
    }
  }

  async function apagar() {
    setEstado({ tipo: 'trabalhando' })
    const removidos = await apagarHistoricoDeTeste()
    setEstado({ tipo: 'feito', mensagem: `${removidos} treinos de exemplo removidos (e as análises salvas).` })
  }

  return (
    <section>
      <h2>Histórico de teste</h2>
      <p className="lede">
        Cria cerca de 15 treinos de exemplo a partir do plano ativo, em 6 semanas, para testar a tela Progresso e a análise da
        IA. Ficam marcados como teste e podem ser apagados sem tocar nos treinos reais.
      </p>
      <button type="button" onClick={gerar} disabled={estado.tipo === 'trabalhando'}>
        Gerar histórico de teste
      </button>
      {Boolean(quantos) && (
        <button type="button" className="probe-secundario" onClick={apagar} disabled={estado.tipo === 'trabalhando'}>
          Apagar histórico de teste ({quantos})
        </button>
      )}
      <div className="result" role="status" aria-live="polite">
        {(estado.tipo === 'feito' || estado.tipo === 'erro') && (
          <p className={estado.tipo === 'erro' ? 'error' : 'lede'}>
            {estado.mensagem}{' '}
            {estado.tipo === 'feito' && (
              <button type="button" className="probe-voltar" onClick={() => navegar('/progresso')}>
                Abrir Progresso →
              </button>
            )}
          </p>
        )}
      </div>
    </section>
  )
}
