import { useState } from 'react'

type PingResult =
  | { ok: true; model: string; reply: string; latencyMs: number }
  | { ok: false; error: string; latencyMs?: number }

type Status = { kind: 'idle' } | { kind: 'loading' } | { kind: 'done'; result: PingResult }

async function ping(): Promise<PingResult> {
  try {
    const response = await fetch('/api/ping')
    const body = (await response.json()) as PingResult
    return body
  } catch {
    return { ok: false, error: 'A API não respondeu. Verifique sua conexão e tente de novo.' }
  }
}

export default function App() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  async function handleTest() {
    setStatus({ kind: 'loading' })
    setStatus({ kind: 'done', result: await ping() })
  }

  return (
    <main className="probe">
      <h1>TreinoAI</h1>
      <p className="lede">
        Fase 1: teste de conexão entre o app, a API no Static Web Apps e o modelo no Azure AI Foundry.
      </p>

      <button type="button" onClick={handleTest} disabled={status.kind === 'loading'}>
        {status.kind === 'loading' ? 'Testando…' : 'Testar conexão com a IA'}
      </button>

      <div className="result" role="status" aria-live="polite">
        {status.kind === 'done' && status.result.ok && (
          <dl>
            <dt>Resultado</dt>
            <dd className="ok">Conectado</dd>
            <dt>Modelo</dt>
            <dd>{status.result.model}</dd>
            <dt>Resposta</dt>
            <dd>{status.result.reply || '(vazia)'}</dd>
            <dt>Tempo</dt>
            <dd className="num">{status.result.latencyMs} ms</dd>
          </dl>
        )}
        {status.kind === 'done' && !status.result.ok && <p className="error">{status.result.error}</p>}
      </div>
    </main>
  )
}
