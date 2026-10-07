// Histórico e progresso: tudo calculado no aparelho a partir das sessões e séries salvas.
import type { Medida } from '../../../shared/exercicios'
import type { PerfilTreino } from '../../../shared/plano'
import { LIMITES_RESUMO, type ResumoProgresso } from '../../../shared/progresso'
import { db, type PlanoSalvo, type SerieSalva, type SessaoSalva } from './db'
import { diaDaSessao } from './repositorio'
import { cumpriuMeta, exercicioDe, montarTorre, textoSerie } from './sessao'

export interface PontoEvolucao {
  sessaoId: number
  data: string
  valor: number
  texto: string
  metaCumprida: boolean
  recorde: boolean
}

export interface EvolucaoExercicio {
  id: string
  nome: string
  medida: Medida
  unidade: string
  pontos: PontoEvolucao[]
}

export interface TreinoFeito {
  sessao: SessaoSalva
  nomeDia: string
  duracaoSegundos: number
  series: number
  exerciciosNaMeta: number
  exerciciosNoDia: number
}

export interface SemanaFrequencia {
  /** Segunda-feira da semana (AAAA-MM-DD). */
  inicio: string
  treinos: number
}

export interface Historico {
  treinos: TreinoFeito[]
  evolucao: EvolucaoExercicio[]
  frequencia: SemanaFrequencia[]
}

const UNIDADE: Record<Medida, string> = {
  'carga-reps': 'kg',
  reps: 'reps',
  tempo: 's',
  'carga-tempo': 'kg',
  'distancia-tempo': 'km',
}

/** O número que a evolução acompanha em cada tipo de registro. */
function valorDaSerie(medida: Medida, s: SerieSalva): number {
  switch (medida) {
    case 'carga-reps':
    case 'carga-tempo':
      return s.carga ?? 0
    case 'reps':
      return s.repeticoes ?? 0
    case 'tempo':
      return s.duracaoSegundos ?? 0
    case 'distancia-tempo':
      return s.distanciaKm ?? (s.duracaoSegundos ?? 0) / 60
  }
}

const dataLocal = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function segundaDaSemana(data: Date): Date {
  const d = new Date(data.getFullYear(), data.getMonth(), data.getDate())
  const dia = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dia)
  return d
}

export async function carregarHistorico(semanas = 8): Promise<Historico> {
  const sessoes = (await db.sessoes.toArray())
    .filter((s) => s.estado !== 'ativa')
    .sort((a, b) => a.iniciadaEm.localeCompare(b.iniciadaEm))
  const planos = new Map((await db.planos.toArray()).map((p) => [p.id!, p]))
  const todasSeries = await db.series.toArray()
  const seriesPorSessao = new Map<number, SerieSalva[]>()
  for (const s of todasSeries) seriesPorSessao.set(s.sessaoId, [...(seriesPorSessao.get(s.sessaoId) ?? []), s])

  const treinos: TreinoFeito[] = []
  const porExercicio = new Map<string, EvolucaoExercicio>()

  for (const sessao of sessoes) {
    const series = seriesPorSessao.get(sessao.id!) ?? []
    if (!series.length) continue
    const plano = planos.get(sessao.planoId)
    if (!plano) continue
    const dia = diaDaSessao(plano, sessao)
    const torre = montarTorre(dia, series, null)
    const fim = sessao.encerradaEm ?? series.map((s) => s.registradaEm).sort().at(-1) ?? sessao.iniciadaEm
    treinos.push({
      sessao,
      nomeDia: dia.nome,
      duracaoSegundos: (Date.parse(fim) - Date.parse(sessao.iniciadaEm)) / 1000,
      series: series.length,
      exerciciosNaMeta: torre.filter((l) => l.estado === 'meta' || l.estado === 'recorde').length,
      exerciciosNoDia: torre.length,
    })

    for (const linha of torre) {
      if (!linha.series.length) continue
      const e = linha.exercicio
      const melhor = linha.melhor!
      const evolucao = porExercicio.get(e.id) ?? { id: e.id, nome: e.nome, medida: e.medida, unidade: UNIDADE[e.medida], pontos: [] }
      evolucao.pontos.push({
        sessaoId: sessao.id!,
        data: dataLocal(sessao.iniciadaEm),
        valor: valorDaSerie(e.medida, melhor),
        texto: textoSerie(melhor, e),
        metaCumprida: linha.series.every((s) => cumpriuMeta(linha.prescrito, e, s)),
        recorde: false,
      })
      porExercicio.set(e.id, evolucao)
    }
  }

  // Recorde: o ponto que supera todos os anteriores (o primeiro registro não conta como recorde).
  for (const evolucao of porExercicio.values()) {
    let maximo = -Infinity
    evolucao.pontos.forEach((p, i) => {
      if (i > 0 && p.valor > maximo) p.recorde = true
      maximo = Math.max(maximo, p.valor)
    })
  }

  // A série começa na semana do primeiro treino (no máximo `semanas`): antes disso não existe "semana sem treino".
  const hoje = segundaDaSemana(new Date())
  const frequencia: SemanaFrequencia[] = []
  const inicioDoHistorico = treinos[0] ? segundaDaSemana(new Date(treinos[0].sessao.iniciadaEm)) : hoje
  const semanasDesdeOInicio = Math.round((hoje.getTime() - inicioDoHistorico.getTime()) / (7 * 24 * 3600 * 1000)) + 1
  for (let i = Math.min(semanas, semanasDesdeOInicio) - 1; i >= 0; i--) {
    const inicio = new Date(hoje)
    inicio.setDate(inicio.getDate() - i * 7)
    const fim = new Date(inicio)
    fim.setDate(fim.getDate() + 7)
    frequencia.push({
      inicio: dataLocal(inicio.toISOString()),
      treinos: treinos.filter((t) => {
        const d = new Date(t.sessao.iniciadaEm)
        return d >= inicio && d < fim
      }).length,
    })
  }

  const evolucao = [...porExercicio.values()].sort((a, b) => b.pontos.length - a.pontos.length || a.nome.localeCompare(b.nome))
  return { treinos: treinos.reverse(), evolucao, frequencia }
}

/** O resumo que vai para a IA: só o necessário, nunca as séries brutas. */
export function montarResumo(historico: Historico, perfil: PerfilTreino, plano: PlanoSalvo): ResumoProgresso {
  const cronologico = [...historico.treinos].reverse()
  const corta = (texto: string) => texto.slice(0, LIMITES_RESUMO.texto)
  return {
    perfil: { objetivo: perfil.objetivo, nivel: perfil.nivel, diasPorSemana: perfil.diasPorSemana },
    plano: { nome: corta(plano.plano.nome), duracaoSemanas: plano.plano.duracaoSemanas },
    treinos: historico.treinos.length,
    primeiroTreino: dataLocal(cronologico[0].sessao.iniciadaEm),
    ultimoTreino: dataLocal(cronologico.at(-1)!.sessao.iniciadaEm),
    frequencia: historico.frequencia.slice(-LIMITES_RESUMO.semanas).map((s) => ({ semana: s.inicio, treinos: s.treinos })),
    exercicios: historico.evolucao.slice(0, LIMITES_RESUMO.exercicios).map((e) => ({
      id: e.id,
      nome: corta(e.nome),
      medida: e.medida,
      sessoes: e.pontos.slice(-LIMITES_RESUMO.sessoesPorExercicio).map((p) => ({
        data: p.data,
        melhor: corta(p.texto),
        valor: Math.round(p.valor * 100) / 100,
        metaCumprida: p.metaCumprida,
      })),
    })),
  }
}

export function nomeDoExercicio(id: string): string {
  return exercicioDe(id).nome
}
