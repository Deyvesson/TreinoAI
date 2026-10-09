// Contrato entre o app e a API: o perfil que o usuário preenche e o plano que a IA devolve.
// Só tipos e constantes, sem dependências, para valer igual no app, na API e nos scripts.
import type { Equipamento, Nivel } from './exercicios'

export const OBJETIVOS = ['hipertrofia', 'forca', 'emagrecimento', 'condicionamento', 'saude'] as const
export type Objetivo = (typeof OBJETIVOS)[number]

export const LIMITES_PERFIL = {
  diasPorSemana: { min: 2, max: 6 },
  minutosPorSessao: { min: 20, max: 120 },
  limitacoesCaracteres: 300,
} as const

export interface PerfilTreino {
  objetivo: Objetivo
  nivel: Nivel
  diasPorSemana: number
  minutosPorSessao: number
  /** Tudo o que o usuário tem à disposição. Lista vazia = só peso corporal. */
  equipamento: Equipamento[]
  /** Lesões, dores ou restrições, em texto livre. */
  limitacoes: string | null
}

// A prescrição usa os campos que fazem sentido para a `medida` do exercício no catálogo;
// os demais vêm null (ex.: prancha tem duracaoSegundos, não repetições).
export interface ExercicioPrescrito {
  /** ID do catálogo (planos da IA usam só estes) ou de um exercício criado pelo usuário (`pessoal-...`). */
  exercicioId: string
  series: number
  repeticoesMin: number | null
  repeticoesMax: number | null
  duracaoSegundos: number | null
  distanciaKm: number | null
  descansoSegundos: number
  /** Repetições em reserva ao fim da série (0 = falha). */
  repeticoesEmReserva: number | null
  /** Por que este exercício está aqui, em uma frase. */
  motivo: string
  observacao: string | null
}

export interface DiaDeTreino {
  nome: string
  foco: string
  exercicios: ExercicioPrescrito[]
}

export interface Plano {
  nome: string
  /** Por que o plano tem este formato, em linguagem simples. */
  resumo: string
  duracaoSemanas: number
  /** Como avançar ao longo das semanas. */
  progressao: string
  dias: DiaDeTreino[]
  /** Ajustes feitos por causa das limitações e avisos de segurança. */
  cuidados: string[]
  /** Quantas vezes a pessoa vai fazer estes treinos antes de trocar de plano. Ausente = TOTAL_TREINOS_PADRAO. */
  totalTreinos?: number
}

export const TOTAL_TREINOS_PADRAO = 40
export const LIMITES_TOTAL_TREINOS = { min: 1, max: 999 } as const

/** De onde o plano veio: gerado pela IA, editado pelo usuário a partir de um da IA, ou montado do zero. */
export type OrigemPlano = 'ia' | 'editado' | 'manual'

export interface PlanoGerado {
  plano: Plano
  perfil: PerfilTreino
  geradoEm: string
  modelo: string
}
