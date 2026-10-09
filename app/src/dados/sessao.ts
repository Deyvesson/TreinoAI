// Regras da sessão, sem acesso a banco: montam a torre a partir do dia do plano e das séries registradas.
import type { Equipamento, Exercicio } from '../../../shared/exercicios'
import type { DiaDeTreino, ExercicioPrescrito } from '../../../shared/plano'
import { exercicioPorId } from './catalogo'
import type { SerieSalva } from './db'

/** Cores da cronometragem: verde meta, roxo recorde, amarelo abaixo, cinza pendente; `atual` é a série no ar. */
export type EstadoExercicio = 'pendente' | 'atual' | 'meta' | 'recorde' | 'abaixo'

export interface LinhaTorre {
  posicao: number
  prescrito: ExercicioPrescrito
  exercicio: Exercicio
  series: SerieSalva[]
  feitas: number
  total: number
  completo: boolean
  estado: EstadoExercicio
  melhor: SerieSalva | null
}

const EXERCICIO_DESCONHECIDO = (id: string): Exercicio => ({
  id,
  nome: id,
  grupo: 'corpo-inteiro',
  padrao: 'isolamento',
  tipo: 'isolado',
  equipamento: [],
  medida: 'reps',
  nivel: 'iniciante',
})

export function exercicioDe(id: string): Exercicio {
  return exercicioPorId(id) ?? EXERCICIO_DESCONHECIDO(id)
}

export function cumpriuMeta(p: ExercicioPrescrito, e: Exercicio, s: SerieSalva): boolean {
  switch (e.medida) {
    case 'carga-reps':
    case 'reps':
      return (s.repeticoes ?? 0) >= (p.repeticoesMin ?? 1)
    case 'tempo':
    case 'carga-tempo':
      return (s.duracaoSegundos ?? 0) >= (p.duracaoSegundos ?? 0)
    case 'distancia-tempo':
      return p.distanciaKm
        ? (s.distanciaKm ?? 0) >= p.distanciaKm
        : (s.duracaoSegundos ?? 0) >= (p.duracaoSegundos ?? 0)
  }
}

function melhorSerie(e: Exercicio, series: SerieSalva[]): SerieSalva | null {
  if (!series.length) return null
  const chave = (s: SerieSalva): number => {
    switch (e.medida) {
      case 'carga-reps':
        return (s.carga ?? 0) * 1000 + (s.repeticoes ?? 0)
      case 'reps':
        return s.repeticoes ?? 0
      case 'tempo':
        return s.duracaoSegundos ?? 0
      case 'carga-tempo':
        return (s.carga ?? 0) * 10000 + (s.duracaoSegundos ?? 0)
      case 'distancia-tempo':
        return (s.distanciaKm ?? 0) * 100000 + (s.duracaoSegundos ?? 0)
    }
  }
  return series.reduce((melhor, s) => (chave(s) > chave(melhor) ? s : melhor))
}

/** Maior carga com repetições dentro da faixa. É a régua do recorde. */
export function cargaValida(p: ExercicioPrescrito, series: readonly SerieSalva[]): number | null {
  const validas = series.filter((s) => s.carga !== null && (s.repeticoes ?? 0) >= (p.repeticoesMin ?? 1))
  return validas.length ? Math.max(...validas.map((s) => s.carga!)) : null
}

function bateuRecorde(p: ExercicioPrescrito, e: Exercicio, series: SerieSalva[], anterior: number | undefined): boolean {
  if (e.medida !== 'carga-reps' || anterior === undefined) return false
  const hoje = cargaValida(p, series)
  return hoje !== null && hoje > anterior
}

export function montarTorre(
  dia: DiaDeTreino,
  series: readonly SerieSalva[],
  atualId: string | null,
  recordesAnteriores: ReadonlyMap<string, number> = new Map(),
): LinhaTorre[] {
  return dia.exercicios.map((p, i) => {
    const e = exercicioDe(p.exercicioId)
    const minhas = series.filter((s) => s.exercicioId === p.exercicioId).sort((a, b) => a.numero - b.numero)
    const completo = minhas.length >= p.series
    let estado: EstadoExercicio
    if (completo) {
      // O roxo vence o amarelo, como a volta mais rápida na cronometragem.
      if (bateuRecorde(p, e, minhas, recordesAnteriores.get(p.exercicioId))) estado = 'recorde'
      else estado = minhas.some((s) => !cumpriuMeta(p, e, s)) ? 'abaixo' : 'meta'
    } else {
      estado = p.exercicioId === atualId ? 'atual' : 'pendente'
    }
    return {
      posicao: i + 1,
      prescrito: p,
      exercicio: e,
      series: minhas,
      feitas: minhas.length,
      total: p.series,
      completo,
      estado,
      melhor: melhorSerie(e, minhas),
    }
  })
}

/** Próximo exercício incompleto na ordem do plano, a partir do atual e dando a volta. */
export function proximoIncompleto(torre: readonly LinhaTorre[], aPartirDe: string | null): string | null {
  const inicio = Math.max(0, torre.findIndex((l) => l.prescrito.exercicioId === aPartirDe))
  for (let passo = 0; passo < torre.length; passo++) {
    const linha = torre[(inicio + passo) % torre.length]
    if (!linha.completo) return linha.prescrito.exercicioId
  }
  return null
}

const INCREMENTO: Partial<Record<Equipamento, number>> = {
  barra: 2.5,
  halteres: 2,
  maquina: 5,
  polia: 5,
  smith: 5,
}

export function incrementoDeCarga(e: Exercicio): number {
  for (const item of ['barra', 'halteres', 'maquina', 'polia', 'smith'] as const) {
    if (e.equipamento.includes(item)) return INCREMENTO[item]!
  }
  return 2.5
}

/** Execução de uma série (sem o descanso): duração prescrita, ou ~4 s por repetição, ou ~7 min por km. */
function segundosDeExecucao(p: ExercicioPrescrito): number {
  const lados = exercicioDe(p.exercicioId).unilateral ? 2 : 1
  const execucao = p.duracaoSegundos ?? (p.distanciaKm ? p.distanciaKm * 420 : (p.repeticoesMax ?? p.repeticoesMin ?? 10) * 4)
  return execucao * lados
}

export function minutosEstimados(dia: DiaDeTreino): number {
  let segundos = 0
  for (const p of dia.exercicios) segundos += p.series * (segundosDeExecucao(p) + p.descansoSegundos)
  return Math.round(segundos / 60)
}

/**
 * Quanto do treino já foi, contado em séries (avança a cada série, não só a cada exercício),
 * e quanto falta pelo plano: séries restantes com execução e descanso, mais o descanso em curso.
 */
export function progressoDaSessao(torre: readonly LinhaTorre[], descansoRestante: number | null) {
  let feitas = 0
  let total = 0
  let segundos = descansoRestante ?? 0
  for (const linha of torre) {
    total += linha.total
    feitas += Math.min(linha.feitas, linha.total)
    const faltam = Math.max(0, linha.total - linha.feitas)
    segundos += faltam * (segundosDeExecucao(linha.prescrito) + linha.prescrito.descansoSegundos)
  }
  // A última série do treino não tem descanso depois.
  const ultima = torre.findLast((l) => !l.completo)
  if (ultima) segundos -= ultima.prescrito.descansoSegundos
  return {
    percentual: total ? Math.round((feitas / total) * 100) : 0,
    segundosRestantes: Math.max(0, segundos),
  }
}

/** "cerca de 25 min", "menos de 1 min". */
export function textoTempoRestante(segundos: number): string {
  const minutos = Math.round(segundos / 60)
  return minutos < 1 ? 'menos de 1 min' : `cerca de ${minutos} min`
}

// Formatação em PT-BR.

const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export const formatarNumero = (valor: number) => numero.format(valor)

export function formatarTempo(segundos: number): string {
  const total = Math.max(0, Math.round(segundos))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const ss = String(s).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

/** A meta da série em uma linha: "8–12 reps por lado · 2 em reserva". */
export function textoMeta(p: ExercicioPrescrito, e: Exercicio): string {
  const partes: string[] = []
  switch (e.medida) {
    case 'carga-reps':
    case 'reps': {
      const faixa = p.repeticoesMin === p.repeticoesMax ? `${p.repeticoesMin}` : `${p.repeticoesMin}–${p.repeticoesMax}`
      partes.push(`${faixa} reps${e.unilateral ? ' por lado' : ''}`)
      if (p.repeticoesEmReserva !== null) partes.push(`${p.repeticoesEmReserva} em reserva`)
      break
    }
    case 'tempo':
      partes.push(`${formatarTempo(p.duracaoSegundos ?? 0)}${e.unilateral ? ' por lado' : ''}`)
      break
    case 'carga-tempo':
      partes.push(`${formatarTempo(p.duracaoSegundos ?? 0)} com carga`)
      break
    case 'distancia-tempo':
      if (p.distanciaKm) partes.push(`${formatarNumero(p.distanciaKm)} km`)
      if (p.duracaoSegundos) partes.push(`${Math.round(p.duracaoSegundos / 60)} min`)
      break
  }
  return partes.join(' · ')
}

/** Prescrição compacta para a torre: "4 × 8–12". */
export function textoPrescricao(p: ExercicioPrescrito, e: Exercicio): string {
  switch (e.medida) {
    case 'carga-reps':
    case 'reps':
      return `${p.series} × ${p.repeticoesMin === p.repeticoesMax ? p.repeticoesMin : `${p.repeticoesMin}–${p.repeticoesMax}`}`
    case 'tempo':
    case 'carga-tempo':
      return `${p.series} × ${formatarTempo(p.duracaoSegundos ?? 0)}`
    case 'distancia-tempo':
      return p.distanciaKm ? `${formatarNumero(p.distanciaKm)} km` : `${Math.round((p.duracaoSegundos ?? 0) / 60)} min`
  }
}

/** O que foi feito numa série: "22,5 kg × 10". */
export function textoSerie(s: SerieSalva, e: Exercicio): string {
  switch (e.medida) {
    case 'carga-reps':
      return `${formatarNumero(s.carga ?? 0)} kg × ${s.repeticoes ?? 0}`
    case 'reps':
      return s.carga ? `${s.repeticoes ?? 0} reps + ${formatarNumero(s.carga)} kg` : `${s.repeticoes ?? 0} reps`
    case 'tempo':
      return formatarTempo(s.duracaoSegundos ?? 0)
    case 'carga-tempo':
      return `${formatarNumero(s.carga ?? 0)} kg · ${formatarTempo(s.duracaoSegundos ?? 0)}`
    case 'distancia-tempo':
      return [s.distanciaKm ? `${formatarNumero(s.distanciaKm)} km` : null, s.duracaoSegundos ? formatarTempo(s.duracaoSegundos) : null]
        .filter(Boolean)
        .join(' · ')
  }
}

export const ROTULO_ESTADO: Record<EstadoExercicio, string> = {
  pendente: 'Pendente',
  atual: 'Agora',
  meta: 'Meta cumprida',
  recorde: 'Recorde pessoal',
  abaixo: 'Abaixo da meta',
}
