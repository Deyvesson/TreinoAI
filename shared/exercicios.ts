// Catálogo fechado de exercícios: fonte única para o app (offline, nomes, registro)
// e para a API (a IA só pode escolher IDs desta lista ao gerar um plano).
//
// Regras de manutenção:
// - `id` é permanente. Nunca renomeie nem apague: o histórico do usuário aponta para ele.
//   Para aposentar um exercício, marque `descontinuado: true` (e `substituidoPor`, se houver).
// - `nome` e `apelidos` podem mudar à vontade; são só rótulos e termos de busca.
// - `equipamento` lista tudo o que é obrigatório. Lista vazia = só peso corporal.
//   Variações com equipamento diferente são exercícios diferentes (histórico separado).

export const GRUPOS = [
  'peito',
  'costas',
  'ombros',
  'trapezio',
  'biceps',
  'triceps',
  'antebracos',
  'quadriceps',
  'posteriores',
  'gluteos',
  'adutores',
  'panturrilhas',
  'abdomen',
  'lombar',
  'corpo-inteiro',
  'cardio',
] as const
export type Grupo = (typeof GRUPOS)[number]

export const PADROES = [
  'empurrar-horizontal',
  'empurrar-vertical',
  'puxar-horizontal',
  'puxar-vertical',
  'agachar',
  'dobrar-quadril',
  'avanco',
  'isolamento',
  'core',
  'carregar',
  'cardio',
] as const
export type Padrao = (typeof PADROES)[number]

export const EQUIPAMENTOS = [
  'barra',
  'halteres',
  'kettlebell',
  'maquina',
  'polia',
  'smith',
  'banco',
  'barra-fixa',
  'paralelas',
  'elastico',
  'caixa',
  'corda',
  'roda-abdominal',
  'esteira',
  'bicicleta-ergometrica',
  'remo-ergometrico',
  'eliptico',
  'escada-ergometrica',
] as const
export type Equipamento = (typeof EQUIPAMENTOS)[number]

// Como uma série é registrada:
// - carga-reps: carga (kg) × repetições
// - reps: repetições; carga opcional como lastro
// - tempo: duração (isometria, intervalos)
// - carga-tempo: carga (kg) × duração (carregadas)
// - distancia-tempo: distância (km) e duração
export const MEDIDAS = ['carga-reps', 'reps', 'tempo', 'carga-tempo', 'distancia-tempo'] as const
export type Medida = (typeof MEDIDAS)[number]

export const TIPOS = ['composto', 'isolado', 'cardio'] as const
export type Tipo = (typeof TIPOS)[number]

export const NIVEIS = ['iniciante', 'intermediario', 'avancado'] as const
export type Nivel = (typeof NIVEIS)[number]

export interface Exercicio {
  id: string
  nome: string
  apelidos?: readonly string[]
  grupo: Grupo
  secundarios?: readonly Grupo[]
  padrao: Padrao
  tipo: Tipo
  equipamento: readonly Equipamento[]
  medida: Medida
  /** Registrado por lado (carga/reps de cada braço ou perna). */
  unilateral?: boolean
  /** Nível mínimo recomendado. */
  nivel: Nivel
  descontinuado?: boolean
  substituidoPor?: string
}

export const EXERCICIOS = [
  // Peito
  { id: 'supino-reto-barra', nome: 'Supino reto com barra', apelidos: ['Supino reto', 'Supino'], grupo: 'peito', secundarios: ['triceps', 'ombros'], padrao: 'empurrar-horizontal', tipo: 'composto', equipamento: ['barra', 'banco'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'supino-reto-halteres', nome: 'Supino reto com halteres', grupo: 'peito', secundarios: ['triceps', 'ombros'], padrao: 'empurrar-horizontal', tipo: 'composto', equipamento: ['halteres', 'banco'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'supino-inclinado-barra', nome: 'Supino inclinado com barra', apelidos: ['Supino inclinado'], grupo: 'peito', secundarios: ['ombros', 'triceps'], padrao: 'empurrar-horizontal', tipo: 'composto', equipamento: ['barra', 'banco'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'supino-inclinado-halteres', nome: 'Supino inclinado com halteres', grupo: 'peito', secundarios: ['ombros', 'triceps'], padrao: 'empurrar-horizontal', tipo: 'composto', equipamento: ['halteres', 'banco'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'supino-declinado-barra', nome: 'Supino declinado com barra', apelidos: ['Supino declinado'], grupo: 'peito', secundarios: ['triceps'], padrao: 'empurrar-horizontal', tipo: 'composto', equipamento: ['barra', 'banco'], medida: 'carga-reps', nivel: 'intermediario' },
  { id: 'supino-maquina', nome: 'Supino na máquina', apelidos: ['Chest press', 'Supino articulado'], grupo: 'peito', secundarios: ['triceps', 'ombros'], padrao: 'empurrar-horizontal', tipo: 'composto', equipamento: ['maquina'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'supino-inclinado-smith', nome: 'Supino inclinado no Smith', grupo: 'peito', secundarios: ['ombros', 'triceps'], padrao: 'empurrar-horizontal', tipo: 'composto', equipamento: ['smith', 'banco'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'crucifixo-reto-halteres', nome: 'Crucifixo reto com halteres', apelidos: ['Crucifixo'], grupo: 'peito', secundarios: ['ombros'], padrao: 'isolamento', tipo: 'isolado', equipamento: ['halteres', 'banco'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'crucifixo-inclinado-halteres', nome: 'Crucifixo inclinado com halteres', grupo: 'peito', secundarios: ['ombros'], padrao: 'isolamento', tipo: 'isolado', equipamento: ['halteres', 'banco'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'crucifixo-maquina', nome: 'Crucifixo na máquina', apelidos: ['Voador', 'Peck deck', 'Fly'], grupo: 'peito', padrao: 'isolamento', tipo: 'isolado', equipamento: ['maquina'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'crossover-polia-alta', nome: 'Crossover na polia alta', apelidos: ['Crossover', 'Cross'], grupo: 'peito', padrao: 'isolamento', tipo: 'isolado', equipamento: ['polia'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'crossover-polia-baixa', nome: 'Crossover na polia baixa', grupo: 'peito', secundarios: ['ombros'], padrao: 'isolamento', tipo: 'isolado', equipamento: ['polia'], medida: 'carga-reps', nivel: 'intermediario' },
  { id: 'flexao-de-braco', nome: 'Flexão de braço', apelidos: ['Flexão', 'Apoio', 'Push-up'], grupo: 'peito', secundarios: ['triceps', 'ombros', 'abdomen'], padrao: 'empurrar-horizontal', tipo: 'composto', equipamento: [], medida: 'reps', nivel: 'iniciante' },
  { id: 'flexao-joelhos', nome: 'Flexão com joelhos apoiados', grupo: 'peito', secundarios: ['triceps', 'ombros'], padrao: 'empurrar-horizontal', tipo: 'composto', equipamento: [], medida: 'reps', nivel: 'iniciante' },
  { id: 'flexao-inclinada', nome: 'Flexão inclinada (mãos elevadas)', grupo: 'peito', secundarios: ['triceps', 'ombros'], padrao: 'empurrar-horizontal', tipo: 'composto', equipamento: [], medida: 'reps', nivel: 'iniciante' },
  { id: 'flexao-declinada', nome: 'Flexão declinada (pés elevados)', grupo: 'peito', secundarios: ['ombros', 'triceps'], padrao: 'empurrar-horizontal', tipo: 'composto', equipamento: [], medida: 'reps', nivel: 'intermediario' },
  { id: 'mergulho-paralelas', nome: 'Mergulho nas paralelas', apelidos: ['Paralelas', 'Dips'], grupo: 'peito', secundarios: ['triceps', 'ombros'], padrao: 'empurrar-vertical', tipo: 'composto', equipamento: ['paralelas'], medida: 'reps', nivel: 'intermediario' },
  { id: 'pullover-halter', nome: 'Pullover com halter', apelidos: ['Pullover'], grupo: 'peito', secundarios: ['costas'], padrao: 'isolamento', tipo: 'isolado', equipamento: ['halteres', 'banco'], medida: 'carga-reps', nivel: 'intermediario' },

  // Costas
  { id: 'barra-fixa-pronada', nome: 'Barra fixa pronada', apelidos: ['Barra fixa', 'Pull-up'], grupo: 'costas', secundarios: ['biceps'], padrao: 'puxar-vertical', tipo: 'composto', equipamento: ['barra-fixa'], medida: 'reps', nivel: 'intermediario' },
  { id: 'barra-fixa-supinada', nome: 'Barra fixa supinada', apelidos: ['Chin-up'], grupo: 'costas', secundarios: ['biceps'], padrao: 'puxar-vertical', tipo: 'composto', equipamento: ['barra-fixa'], medida: 'reps', nivel: 'intermediario' },
  { id: 'barra-fixa-negativa', nome: 'Barra fixa negativa (só a descida)', grupo: 'costas', secundarios: ['biceps'], padrao: 'puxar-vertical', tipo: 'composto', equipamento: ['barra-fixa'], medida: 'reps', nivel: 'iniciante' },
  { id: 'puxada-frontal-aberta', nome: 'Puxada frontal aberta', apelidos: ['Puxada frontal', 'Puxada alta', 'Pulldown'], grupo: 'costas', secundarios: ['biceps'], padrao: 'puxar-vertical', tipo: 'composto', equipamento: ['polia'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'puxada-frontal-supinada', nome: 'Puxada frontal supinada', grupo: 'costas', secundarios: ['biceps'], padrao: 'puxar-vertical', tipo: 'composto', equipamento: ['polia'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'puxada-triangulo', nome: 'Puxada com triângulo', apelidos: ['Puxada neutra'], grupo: 'costas', secundarios: ['biceps'], padrao: 'puxar-vertical', tipo: 'composto', equipamento: ['polia'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'remada-curvada-barra', nome: 'Remada curvada com barra', apelidos: ['Remada curvada'], grupo: 'costas', secundarios: ['biceps', 'lombar', 'trapezio'], padrao: 'puxar-horizontal', tipo: 'composto', equipamento: ['barra'], medida: 'carga-reps', nivel: 'intermediario' },
  { id: 'remada-unilateral-halter', nome: 'Remada unilateral com halter', apelidos: ['Serrote', 'Remada serrote'], grupo: 'costas', secundarios: ['biceps'], padrao: 'puxar-horizontal', tipo: 'composto', equipamento: ['halteres', 'banco'], medida: 'carga-reps', unilateral: true, nivel: 'iniciante' },
  { id: 'remada-baixa-triangulo', nome: 'Remada baixa com triângulo', apelidos: ['Remada baixa', 'Remada sentada'], grupo: 'costas', secundarios: ['biceps'], padrao: 'puxar-horizontal', tipo: 'composto', equipamento: ['polia'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'remada-maquina', nome: 'Remada na máquina', apelidos: ['Remada articulada'], grupo: 'costas', secundarios: ['biceps'], padrao: 'puxar-horizontal', tipo: 'composto', equipamento: ['maquina'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'remada-cavalinho', nome: 'Remada cavalinho', apelidos: ['Remada T', 'T-bar row'], grupo: 'costas', secundarios: ['biceps', 'lombar'], padrao: 'puxar-horizontal', tipo: 'composto', equipamento: ['barra'], medida: 'carga-reps', nivel: 'intermediario' },
  { id: 'remada-invertida', nome: 'Remada invertida', apelidos: ['Australian pull-up'], grupo: 'costas', secundarios: ['biceps'], padrao: 'puxar-horizontal', tipo: 'composto', equipamento: ['smith'], medida: 'reps', nivel: 'iniciante' },
  { id: 'remada-elastico', nome: 'Remada com elástico', grupo: 'costas', secundarios: ['biceps'], padrao: 'puxar-horizontal', tipo: 'composto', equipamento: ['elastico'], medida: 'reps', nivel: 'iniciante' },
  { id: 'pulldown-bracos-estendidos', nome: 'Pulldown com braços estendidos', apelidos: ['Pullover na polia', 'Straight-arm pulldown'], grupo: 'costas', padrao: 'isolamento', tipo: 'isolado', equipamento: ['polia'], medida: 'carga-reps', nivel: 'intermediario' },

  // Lombar
  { id: 'hiperextensao-lombar', nome: 'Hiperextensão lombar', apelidos: ['Extensão lombar', 'Banco romano'], grupo: 'lombar', secundarios: ['gluteos', 'posteriores'], padrao: 'dobrar-quadril', tipo: 'isolado', equipamento: ['maquina'], medida: 'reps', nivel: 'iniciante' },
  { id: 'superman', nome: 'Superman (extensão no solo)', grupo: 'lombar', secundarios: ['gluteos'], padrao: 'core', tipo: 'isolado', equipamento: [], medida: 'reps', nivel: 'iniciante' },

  // Ombros
  { id: 'desenvolvimento-halteres', nome: 'Desenvolvimento com halteres', apelidos: ['Desenvolvimento'], grupo: 'ombros', secundarios: ['triceps'], padrao: 'empurrar-vertical', tipo: 'composto', equipamento: ['halteres', 'banco'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'desenvolvimento-barra', nome: 'Desenvolvimento militar com barra', apelidos: ['Desenvolvimento militar', 'Overhead press'], grupo: 'ombros', secundarios: ['triceps', 'abdomen'], padrao: 'empurrar-vertical', tipo: 'composto', equipamento: ['barra'], medida: 'carga-reps', nivel: 'intermediario' },
  { id: 'desenvolvimento-maquina', nome: 'Desenvolvimento na máquina', grupo: 'ombros', secundarios: ['triceps'], padrao: 'empurrar-vertical', tipo: 'composto', equipamento: ['maquina'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'desenvolvimento-arnold', nome: 'Desenvolvimento Arnold', grupo: 'ombros', secundarios: ['triceps'], padrao: 'empurrar-vertical', tipo: 'composto', equipamento: ['halteres', 'banco'], medida: 'carga-reps', nivel: 'intermediario' },
  { id: 'flexao-pike', nome: 'Flexão pike', grupo: 'ombros', secundarios: ['triceps'], padrao: 'empurrar-vertical', tipo: 'composto', equipamento: [], medida: 'reps', nivel: 'intermediario' },
  { id: 'elevacao-lateral-halteres', nome: 'Elevação lateral com halteres', apelidos: ['Elevação lateral'], grupo: 'ombros', padrao: 'isolamento', tipo: 'isolado', equipamento: ['halteres'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'elevacao-lateral-polia', nome: 'Elevação lateral na polia', grupo: 'ombros', padrao: 'isolamento', tipo: 'isolado', equipamento: ['polia'], medida: 'carga-reps', unilateral: true, nivel: 'intermediario' },
  { id: 'elevacao-lateral-elastico', nome: 'Elevação lateral com elástico', grupo: 'ombros', padrao: 'isolamento', tipo: 'isolado', equipamento: ['elastico'], medida: 'reps', nivel: 'iniciante' },
  { id: 'elevacao-frontal-halteres', nome: 'Elevação frontal com halteres', apelidos: ['Elevação frontal'], grupo: 'ombros', padrao: 'isolamento', tipo: 'isolado', equipamento: ['halteres'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'crucifixo-inverso-halteres', nome: 'Crucifixo inverso com halteres', apelidos: ['Crucifixo invertido'], grupo: 'ombros', secundarios: ['costas', 'trapezio'], padrao: 'isolamento', tipo: 'isolado', equipamento: ['halteres'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'crucifixo-inverso-maquina', nome: 'Crucifixo inverso na máquina', apelidos: ['Voador invertido'], grupo: 'ombros', secundarios: ['costas', 'trapezio'], padrao: 'isolamento', tipo: 'isolado', equipamento: ['maquina'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'face-pull', nome: 'Face pull', grupo: 'ombros', secundarios: ['trapezio', 'costas'], padrao: 'puxar-horizontal', tipo: 'composto', equipamento: ['polia'], medida: 'carga-reps', nivel: 'intermediario' },
  { id: 'remada-alta', nome: 'Remada alta com barra', apelidos: ['Remada alta', 'Upright row'], grupo: 'ombros', secundarios: ['trapezio'], padrao: 'puxar-vertical', tipo: 'composto', equipamento: ['barra'], medida: 'carga-reps', nivel: 'intermediario' },

  // Trapézio
  { id: 'encolhimento-halteres', nome: 'Encolhimento com halteres', apelidos: ['Encolhimento'], grupo: 'trapezio', padrao: 'isolamento', tipo: 'isolado', equipamento: ['halteres'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'encolhimento-barra', nome: 'Encolhimento com barra', grupo: 'trapezio', padrao: 'isolamento', tipo: 'isolado', equipamento: ['barra'], medida: 'carga-reps', nivel: 'iniciante' },

  // Bíceps
  { id: 'rosca-direta-barra', nome: 'Rosca direta com barra', apelidos: ['Rosca direta'], grupo: 'biceps', secundarios: ['antebracos'], padrao: 'isolamento', tipo: 'isolado', equipamento: ['barra'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'rosca-alternada-halteres', nome: 'Rosca alternada com halteres', apelidos: ['Rosca alternada'], grupo: 'biceps', secundarios: ['antebracos'], padrao: 'isolamento', tipo: 'isolado', equipamento: ['halteres'], medida: 'carga-reps', unilateral: true, nivel: 'iniciante' },
  { id: 'rosca-martelo', nome: 'Rosca martelo', grupo: 'biceps', secundarios: ['antebracos'], padrao: 'isolamento', tipo: 'isolado', equipamento: ['halteres'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'rosca-scott-barra', nome: 'Rosca Scott com barra', apelidos: ['Rosca Scott'], grupo: 'biceps', padrao: 'isolamento', tipo: 'isolado', equipamento: ['barra', 'banco'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'rosca-concentrada', nome: 'Rosca concentrada', grupo: 'biceps', padrao: 'isolamento', tipo: 'isolado', equipamento: ['halteres', 'banco'], medida: 'carga-reps', unilateral: true, nivel: 'iniciante' },
  { id: 'rosca-inclinada-halteres', nome: 'Rosca inclinada com halteres', grupo: 'biceps', padrao: 'isolamento', tipo: 'isolado', equipamento: ['halteres', 'banco'], medida: 'carga-reps', nivel: 'intermediario' },
  { id: 'rosca-polia', nome: 'Rosca na polia', apelidos: ['Rosca no cabo'], grupo: 'biceps', padrao: 'isolamento', tipo: 'isolado', equipamento: ['polia'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'rosca-elastico', nome: 'Rosca com elástico', grupo: 'biceps', padrao: 'isolamento', tipo: 'isolado', equipamento: ['elastico'], medida: 'reps', nivel: 'iniciante' },

  // Tríceps
  { id: 'triceps-polia-barra', nome: 'Tríceps na polia com barra', apelidos: ['Tríceps pulley', 'Tríceps pulldown'], grupo: 'triceps', padrao: 'isolamento', tipo: 'isolado', equipamento: ['polia'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'triceps-corda', nome: 'Tríceps na polia com corda', apelidos: ['Tríceps corda'], grupo: 'triceps', padrao: 'isolamento', tipo: 'isolado', equipamento: ['polia'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'triceps-polia-acima-cabeca', nome: 'Tríceps francês na polia', apelidos: ['Tríceps na polia acima da cabeça', 'Tríceps overhead'], grupo: 'triceps', padrao: 'isolamento', tipo: 'isolado', equipamento: ['polia'], medida: 'carga-reps', nivel: 'intermediario' },
  { id: 'triceps-testa-barra', nome: 'Tríceps testa com barra', apelidos: ['Tríceps testa'], grupo: 'triceps', padrao: 'isolamento', tipo: 'isolado', equipamento: ['barra', 'banco'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'triceps-frances-halter', nome: 'Tríceps francês com halter', apelidos: ['Tríceps francês'], grupo: 'triceps', padrao: 'isolamento', tipo: 'isolado', equipamento: ['halteres'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'triceps-coice-halter', nome: 'Tríceps coice com halter', apelidos: ['Tríceps kickback', 'Coice'], grupo: 'triceps', padrao: 'isolamento', tipo: 'isolado', equipamento: ['halteres', 'banco'], medida: 'carga-reps', unilateral: true, nivel: 'iniciante' },
  { id: 'mergulho-banco', nome: 'Mergulho no banco', apelidos: ['Tríceps banco', 'Tríceps no banco'], grupo: 'triceps', secundarios: ['peito', 'ombros'], padrao: 'empurrar-vertical', tipo: 'composto', equipamento: ['banco'], medida: 'reps', nivel: 'iniciante' },
  { id: 'supino-fechado', nome: 'Supino fechado', grupo: 'triceps', secundarios: ['peito', 'ombros'], padrao: 'empurrar-horizontal', tipo: 'composto', equipamento: ['barra', 'banco'], medida: 'carga-reps', nivel: 'intermediario' },
  { id: 'flexao-diamante', nome: 'Flexão diamante', grupo: 'triceps', secundarios: ['peito'], padrao: 'empurrar-horizontal', tipo: 'composto', equipamento: [], medida: 'reps', nivel: 'intermediario' },

  // Antebraços
  { id: 'rosca-punho', nome: 'Rosca de punho com halteres', apelidos: ['Rosca punho', 'Flexão de punho'], grupo: 'antebracos', padrao: 'isolamento', tipo: 'isolado', equipamento: ['halteres', 'banco'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'rosca-inversa-barra', nome: 'Rosca inversa com barra', apelidos: ['Rosca inversa'], grupo: 'antebracos', secundarios: ['biceps'], padrao: 'isolamento', tipo: 'isolado', equipamento: ['barra'], medida: 'carga-reps', nivel: 'iniciante' },

  // Quadríceps
  { id: 'agachamento-livre-barra', nome: 'Agachamento livre com barra', apelidos: ['Agachamento livre', 'Agachamento', 'Back squat'], grupo: 'quadriceps', secundarios: ['gluteos', 'posteriores', 'lombar'], padrao: 'agachar', tipo: 'composto', equipamento: ['barra'], medida: 'carga-reps', nivel: 'intermediario' },
  { id: 'agachamento-frontal', nome: 'Agachamento frontal com barra', apelidos: ['Front squat'], grupo: 'quadriceps', secundarios: ['gluteos', 'abdomen'], padrao: 'agachar', tipo: 'composto', equipamento: ['barra'], medida: 'carga-reps', nivel: 'avancado' },
  { id: 'agachamento-goblet', nome: 'Agachamento goblet com halter', apelidos: ['Goblet squat'], grupo: 'quadriceps', secundarios: ['gluteos'], padrao: 'agachar', tipo: 'composto', equipamento: ['halteres'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'agachamento-peso-corporal', nome: 'Agachamento com peso corporal', apelidos: ['Agachamento sem peso', 'Air squat'], grupo: 'quadriceps', secundarios: ['gluteos'], padrao: 'agachar', tipo: 'composto', equipamento: [], medida: 'reps', nivel: 'iniciante' },
  { id: 'agachamento-smith', nome: 'Agachamento no Smith', grupo: 'quadriceps', secundarios: ['gluteos'], padrao: 'agachar', tipo: 'composto', equipamento: ['smith'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'agachamento-hack', nome: 'Agachamento hack', apelidos: ['Hack', 'Hack machine'], grupo: 'quadriceps', secundarios: ['gluteos'], padrao: 'agachar', tipo: 'composto', equipamento: ['maquina'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'agachamento-sumo-halter', nome: 'Agachamento sumô com halter', apelidos: ['Agachamento sumô'], grupo: 'quadriceps', secundarios: ['gluteos', 'adutores'], padrao: 'agachar', tipo: 'composto', equipamento: ['halteres'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'agachamento-salto', nome: 'Agachamento com salto', apelidos: ['Jump squat'], grupo: 'quadriceps', secundarios: ['gluteos', 'panturrilhas'], padrao: 'agachar', tipo: 'composto', equipamento: [], medida: 'reps', nivel: 'intermediario' },
  { id: 'agachamento-isometrico-parede', nome: 'Agachamento isométrico na parede', apelidos: ['Cadeirinha', 'Wall sit'], grupo: 'quadriceps', secundarios: ['gluteos'], padrao: 'agachar', tipo: 'isolado', equipamento: [], medida: 'tempo', nivel: 'iniciante' },
  { id: 'agachamento-pistola', nome: 'Agachamento pistola', apelidos: ['Pistol squat'], grupo: 'quadriceps', secundarios: ['gluteos'], padrao: 'agachar', tipo: 'composto', equipamento: [], medida: 'reps', unilateral: true, nivel: 'avancado' },
  { id: 'agachamento-bulgaro', nome: 'Agachamento búlgaro', apelidos: ['Búlgaro'], grupo: 'quadriceps', secundarios: ['gluteos'], padrao: 'avanco', tipo: 'composto', equipamento: ['halteres', 'banco'], medida: 'carga-reps', unilateral: true, nivel: 'intermediario' },
  { id: 'leg-press-45', nome: 'Leg press 45°', apelidos: ['Leg press', 'Leg 45'], grupo: 'quadriceps', secundarios: ['gluteos'], padrao: 'agachar', tipo: 'composto', equipamento: ['maquina'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'leg-press-horizontal', nome: 'Leg press horizontal', grupo: 'quadriceps', secundarios: ['gluteos'], padrao: 'agachar', tipo: 'composto', equipamento: ['maquina'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'cadeira-extensora', nome: 'Cadeira extensora', apelidos: ['Extensora'], grupo: 'quadriceps', padrao: 'isolamento', tipo: 'isolado', equipamento: ['maquina'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'afundo-halteres', nome: 'Afundo com halteres', apelidos: ['Afundo'], grupo: 'quadriceps', secundarios: ['gluteos'], padrao: 'avanco', tipo: 'composto', equipamento: ['halteres'], medida: 'carga-reps', unilateral: true, nivel: 'iniciante' },
  { id: 'afundo-peso-corporal', nome: 'Afundo com peso corporal', grupo: 'quadriceps', secundarios: ['gluteos'], padrao: 'avanco', tipo: 'composto', equipamento: [], medida: 'reps', unilateral: true, nivel: 'iniciante' },
  { id: 'passada-halteres', nome: 'Passada com halteres', apelidos: ['Passada', 'Avanço caminhando', 'Walking lunge'], grupo: 'quadriceps', secundarios: ['gluteos'], padrao: 'avanco', tipo: 'composto', equipamento: ['halteres'], medida: 'carga-reps', unilateral: true, nivel: 'intermediario' },
  { id: 'subida-banco', nome: 'Subida no banco com halteres', apelidos: ['Step-up', 'Subida no banco'], grupo: 'quadriceps', secundarios: ['gluteos'], padrao: 'avanco', tipo: 'composto', equipamento: ['halteres', 'banco'], medida: 'carga-reps', unilateral: true, nivel: 'iniciante' },
  { id: 'salto-caixa', nome: 'Salto na caixa', apelidos: ['Box jump'], grupo: 'quadriceps', secundarios: ['gluteos', 'panturrilhas'], padrao: 'agachar', tipo: 'composto', equipamento: ['caixa'], medida: 'reps', nivel: 'intermediario' },

  // Posteriores de coxa
  { id: 'levantamento-terra', nome: 'Levantamento terra', apelidos: ['Terra', 'Deadlift'], grupo: 'posteriores', secundarios: ['gluteos', 'lombar', 'costas', 'trapezio'], padrao: 'dobrar-quadril', tipo: 'composto', equipamento: ['barra'], medida: 'carga-reps', nivel: 'intermediario' },
  { id: 'levantamento-terra-romeno', nome: 'Levantamento terra romeno', apelidos: ['Terra romeno', 'RDL'], grupo: 'posteriores', secundarios: ['gluteos', 'lombar'], padrao: 'dobrar-quadril', tipo: 'composto', equipamento: ['barra'], medida: 'carga-reps', nivel: 'intermediario' },
  { id: 'stiff-barra', nome: 'Stiff com barra', apelidos: ['Stiff'], grupo: 'posteriores', secundarios: ['gluteos', 'lombar'], padrao: 'dobrar-quadril', tipo: 'composto', equipamento: ['barra'], medida: 'carga-reps', nivel: 'intermediario' },
  { id: 'stiff-halteres', nome: 'Stiff com halteres', grupo: 'posteriores', secundarios: ['gluteos', 'lombar'], padrao: 'dobrar-quadril', tipo: 'composto', equipamento: ['halteres'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'stiff-unilateral-halter', nome: 'Stiff unilateral com halter', grupo: 'posteriores', secundarios: ['gluteos'], padrao: 'dobrar-quadril', tipo: 'composto', equipamento: ['halteres'], medida: 'carga-reps', unilateral: true, nivel: 'intermediario' },
  { id: 'good-morning', nome: 'Good morning com barra', apelidos: ['Good morning', 'Bom dia'], grupo: 'posteriores', secundarios: ['lombar', 'gluteos'], padrao: 'dobrar-quadril', tipo: 'composto', equipamento: ['barra'], medida: 'carga-reps', nivel: 'intermediario' },
  { id: 'mesa-flexora', nome: 'Mesa flexora', apelidos: ['Flexora deitada'], grupo: 'posteriores', padrao: 'isolamento', tipo: 'isolado', equipamento: ['maquina'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'cadeira-flexora', nome: 'Cadeira flexora', apelidos: ['Flexora sentada'], grupo: 'posteriores', padrao: 'isolamento', tipo: 'isolado', equipamento: ['maquina'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'flexora-em-pe', nome: 'Flexora em pé', grupo: 'posteriores', padrao: 'isolamento', tipo: 'isolado', equipamento: ['maquina'], medida: 'carga-reps', unilateral: true, nivel: 'iniciante' },

  // Glúteos
  { id: 'elevacao-pelvica-barra', nome: 'Elevação pélvica com barra', apelidos: ['Elevação pélvica', 'Hip thrust', 'Elevação de quadril'], grupo: 'gluteos', secundarios: ['posteriores'], padrao: 'dobrar-quadril', tipo: 'composto', equipamento: ['barra', 'banco'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'elevacao-pelvica-maquina', nome: 'Elevação pélvica na máquina', grupo: 'gluteos', secundarios: ['posteriores'], padrao: 'dobrar-quadril', tipo: 'composto', equipamento: ['maquina'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'ponte-gluteo', nome: 'Ponte de glúteo', apelidos: ['Ponte', 'Glute bridge'], grupo: 'gluteos', secundarios: ['posteriores'], padrao: 'dobrar-quadril', tipo: 'composto', equipamento: [], medida: 'reps', nivel: 'iniciante' },
  { id: 'ponte-gluteo-unilateral', nome: 'Ponte de glúteo unilateral', grupo: 'gluteos', secundarios: ['posteriores'], padrao: 'dobrar-quadril', tipo: 'composto', equipamento: [], medida: 'reps', unilateral: true, nivel: 'intermediario' },
  { id: 'gluteo-polia', nome: 'Glúteo na polia (coice)', apelidos: ['Coice na polia', 'Kickback na polia'], grupo: 'gluteos', padrao: 'isolamento', tipo: 'isolado', equipamento: ['polia'], medida: 'carga-reps', unilateral: true, nivel: 'iniciante' },
  { id: 'gluteo-maquina', nome: 'Glúteo na máquina (coice)', apelidos: ['Glúteo máquina'], grupo: 'gluteos', padrao: 'isolamento', tipo: 'isolado', equipamento: ['maquina'], medida: 'carga-reps', unilateral: true, nivel: 'iniciante', descontinuado: true },
  { id: 'coice-quatro-apoios', nome: 'Coice em quatro apoios', apelidos: ['Glúteo quatro apoios', 'Glúteo 4 apoios'], grupo: 'gluteos', padrao: 'isolamento', tipo: 'isolado', equipamento: [], medida: 'reps', unilateral: true, nivel: 'iniciante' },
  { id: 'cadeira-abdutora', nome: 'Cadeira abdutora', apelidos: ['Abdutora'], grupo: 'gluteos', padrao: 'isolamento', tipo: 'isolado', equipamento: ['maquina'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'caminhada-lateral-elastico', nome: 'Caminhada lateral com elástico', apelidos: ['Monster walk'], grupo: 'gluteos', padrao: 'isolamento', tipo: 'isolado', equipamento: ['elastico'], medida: 'reps', nivel: 'iniciante' },
  { id: 'kettlebell-swing', nome: 'Swing com kettlebell', apelidos: ['Kettlebell swing', 'Swing'], grupo: 'gluteos', secundarios: ['posteriores', 'lombar', 'abdomen'], padrao: 'dobrar-quadril', tipo: 'composto', equipamento: ['kettlebell'], medida: 'carga-reps', nivel: 'intermediario' },

  // Adutores
  { id: 'cadeira-adutora', nome: 'Cadeira adutora', apelidos: ['Adutora'], grupo: 'adutores', padrao: 'isolamento', tipo: 'isolado', equipamento: ['maquina'], medida: 'carga-reps', nivel: 'iniciante' },

  // Panturrilhas
  { id: 'panturrilha-em-pe-maquina', nome: 'Panturrilha em pé na máquina', apelidos: ['Gêmeos em pé', 'Panturrilha em pé'], grupo: 'panturrilhas', padrao: 'isolamento', tipo: 'isolado', equipamento: ['maquina'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'panturrilha-sentado', nome: 'Panturrilha sentado', apelidos: ['Gêmeos sentado', 'Sóleo'], grupo: 'panturrilhas', padrao: 'isolamento', tipo: 'isolado', equipamento: ['maquina'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'panturrilha-leg-press', nome: 'Panturrilha no leg press', grupo: 'panturrilhas', padrao: 'isolamento', tipo: 'isolado', equipamento: ['maquina'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'panturrilha-peso-corporal', nome: 'Panturrilha em pé com peso corporal', apelidos: ['Elevação de calcanhar'], grupo: 'panturrilhas', padrao: 'isolamento', tipo: 'isolado', equipamento: [], medida: 'reps', nivel: 'iniciante' },
  { id: 'panturrilha-unilateral-halter', nome: 'Panturrilha unilateral com halter', grupo: 'panturrilhas', padrao: 'isolamento', tipo: 'isolado', equipamento: ['halteres'], medida: 'carga-reps', unilateral: true, nivel: 'iniciante' },

  // Abdômen e core
  { id: 'prancha', nome: 'Prancha', apelidos: ['Prancha frontal', 'Plank'], grupo: 'abdomen', secundarios: ['lombar', 'ombros'], padrao: 'core', tipo: 'isolado', equipamento: [], medida: 'tempo', nivel: 'iniciante' },
  { id: 'prancha-lateral', nome: 'Prancha lateral', grupo: 'abdomen', padrao: 'core', tipo: 'isolado', equipamento: [], medida: 'tempo', unilateral: true, nivel: 'iniciante' },
  { id: 'canoinha', nome: 'Canoinha', apelidos: ['Hollow hold'], grupo: 'abdomen', padrao: 'core', tipo: 'isolado', equipamento: [], medida: 'tempo', nivel: 'intermediario' },
  { id: 'abdominal-supra', nome: 'Abdominal supra', apelidos: ['Abdominal', 'Crunch'], grupo: 'abdomen', padrao: 'core', tipo: 'isolado', equipamento: [], medida: 'reps', nivel: 'iniciante' },
  { id: 'abdominal-infra', nome: 'Abdominal infra', apelidos: ['Elevação de pernas deitado'], grupo: 'abdomen', padrao: 'core', tipo: 'isolado', equipamento: [], medida: 'reps', nivel: 'iniciante' },
  { id: 'abdominal-remador', nome: 'Abdominal remador', grupo: 'abdomen', padrao: 'core', tipo: 'isolado', equipamento: [], medida: 'reps', nivel: 'iniciante' },
  { id: 'abdominal-bicicleta', nome: 'Abdominal bicicleta', grupo: 'abdomen', padrao: 'core', tipo: 'isolado', equipamento: [], medida: 'reps', nivel: 'iniciante' },
  { id: 'rotacao-russa', nome: 'Rotação russa', apelidos: ['Russian twist'], grupo: 'abdomen', padrao: 'core', tipo: 'isolado', equipamento: [], medida: 'reps', nivel: 'iniciante' },
  { id: 'dead-bug', nome: 'Dead bug', apelidos: ['Inseto morto'], grupo: 'abdomen', secundarios: ['lombar'], padrao: 'core', tipo: 'isolado', equipamento: [], medida: 'reps', nivel: 'iniciante' },
  { id: 'perdigueiro', nome: 'Perdigueiro', apelidos: ['Bird dog'], grupo: 'abdomen', secundarios: ['lombar', 'gluteos'], padrao: 'core', tipo: 'isolado', equipamento: [], medida: 'reps', nivel: 'iniciante' },
  { id: 'escalador', nome: 'Escalador', apelidos: ['Mountain climber'], grupo: 'abdomen', secundarios: ['ombros', 'cardio'], padrao: 'core', tipo: 'isolado', equipamento: [], medida: 'tempo', nivel: 'iniciante' },
  { id: 'elevacao-pernas-barra', nome: 'Elevação de pernas na barra', apelidos: ['Hanging leg raise'], grupo: 'abdomen', padrao: 'core', tipo: 'isolado', equipamento: ['barra-fixa'], medida: 'reps', nivel: 'intermediario' },
  { id: 'abdominal-polia', nome: 'Abdominal ajoelhado na polia', apelidos: ['Abdominal na polia', 'Cable crunch'], grupo: 'abdomen', padrao: 'core', tipo: 'isolado', equipamento: ['polia'], medida: 'carga-reps', nivel: 'intermediario' },
  { id: 'abdominal-maquina', nome: 'Abdominal na máquina', grupo: 'abdomen', padrao: 'core', tipo: 'isolado', equipamento: ['maquina'], medida: 'carga-reps', nivel: 'iniciante' },
  { id: 'pallof-press', nome: 'Pallof press', grupo: 'abdomen', padrao: 'core', tipo: 'isolado', equipamento: ['polia'], medida: 'carga-reps', unilateral: true, nivel: 'intermediario' },
  { id: 'roda-abdominal', nome: 'Roda abdominal', apelidos: ['Ab wheel'], grupo: 'abdomen', secundarios: ['ombros', 'lombar'], padrao: 'core', tipo: 'isolado', equipamento: ['roda-abdominal'], medida: 'reps', nivel: 'intermediario' },

  // Corpo inteiro
  { id: 'burpee', nome: 'Burpee', grupo: 'corpo-inteiro', secundarios: ['cardio', 'peito', 'quadriceps'], padrao: 'cardio', tipo: 'composto', equipamento: [], medida: 'reps', nivel: 'intermediario' },
  { id: 'polichinelo', nome: 'Polichinelo', apelidos: ['Jumping jack'], grupo: 'corpo-inteiro', secundarios: ['cardio'], padrao: 'cardio', tipo: 'cardio', equipamento: [], medida: 'tempo', nivel: 'iniciante' },
  { id: 'thruster-halteres', nome: 'Thruster com halteres', apelidos: ['Thruster'], grupo: 'corpo-inteiro', secundarios: ['quadriceps', 'ombros', 'gluteos'], padrao: 'agachar', tipo: 'composto', equipamento: ['halteres'], medida: 'carga-reps', nivel: 'intermediario' },
  { id: 'caminhada-fazendeiro', nome: 'Caminhada do fazendeiro', apelidos: ['Farmer walk'], grupo: 'corpo-inteiro', secundarios: ['antebracos', 'trapezio', 'abdomen'], padrao: 'carregar', tipo: 'composto', equipamento: ['halteres'], medida: 'carga-tempo', nivel: 'iniciante' },
  { id: 'levantamento-turco', nome: 'Levantamento turco com kettlebell', apelidos: ['Levantamento turco', 'Turkish get-up'], grupo: 'corpo-inteiro', secundarios: ['ombros', 'abdomen', 'gluteos'], padrao: 'core', tipo: 'composto', equipamento: ['kettlebell'], medida: 'carga-reps', unilateral: true, nivel: 'avancado', descontinuado: true },

  // Cardio
  { id: 'corrida-rua', nome: 'Corrida na rua', apelidos: ['Corrida'], grupo: 'cardio', padrao: 'cardio', tipo: 'cardio', equipamento: [], medida: 'distancia-tempo', nivel: 'iniciante' },
  { id: 'corrida-intervalada', nome: 'Corrida intervalada', apelidos: ['Tiros', 'Intervalado'], grupo: 'cardio', padrao: 'cardio', tipo: 'cardio', equipamento: [], medida: 'distancia-tempo', nivel: 'intermediario' },
  { id: 'caminhada', nome: 'Caminhada', grupo: 'cardio', padrao: 'cardio', tipo: 'cardio', equipamento: [], medida: 'distancia-tempo', nivel: 'iniciante' },
  { id: 'corrida-esteira', nome: 'Corrida na esteira', grupo: 'cardio', padrao: 'cardio', tipo: 'cardio', equipamento: ['esteira'], medida: 'distancia-tempo', nivel: 'iniciante' },
  { id: 'caminhada-inclinada-esteira', nome: 'Caminhada inclinada na esteira', grupo: 'cardio', secundarios: ['gluteos', 'panturrilhas'], padrao: 'cardio', tipo: 'cardio', equipamento: ['esteira'], medida: 'distancia-tempo', nivel: 'iniciante' },
  { id: 'bicicleta-ergometrica', nome: 'Bicicleta ergométrica', apelidos: ['Bike', 'Bicicleta'], grupo: 'cardio', padrao: 'cardio', tipo: 'cardio', equipamento: ['bicicleta-ergometrica'], medida: 'distancia-tempo', nivel: 'iniciante' },
  { id: 'remo-ergometrico', nome: 'Remo ergométrico', apelidos: ['Remo'], grupo: 'cardio', secundarios: ['costas', 'quadriceps'], padrao: 'cardio', tipo: 'cardio', equipamento: ['remo-ergometrico'], medida: 'distancia-tempo', nivel: 'iniciante' },
  { id: 'eliptico', nome: 'Elíptico', apelidos: ['Transport'], grupo: 'cardio', padrao: 'cardio', tipo: 'cardio', equipamento: ['eliptico'], medida: 'tempo', nivel: 'iniciante' },
  { id: 'escada-ergometrica', nome: 'Escada ergométrica', apelidos: ['Simulador de escada'], grupo: 'cardio', secundarios: ['gluteos', 'quadriceps'], padrao: 'cardio', tipo: 'cardio', equipamento: ['escada-ergometrica'], medida: 'tempo', nivel: 'iniciante' },
  { id: 'pular-corda', nome: 'Pular corda', grupo: 'cardio', secundarios: ['panturrilhas'], padrao: 'cardio', tipo: 'cardio', equipamento: ['corda'], medida: 'tempo', nivel: 'iniciante' },
] as const satisfies readonly Exercicio[]

export type ExercicioId = (typeof EXERCICIOS)[number]['id']

export const EXERCICIO_POR_ID: ReadonlyMap<string, Exercicio> = new Map(EXERCICIOS.map((e) => [e.id, e]))

/** IDs que a IA pode escolher ao montar um plano. */
export const IDS_ATIVOS: readonly ExercicioId[] = EXERCICIOS.filter(
  (e: Exercicio) => !e.descontinuado,
).map((e) => e.id)

/** Exercícios possíveis com o equipamento que o usuário tem. */
export function disponiveisCom(equipamentoDoUsuario: readonly Equipamento[]): Exercicio[] {
  const tem = new Set(equipamentoDoUsuario)
  return EXERCICIOS.filter((e: Exercicio) => !e.descontinuado && e.equipamento.every((item) => tem.has(item)))
}
