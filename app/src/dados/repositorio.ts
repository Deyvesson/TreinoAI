// Operações da sessão sobre o IndexedDB. Toda mudança passa por aqui para a torre ficar coerente.
import type { DiaDeTreino } from '../../../shared/plano'
import { db, type PlanoSalvo, type SerieSalva, type SessaoSalva } from './db'
import { cargaValida, exercicioDe, montarTorre, proximoIncompleto } from './sessao'

export type ValoresSerie = Pick<SerieSalva, 'carga' | 'repeticoes' | 'duracaoSegundos' | 'distanciaKm'>

export function sessaoAtiva(): Promise<SessaoSalva | undefined> {
  return db.sessoes.where('estado').equals('ativa').first()
}

export function diaDaSessao(plano: PlanoSalvo, sessao: Pick<SessaoSalva, 'diaIndice'>): DiaDeTreino {
  return plano.plano.dias[Math.min(sessao.diaIndice, plano.plano.dias.length - 1)]
}

/**
 * Treinos já feitos com este plano, somando as versões anteriores dele (editar não zera a contagem).
 * Conta o que terminou com pelo menos uma série; sessões abandonadas sem série e o histórico de teste ficam de fora.
 */
export async function treinosFeitos(plano: PlanoSalvo): Promise<number> {
  const ids: number[] = []
  let atual: PlanoSalvo | undefined = plano
  while (atual?.id !== undefined && !ids.includes(atual.id)) {
    ids.push(atual.id)
    atual = atual.versaoDe !== undefined ? await db.planos.get(atual.versaoDe) : undefined
  }
  const sessoes = await db.sessoes.where('planoId').anyOf(ids).toArray()
  const terminadas = sessoes.filter((s) => s.estado !== 'ativa' && !s.teste).map((s) => s.id!)
  if (!terminadas.length) return 0
  const comSerie = new Set(await db.series.where('sessaoId').anyOf(terminadas).keys())
  return terminadas.filter((id) => comSerie.has(id)).length
}

/** O dia sugerido é o seguinte ao último treino feito com este plano (ou com as versões anteriores dele). */
export async function proximoDia(plano: PlanoSalvo): Promise<number> {
  let atual: PlanoSalvo | undefined = plano
  while (atual?.id !== undefined) {
    const anteriores = await db.sessoes.where('planoId').equals(atual.id).toArray()
    const feitas = anteriores.filter((s) => s.estado !== 'ativa').sort((a, b) => a.iniciadaEm.localeCompare(b.iniciadaEm))
    const ultima = feitas.at(-1)
    if (ultima) return (ultima.diaIndice + 1) % plano.plano.dias.length
    atual = atual.versaoDe !== undefined ? await db.planos.get(atual.versaoDe) : undefined
  }
  return 0
}

export async function iniciarSessao(plano: PlanoSalvo, diaIndice: number): Promise<number> {
  const dia = plano.plano.dias[diaIndice]
  return db.transaction('rw', db.sessoes, async () => {
    // Uma sessão ativa por vez: uma esquecida aberta é encerrada como estava.
    await db.sessoes.where('estado').equals('ativa').modify({ estado: 'encerrada', encerradaEm: new Date().toISOString() })
    return db.sessoes.add({
      planoId: plano.id!,
      diaIndice,
      iniciadaEm: new Date().toISOString(),
      encerradaEm: null,
      estado: 'ativa',
      atual: dia.exercicios[0]?.exercicioId ?? null,
      descansoAte: null,
    }) as Promise<number>
  })
}

export interface ResultadoRegistro {
  concluida: boolean
  trocouDeExercicio: boolean
}

export async function registrarSerie(sessao: SessaoSalva, dia: DiaDeTreino, valores: ValoresSerie): Promise<ResultadoRegistro> {
  const exercicioId = sessao.atual
  if (!exercicioId || sessao.id === undefined) throw new Error('Sessão sem exercício atual.')
  const prescrito = dia.exercicios.find((p) => p.exercicioId === exercicioId)!

  return db.transaction('rw', db.sessoes, db.series, async () => {
    const jaFeitas = await db.series.where('sessaoId').equals(sessao.id!).toArray()
    const numero = jaFeitas.filter((s) => s.exercicioId === exercicioId).length + 1
    const nova: SerieSalva = { sessaoId: sessao.id!, exercicioId, numero, ...valores, registradaEm: new Date().toISOString() }
    await db.series.add(nova)

    const torre = montarTorre(dia, [...jaFeitas, nova], exercicioId)
    const atualCompleto = torre.find((l) => l.prescrito.exercicioId === exercicioId)!.completo
    const proximo = atualCompleto ? proximoIncompleto(torre, exercicioId) : exercicioId

    if (proximo === null) {
      await db.sessoes.update(sessao.id!, { estado: 'concluida', encerradaEm: new Date().toISOString(), atual: null, descansoAte: null })
      return { concluida: true, trocouDeExercicio: true }
    }
    await db.sessoes.update(sessao.id!, { atual: proximo, descansoAte: Date.now() + prescrito.descansoSegundos * 1000 })
    return { concluida: false, trocouDeExercicio: proximo !== exercicioId }
  })
}

/** Apaga a última série da sessão e volta para o exercício dela, sem descanso pendente. */
export async function desfazerUltimaSerie(sessao: SessaoSalva): Promise<void> {
  await db.transaction('rw', db.sessoes, db.series, async () => {
    const series = await db.series.where('sessaoId').equals(sessao.id!).sortBy('registradaEm')
    const ultima = series.at(-1)
    if (!ultima) return
    await db.series.delete(ultima.id!)
    await db.sessoes.update(sessao.id!, { atual: ultima.exercicioId, descansoAte: null })
  })
}

export async function trocarExercicio(sessao: SessaoSalva, exercicioId: string): Promise<void> {
  await db.sessoes.update(sessao.id!, { atual: exercicioId })
}

export async function ajustarDescanso(sessao: SessaoSalva, segundos: number | null): Promise<void> {
  const descansoAte = segundos === null || !sessao.descansoAte ? null : sessao.descansoAte + segundos * 1000
  await db.sessoes.update(sessao.id!, { descansoAte })
}

export async function encerrarSessao(sessao: SessaoSalva): Promise<void> {
  await db.sessoes.update(sessao.id!, { estado: 'encerrada', encerradaEm: new Date().toISOString(), descansoAte: null })
}

/** Maior carga válida de cada exercício antes desta sessão: a régua do roxo. Serve à sessão ao vivo e ao resumo. */
export async function recordesAnteriores(dia: DiaDeTreino, sessao: SessaoSalva): Promise<Map<string, number>> {
  const recordes = new Map<string, number>()
  for (const p of dia.exercicios) {
    if (exercicioDe(p.exercicioId).medida !== 'carga-reps') continue
    const anteriores = (await db.series.where('exercicioId').equals(p.exercicioId).toArray()).filter(
      (s) => s.sessaoId !== sessao.id && s.registradaEm < sessao.iniciadaEm,
    )
    const carga = cargaValida(p, anteriores)
    if (carga !== null) recordes.set(p.exercicioId, carga)
  }
  return recordes
}

/** Carga para pré-preencher: a da série anterior nesta sessão, senão a última já registrada no exercício. */
export async function cargaSugerida(exercicioId: string, sessaoId: number): Promise<number | null> {
  const series = await db.series.where('exercicioId').equals(exercicioId).sortBy('registradaEm')
  const daSessao = series.filter((s) => s.sessaoId === sessaoId && s.carga !== null).at(-1)
  return (daSessao ?? series.filter((s) => s.carga !== null).at(-1))?.carga ?? null
}
