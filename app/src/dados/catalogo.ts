// Catálogo unificado: o catálogo fixo (shared/exercicios) mais os exercícios criados pelo usuário neste aparelho.
// Os pessoais ficam num mapa em memória, carregado antes da primeira tela, para as consultas serem síncronas.
import { EXERCICIOS, EXERCICIO_POR_ID, type Exercicio, type Grupo, type Medida } from '../../../shared/exercicios'
import { db, type ExercicioPersonalizado } from './db'

export const ROTULO_GRUPO: Record<Grupo, string> = {
  peito: 'Peito',
  costas: 'Costas',
  ombros: 'Ombros',
  trapezio: 'Trapézio',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  antebracos: 'Antebraços',
  quadriceps: 'Quadríceps',
  posteriores: 'Posteriores',
  gluteos: 'Glúteos',
  adutores: 'Adutores',
  panturrilhas: 'Panturrilhas',
  abdomen: 'Abdômen',
  lombar: 'Lombar',
  'corpo-inteiro': 'Corpo inteiro',
  cardio: 'Cardio',
}

/** Como registrar um exercício criado pelo usuário; carga com tempo fica de fora por ser rara. */
export const OPCOES_MEDIDA: {
  medida: Medida
  titulo: string
  detalhe: string
}[] = [
  {
    medida: 'carga-reps',
    titulo: 'Carga e repetições',
    detalhe: 'Ex.: 20 kg × 10',
  },
  {
    medida: 'reps',
    titulo: 'Só repetições',
    detalhe: 'Peso do corpo, carga opcional',
  },
  { medida: 'tempo', titulo: 'Tempo', detalhe: 'Ex.: prancha por 45 s' },
  {
    medida: 'distancia-tempo',
    titulo: 'Distância e tempo',
    detalhe: 'Corrida, bicicleta, remo',
  },
]

const personalizados = new Map<string, ExercicioPersonalizado>()

export async function carregarPersonalizados(): Promise<void> {
  for (const e of await db.exercicios.toArray()) personalizados.set(e.id, e)
}

export function exercicioPorId(id: string): Exercicio | undefined {
  return EXERCICIO_POR_ID.get(id) ?? personalizados.get(id)
}

export function ehPessoal(id: string): boolean {
  return personalizados.has(id)
}

export const normalizar = (texto: string) =>
  texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()

/**
 * Busca por nome e apelidos, sem acento. Todas as palavras digitadas precisam aparecer;
 * nomes que começam com o texto vêm primeiro, depois palavras que começam com ele, depois o resto.
 */
export function buscarExercicios(texto: string, limite = 40): Exercicio[] {
  const consulta = normalizar(texto)
  const todos = [...(EXERCICIOS as readonly Exercicio[]).filter((e) => !e.descontinuado), ...personalizados.values()]
  if (!consulta) return todos.slice(0, limite)
  const palavras = consulta.split(' ')
  const pontuados: { e: Exercicio; pontos: number }[] = []
  for (const e of todos) {
    const nome = normalizar(e.nome)
    const termos = [nome, ...(e.apelidos ?? []).map(normalizar)]
    const tudo = termos.join(' ')
    if (!palavras.every((p) => tudo.includes(p))) continue
    let pontos = 3
    if (termos.some((t) => t === consulta)) pontos = 0
    else if (termos.some((t) => t.startsWith(consulta))) pontos = 1
    else if (termos.some((t) => t.split(' ').some((w) => w.startsWith(palavras[0])))) pontos = 2
    pontuados.push({ e, pontos })
  }
  return pontuados
    .sort((a, b) => a.pontos - b.pontos || a.e.nome.localeCompare(b.e.nome, 'pt-BR'))
    .slice(0, limite)
    .map((p) => p.e)
}

/** Já existe um exercício com exatamente este nome (sem acento e sem diferença de maiúsculas)? */
export function existeComNome(texto: string): boolean {
  const consulta = normalizar(texto)
  return buscarExercicios(texto, 400).some((e) => normalizar(e.nome) === consulta)
}

function slug(texto: string): string {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36)
}

/** Cria um exercício pessoal: entra no treino sem imagem e fica disponível para os próximos planos. */
export async function criarExercicioPessoal(
  nome: string,
  medida: Medida,
  unilateral: boolean,
): Promise<ExercicioPersonalizado> {
  const limpo = nome.trim().replace(/\s+/g, ' ')
  const exercicio: ExercicioPersonalizado = {
    id: `pessoal-${slug(limpo) || 'exercicio'}-${Math.random().toString(36).slice(2, 6)}`,
    nome: limpo.charAt(0).toUpperCase() + limpo.slice(1),
    grupo: medida === 'distancia-tempo' ? 'cardio' : 'corpo-inteiro',
    padrao: medida === 'distancia-tempo' ? 'cardio' : 'isolamento',
    tipo: medida === 'distancia-tempo' ? 'cardio' : 'isolado',
    equipamento: [],
    medida,
    unilateral,
    nivel: 'iniciante',
    personalizado: true,
    criadoEm: new Date().toISOString(),
  }
  await db.exercicios.add(exercicio)
  personalizados.set(exercicio.id, exercicio)
  return exercicio
}
