// Edição de planos: editar o plano da IA ou montar um do zero.
// Se o plano já tem treinos registrados, salvar cria uma nova versão: os treinos antigos continuam apontando
// para a versão em que foram feitos, e o histórico não muda.
import type { Exercicio } from '../../../shared/exercicios'
import type { ExercicioPrescrito, OrigemPlano, PerfilTreino, Plano } from '../../../shared/plano'
import { ativarPlano, db, lerPerfil, type PlanoSalvo } from './db'
import { exercicioDe } from './sessao'

export const LIMITES_EDICAO = {
  series: { min: 1, max: 10 },
  descanso: { min: 0, max: 300, passo: 15 },
  reps: { min: 1, max: 50 },
  dias: { min: 1, max: 7 },
  exerciciosPorDia: 15,
} as const

/** Meta inicial de um exercício recém-adicionado, conforme a forma de registro. */
export function prescricaoPadrao(e: Exercicio): ExercicioPrescrito {
  const base = {
    exercicioId: e.id,
    motivo: '',
    observacao: null,
    distanciaKm: null,
  }
  switch (e.medida) {
    case 'carga-reps':
    case 'reps':
      return {
        ...base,
        series: 3,
        repeticoesMin: 8,
        repeticoesMax: 12,
        duracaoSegundos: null,
        descansoSegundos: 90,
        repeticoesEmReserva: 2,
      }
    case 'tempo':
    case 'carga-tempo':
      return {
        ...base,
        series: 3,
        repeticoesMin: null,
        repeticoesMax: null,
        duracaoSegundos: 30,
        descansoSegundos: 60,
        repeticoesEmReserva: null,
      }
    case 'distancia-tempo':
      return {
        ...base,
        series: 1,
        repeticoesMin: null,
        repeticoesMax: null,
        duracaoSegundos: 1200,
        descansoSegundos: 0,
        repeticoesEmReserva: null,
      }
  }
}

/** Troca o exercício mantendo séries e descanso; a meta só muda se a forma de registro for outra. */
export function trocarExercicioPrescrito(atual: ExercicioPrescrito, novo: Exercicio): ExercicioPrescrito {
  const anterior = exercicioDe(atual.exercicioId)
  const mesmaMedida = anterior.medida === novo.medida
  const padrao = prescricaoPadrao(novo)
  return {
    ...(mesmaMedida ? atual : padrao),
    exercicioId: novo.id,
    series: atual.series,
    descansoSegundos: atual.descansoSegundos,
    // O motivo da IA era sobre o exercício anterior.
    motivo: '',
    observacao: null,
  }
}

export function planoVazio(nome: string, quantidadeDeDias: number): Plano {
  return {
    nome: nome.trim() || 'Meu plano',
    resumo: 'Plano montado por você.',
    duracaoSemanas: 8,
    progressao: 'Quando completar todas as séries no topo da faixa de repetições, aumente um pouco a carga.',
    dias: Array.from({ length: quantidadeDeDias }, (_, i) => ({
      nome: `Treino ${String.fromCharCode(65 + i)}`,
      foco: '',
      exercicios: [],
    })),
    cuidados: [],
  }
}

export function problemasDoPlano(plano: Plano): string[] {
  const problemas: string[] = []
  if (!plano.nome.trim()) problemas.push('Dê um nome ao plano.')
  plano.dias.forEach((dia, i) => {
    const rotulo = dia.nome.trim() || `Treino ${i + 1}`
    if (!dia.nome.trim()) problemas.push(`O treino ${i + 1} precisa de um nome.`)
    if (!dia.exercicios.length) problemas.push(`${rotulo} não tem exercícios.`)
    const ids = dia.exercicios.map((p) => p.exercicioId)
    if (new Set(ids).size !== ids.length) problemas.push(`${rotulo} tem o mesmo exercício repetido.`)
  })
  return problemas
}

function perfilPadrao(plano: Plano): PerfilTreino {
  return {
    objetivo: 'saude',
    nivel: 'intermediario',
    diasPorSemana: Math.min(6, Math.max(2, plano.dias.length)),
    minutosPorSessao: 60,
    equipamento: [],
    limitacoes: null,
  }
}

/** Salva o plano editado (ou novo) como ativo. Devolve o id do plano salvo. */
export async function salvarPlano(original: PlanoSalvo | null, plano: Plano): Promise<number> {
  const agora = new Date().toISOString()
  const origem: OrigemPlano = !original || original.origem === 'manual' ? 'manual' : 'editado'
  const limpo: Plano = {
    ...plano,
    nome: plano.nome.trim(),
    dias: plano.dias.map((d) => ({ ...d, nome: d.nome.trim() })),
  }

  if (original?.id !== undefined) {
    const usado = (await db.sessoes.where('planoId').equals(original.id).count()) > 0
    if (!usado) {
      await db.planos.update(original.id, {
        plano: limpo,
        origem,
        editadoEm: agora,
        ativo: 1,
      })
      return original.id
    }
  }
  // Os dias por semana são a meta da pessoa, não o número de treinos: uma divisão ABC pode rodar 5 vezes por semana.
  const perfil = original?.perfil ?? (await lerPerfil()) ?? perfilPadrao(limpo)
  return ativarPlano({
    plano: limpo,
    perfil,
    geradoEm: original?.geradoEm ?? agora,
    modelo: original?.modelo ?? 'manual',
    origem,
    editadoEm: agora,
    versaoDe: original?.id,
  })
}
