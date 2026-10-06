import type { PerfilTreino, PlanoGerado } from '../../../shared/plano'

// Um pouco acima do limite de 45 s das Functions do SWA, para a resposta de erro da API chegar primeiro.
const TEMPO_LIMITE_MS = 50_000

export type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: string }

export async function gerarPlano(perfil: PerfilTreino): Promise<Resultado<PlanoGerado>> {
  if (!navigator.onLine) {
    return { ok: false, erro: 'Sem conexão. Gerar o plano precisa de internet; tente de novo quando estiver online.' }
  }
  try {
    const resposta = await fetch('/api/plano', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(perfil),
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    })
    const corpo = (await resposta.json().catch(() => null)) as
      | ({ ok: true } & PlanoGerado)
      | { ok: false; erro: string }
      | null
    if (!corpo) return { ok: false, erro: 'A resposta da API veio vazia. Tente de novo.' }
    if (!corpo.ok) return { ok: false, erro: corpo.erro }
    const { ok: _ok, ...gerado } = corpo
    return { ok: true, valor: gerado }
  } catch (falha) {
    if (falha instanceof DOMException && falha.name === 'TimeoutError') {
      return { ok: false, erro: 'A geração demorou demais. Tente de novo.' }
    }
    return { ok: false, erro: 'Não foi possível falar com a API. Verifique a conexão e tente de novo.' }
  }
}
