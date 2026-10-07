// Contrato da análise de progresso entre o app e a API.
// O app envia um resumo do histórico (nunca as séries brutas); a IA devolve a leitura estruturada.
import type { Medida, Nivel } from './exercicios'
import type { Objetivo } from './plano'

/** A análise só é liberada com histórico suficiente para ter o que ler. */
export const MINIMO_TREINOS_ANALISE = 4

export const LIMITES_RESUMO = {
  exercicios: 30,
  sessoesPorExercicio: 16,
  semanas: 12,
  texto: 80,
} as const

export interface SessaoDoExercicio {
  /** Data do treino (AAAA-MM-DD). */
  data: string
  /** A melhor série do dia em texto, ex.: "42,5 kg × 8". */
  melhor: string
  /** O número que a evolução acompanha: carga (kg), repetições, segundos ou km, conforme a medida. */
  valor: number
  metaCumprida: boolean
}

export interface ResumoProgresso {
  perfil: { objetivo: Objetivo; nivel: Nivel; diasPorSemana: number }
  plano: { nome: string; duracaoSemanas: number }
  treinos: number
  primeiroTreino: string
  ultimoTreino: string
  /** Treinos por semana (semana começando na segunda, AAAA-MM-DD), da mais antiga para a mais recente. */
  frequencia: { semana: string; treinos: number }[]
  exercicios: { id: string; nome: string; medida: Medida; sessoes: SessaoDoExercicio[] }[]
}

export interface ExercicioEstagnado {
  exercicioId: string
  explicacao: string
  sugestao: string
}

export interface AnaliseProgresso {
  /** Leitura geral em duas ou três frases. */
  resumo: string
  destaques: string[]
  estagnados: ExercicioEstagnado[]
  proximosPassos: string[]
  /** Comentário sobre a frequência em relação à meta do plano. */
  frequencia: string
  /** O que os dados não permitem concluir (pouco histórico, exercícios recém-incluídos). */
  limitacoes: string | null
}

export interface AnaliseGerada {
  analise: AnaliseProgresso
  geradaEm: string
  modelo: string
  treinosAnalisados: number
}
