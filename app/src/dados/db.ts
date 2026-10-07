import Dexie, { type EntityTable } from 'dexie'
import type { PerfilTreino, PlanoGerado } from '../../../shared/plano'
import type { AnaliseGerada } from '../../../shared/progresso'

export interface PerfilSalvo extends PerfilTreino {
  id: 'atual'
  atualizadoEm: string
}

// IndexedDB não indexa booleanos, por isso `ativo` é 0 ou 1.
export interface PlanoSalvo extends PlanoGerado {
  id?: number
  ativo: 0 | 1
}

export type EstadoSessao = 'ativa' | 'concluida' | 'encerrada'

export interface SessaoSalva {
  id?: number
  planoId: number
  diaIndice: number
  iniciadaEm: string
  encerradaEm: string | null
  estado: EstadoSessao
  /** Exercício em execução; a troca livre muda este campo. */
  atual: string | null
  /** Fim do descanso em ms desde a época (sobrevive a tela bloqueada e recarga); null fora do descanso. */
  descansoAte: number | null
}

export interface SerieSalva {
  id?: number
  sessaoId: number
  exercicioId: string
  numero: number
  carga: number | null
  repeticoes: number | null
  duracaoSegundos: number | null
  distanciaKm: number | null
  registradaEm: string
}

export interface AnaliseSalva extends AnaliseGerada {
  id?: number
}

export const db = new Dexie('treinoai') as Dexie & {
  perfil: EntityTable<PerfilSalvo, 'id'>
  planos: EntityTable<PlanoSalvo, 'id'>
  sessoes: EntityTable<SessaoSalva, 'id'>
  series: EntityTable<SerieSalva, 'id'>
  analises: EntityTable<AnaliseSalva, 'id'>
}

// Novas tabelas entram numa nova versão, sem apagar as anteriores.
db.version(1).stores({
  perfil: 'id',
  planos: '++id, ativo, geradoEm',
})
db.version(2).stores({
  sessoes: '++id, estado, planoId, iniciadaEm',
  series: '++id, sessaoId, exercicioId, registradaEm',
})
db.version(3).stores({
  analises: '++id, geradaEm',
})

export async function salvarPerfil(perfil: PerfilTreino): Promise<void> {
  await db.perfil.put({ ...perfil, id: 'atual', atualizadoEm: new Date().toISOString() })
}

export async function lerPerfil(): Promise<PerfilTreino | undefined> {
  const salvo = await db.perfil.get('atual')
  if (!salvo) return undefined
  const { id: _id, atualizadoEm: _atualizadoEm, ...perfil } = salvo
  return perfil
}

/** Salva o plano como ativo. Os anteriores ficam no histórico, porque as sessões registradas apontam para eles. */
export async function ativarPlano(gerado: PlanoGerado): Promise<number> {
  return db.transaction('rw', db.planos, async () => {
    await db.planos.where('ativo').equals(1).modify({ ativo: 0 })
    return db.planos.add({ ...gerado, ativo: 1 }) as Promise<number>
  })
}

export function planoAtivo(): Promise<PlanoSalvo | undefined> {
  return db.planos.where('ativo').equals(1).first()
}

/**
 * Pede ao navegador para não apagar os dados sob pressão de espaço (o Safari apaga dados de sites
 * não instalados após um tempo sem uso). Devolve se o armazenamento ficou persistente.
 */
export async function pedirArmazenamentoPersistente(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}
