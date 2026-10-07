import { Check, ChevronLeft } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { EQUIPAMENTOS, NIVEIS, disponiveisCom, type Equipamento, type Nivel } from '../../../shared/exercicios'
import { LIMITES_PERFIL, type Objetivo, type PerfilTreino, type PlanoGerado } from '../../../shared/plano'
import { gerarPlano } from '../dados/api'
import { ativarPlano, lerPerfil, pedirArmazenamentoPersistente, planoAtivo, salvarPerfil } from '../dados/db'
import { formatarTempo } from '../dados/sessao'
import { useAgora } from '../ganchos'
import { navegar } from '../rotas'

const OBJETIVOS: { valor: Objetivo; titulo: string; texto: string }[] = [
  { valor: 'hipertrofia', titulo: 'Ganhar massa muscular', texto: 'Mais volume de treino, cargas moderadas.' },
  { valor: 'forca', titulo: 'Ficar mais forte', texto: 'Menos repetições, cargas mais altas.' },
  { valor: 'emagrecimento', titulo: 'Perder gordura', texto: 'Musculação com cardio e descansos curtos.' },
  { valor: 'condicionamento', titulo: 'Melhorar o condicionamento', texto: 'Fôlego, resistência e circuitos.' },
  { valor: 'saude', titulo: 'Saúde e bem-estar', texto: 'Treino equilibrado para o dia a dia.' },
]

const NIVEIS_TEXTO: Record<Nivel, { titulo: string; texto: string }> = {
  iniciante: { titulo: 'Iniciante', texto: 'Começando agora ou voltando depois de muito tempo parado.' },
  intermediario: { titulo: 'Intermediário', texto: 'Treino com regularidade há mais de seis meses.' },
  avancado: { titulo: 'Avançado', texto: 'Treino há anos e conheço bem a execução dos exercícios.' },
}

const MINUTOS = [20, 30, 45, 60, 75, 90]

const NOME_EQUIPAMENTO: Record<Equipamento, string> = {
  barra: 'Barra e anilhas',
  halteres: 'Halteres',
  kettlebell: 'Kettlebell',
  banco: 'Banco',
  maquina: 'Máquinas de musculação',
  polia: 'Polia (cabo)',
  smith: 'Smith',
  'barra-fixa': 'Barra fixa',
  paralelas: 'Paralelas',
  elastico: 'Elástico',
  caixa: 'Caixa de salto',
  corda: 'Corda de pular',
  'roda-abdominal': 'Roda abdominal',
  esteira: 'Esteira',
  'bicicleta-ergometrica': 'Bicicleta ergométrica',
  'remo-ergometrico': 'Remo ergométrico',
  eliptico: 'Elíptico',
  'escada-ergometrica': 'Escada ergométrica',
}

const GRUPOS_EQUIPAMENTO: { nome: string; itens: Equipamento[] }[] = [
  { nome: 'Pesos livres', itens: ['barra', 'halteres', 'kettlebell', 'banco'] },
  { nome: 'Máquinas', itens: ['maquina', 'polia', 'smith'] },
  { nome: 'Barras e acessórios', itens: ['barra-fixa', 'paralelas', 'elastico', 'caixa', 'corda', 'roda-abdominal'] },
  { nome: 'Cardio', itens: ['esteira', 'bicicleta-ergometrica', 'remo-ergometrico', 'eliptico', 'escada-ergometrica'] },
]

const ATALHOS: { titulo: string; texto: string; itens: readonly Equipamento[] }[] = [
  { titulo: 'Academia completa', texto: 'Pesos livres, máquinas, polias e cardio.', itens: EQUIPAMENTOS },
  { titulo: 'Casa com halteres', texto: 'Halteres e elástico.', itens: ['halteres', 'elastico'] },
  { titulo: 'Só o peso do corpo', texto: 'Sem equipamento nenhum.', itens: [] },
]

interface Rascunho {
  objetivo: Objetivo | null
  nivel: Nivel | null
  diasPorSemana: number
  minutosPorSessao: number
  equipamento: Equipamento[] | null
  limitacoes: string
}

type Fase =
  | { tipo: 'perguntas' }
  | { tipo: 'gerando'; desde: number }
  | { tipo: 'erro'; mensagem: string }
  | { tipo: 'pronto'; gerado: PlanoGerado }

const TOTAL_PASSOS = 6
const mesmoConjunto = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x) => b.includes(x))

function exerciciosDisponiveis(equipamento: readonly Equipamento[], nivel: Nivel | null): number {
  const maximo = NIVEIS.indexOf(nivel ?? 'avancado')
  return disponiveisCom(equipamento).filter((e) => NIVEIS.indexOf(e.nivel) <= maximo).length
}

export default function Questionario() {
  const [rascunho, setRascunho] = useState<Rascunho>({
    objetivo: null,
    nivel: null,
    diasPorSemana: 3,
    minutosPorSessao: 45,
    equipamento: null,
    limitacoes: '',
  })
  const [passo, setPasso] = useState(0)
  const [fase, setFase] = useState<Fase>({ tipo: 'perguntas' })
  const [temPlano, setTemPlano] = useState(false)

  // Refazer o plano parte das respostas anteriores.
  useEffect(() => {
    lerPerfil().then((perfil) => {
      if (perfil) setRascunho({ ...perfil, limitacoes: perfil.limitacoes ?? '' })
    })
    planoAtivo().then((plano) => setTemPlano(Boolean(plano)))
  }, [])

  const mudar = <C extends keyof Rascunho>(campo: C, valor: Rascunho[C]) => setRascunho((r) => ({ ...r, [campo]: valor }))

  const respondido = [
    rascunho.objetivo !== null,
    rascunho.nivel !== null,
    true,
    true,
    rascunho.equipamento !== null,
    true,
  ]

  async function montar() {
    const perfil: PerfilTreino = {
      objetivo: rascunho.objetivo!,
      nivel: rascunho.nivel!,
      diasPorSemana: rascunho.diasPorSemana,
      minutosPorSessao: rascunho.minutosPorSessao,
      equipamento: rascunho.equipamento!,
      limitacoes: rascunho.limitacoes.trim() || null,
    }
    setFase({ tipo: 'gerando', desde: Date.now() })
    pedirArmazenamentoPersistente()
    const resultado = await gerarPlano(perfil)
    if (!resultado.ok) {
      setFase({ tipo: 'erro', mensagem: resultado.erro })
      return
    }
    await salvarPerfil(perfil)
    await ativarPlano(resultado.valor)
    setFase({ tipo: 'pronto', gerado: resultado.valor })
  }

  if (fase.tipo === 'gerando' || fase.tipo === 'erro') {
    return <Gerando fase={fase} rascunho={rascunho} onTentar={montar} onAjustar={() => setFase({ tipo: 'perguntas' })} />
  }
  if (fase.tipo === 'pronto') return <PlanoPronto gerado={fase.gerado} />

  const ultimo = passo === TOTAL_PASSOS - 1

  return (
    <main className="questionario">
      <header className="questionario-topo">
        <button
          type="button"
          className="botao-icone"
          aria-label={passo === 0 ? 'Sair do questionário' : 'Voltar para a pergunta anterior'}
          onClick={() => (passo === 0 ? navegar('/') : setPasso(passo - 1))}
        >
          <ChevronLeft size={26} aria-hidden="true" />
        </button>
        <ol className="passos" aria-label={`Pergunta ${passo + 1} de ${TOTAL_PASSOS}`}>
          {Array.from({ length: TOTAL_PASSOS }, (_, i) => (
            <li key={i} className="num" data-estado={i < passo ? 'feito' : i === passo ? 'atual' : 'pendente'}>
              {i + 1}
            </li>
          ))}
        </ol>
      </header>

      <div className="questionario-corpo" key={passo}>
        {passo === 0 && (
          <Pergunta titulo="Qual é o seu objetivo principal?" texto="O plano inteiro se organiza em torno dele.">
            <div className="opcoes" role="radiogroup" aria-label="Objetivo">
              {OBJETIVOS.map((o) => (
                <Opcao
                  key={o.valor}
                  nome="objetivo"
                  titulo={o.titulo}
                  texto={o.texto}
                  marcada={rascunho.objetivo === o.valor}
                  onEscolher={() => mudar('objetivo', o.valor)}
                />
              ))}
            </div>
          </Pergunta>
        )}

        {passo === 1 && (
          <Pergunta titulo="Qual é a sua experiência com treino?" texto="Define quais exercícios entram no plano.">
            <div className="opcoes" role="radiogroup" aria-label="Nível">
              {NIVEIS.map((n, i) => (
                <Opcao
                  key={n}
                  nome="nivel"
                  posicao={i + 1}
                  titulo={NIVEIS_TEXTO[n].titulo}
                  texto={NIVEIS_TEXTO[n].texto}
                  marcada={rascunho.nivel === n}
                  onEscolher={() => mudar('nivel', n)}
                />
              ))}
            </div>
          </Pergunta>
        )}

        {passo === 2 && (
          <Pergunta titulo="Quantos dias por semana você vai treinar?" texto="Cada dia vira um treino diferente no plano.">
            <div className="celulas" role="radiogroup" aria-label="Dias por semana">
              {Array.from(
                { length: LIMITES_PERFIL.diasPorSemana.max - LIMITES_PERFIL.diasPorSemana.min + 1 },
                (_, i) => LIMITES_PERFIL.diasPorSemana.min + i,
              ).map((dias) => (
                <Celula
                  key={dias}
                  nome="dias"
                  valor={String(dias)}
                  rotulo={`${dias} dias`}
                  marcada={rascunho.diasPorSemana === dias}
                  onEscolher={() => mudar('diasPorSemana', dias)}
                />
              ))}
            </div>
          </Pergunta>
        )}

        {passo === 3 && (
          <Pergunta titulo="Quanto tempo você tem por treino?" texto="Contando séries e descansos.">
            <div className="celulas celulas-tres" role="radiogroup" aria-label="Minutos por treino">
              {MINUTOS.map((minutos) => (
                <Celula
                  key={minutos}
                  nome="minutos"
                  valor={String(minutos)}
                  unidade="min"
                  rotulo={`${minutos} minutos`}
                  marcada={rascunho.minutosPorSessao === minutos}
                  onEscolher={() => mudar('minutosPorSessao', minutos)}
                />
              ))}
            </div>
          </Pergunta>
        )}

        {passo === 4 && (
          <Pergunta titulo="O que você tem para treinar?" texto="Escolha um ponto de partida e ajuste a lista.">
            <div className="opcoes" role="radiogroup" aria-label="Ponto de partida">
              {ATALHOS.map((a) => (
                <Opcao
                  key={a.titulo}
                  nome="atalho"
                  titulo={a.titulo}
                  texto={a.texto}
                  marcada={rascunho.equipamento !== null && mesmoConjunto(rascunho.equipamento, a.itens)}
                  onEscolher={() => mudar('equipamento', [...a.itens])}
                />
              ))}
            </div>
            {GRUPOS_EQUIPAMENTO.map((grupo) => (
              <fieldset key={grupo.nome} className="equipamentos">
                <legend>{grupo.nome}</legend>
                {grupo.itens.map((item) => {
                  const marcado = rascunho.equipamento?.includes(item) ?? false
                  return (
                    <label key={item} className="equipamento">
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() => {
                          const atual = rascunho.equipamento ?? []
                          mudar('equipamento', marcado ? atual.filter((x) => x !== item) : [...atual, item])
                        }}
                      />
                      <span className="equipamento-caixa" aria-hidden="true">
                        <Check size={16} strokeWidth={3} />
                      </span>
                      {NOME_EQUIPAMENTO[item]}
                    </label>
                  )
                })}
              </fieldset>
            ))}
          </Pergunta>
        )}

        {passo === 5 && (
          <Pergunta
            titulo="Alguma lesão, dor ou limitação?"
            texto="Opcional. A IA evita exercícios que forcem a região e explica os ajustes no plano."
          >
            <label className="campo-texto">
              <span className="sr-only">Lesões, dores ou limitações</span>
              <textarea
                value={rascunho.limitacoes}
                maxLength={LIMITES_PERFIL.limitacoesCaracteres}
                rows={4}
                placeholder="Ex.: dor no joelho direito quando agacho fundo"
                onChange={(evento) => mudar('limitacoes', evento.currentTarget.value)}
              />
              <span className="campo-contador num">
                {rascunho.limitacoes.length}/{LIMITES_PERFIL.limitacoesCaracteres}
              </span>
            </label>
            <p className="nota">
              O TreinoAI não substitui orientação médica ou de um profissional de educação física. Com dor forte, cirurgia
              recente ou problema cardíaco, procure um profissional antes de começar.
            </p>
            <p className="nota">
              Para montar o plano, suas respostas são enviadas ao serviço de IA (Azure AI Foundry). O plano e os treinos
              ficam só neste aparelho.
            </p>
            {temPlano && <p className="nota">O plano novo substitui o atual. Os treinos já registrados continuam salvos.</p>}
          </Pergunta>
        )}
      </div>

      <div className="hoje-base questionario-base">
        {passo === 4 && rascunho.equipamento !== null && (
          <p className="questionario-contagem num" aria-live="polite">
            {exerciciosDisponiveis(rascunho.equipamento, rascunho.nivel)} exercícios do catálogo disponíveis
          </p>
        )}
        <button
          type="button"
          className="botao botao-primario botao-largo"
          disabled={!respondido[passo]}
          onClick={() => (ultimo ? montar() : setPasso(passo + 1))}
        >
          {ultimo ? 'Montar meu plano' : 'Continuar'}
        </button>
      </div>
    </main>
  )
}

function Pergunta({ titulo, texto, children }: { titulo: string; texto: string; children: ReactNode }) {
  return (
    <section className="pergunta" aria-labelledby="pergunta-titulo">
      <h1 id="pergunta-titulo" className="hoje-titulo">
        {titulo}
      </h1>
      <p className="hoje-foco">{texto}</p>
      {children}
    </section>
  )
}

function Opcao({
  nome,
  posicao,
  titulo,
  texto,
  marcada,
  onEscolher,
}: {
  nome: string
  /** Só quando a ordem significa algo (nível); opções sem ordem não levam número. */
  posicao?: number
  titulo: string
  texto: string
  marcada: boolean
  onEscolher: () => void
}) {
  return (
    <label className="opcao" data-marcada={marcada ? '' : undefined} data-sem-posicao={posicao ? undefined : ''}>
      <input type="radio" name={nome} className="sr-only" checked={marcada} onChange={onEscolher} />
      {posicao !== undefined && (
        <span className="opcao-pos num" aria-hidden="true">
          {posicao}
        </span>
      )}
      <span className="opcao-faixa" aria-hidden="true" />
      <span className="opcao-texto">
        <span className="opcao-titulo">{titulo}</span>
        <span className="opcao-detalhe">{texto}</span>
      </span>
      <Check className="opcao-marca" size={22} strokeWidth={2.5} aria-hidden="true" />
    </label>
  )
}

function Celula({
  nome,
  valor,
  unidade,
  rotulo,
  marcada,
  onEscolher,
}: {
  nome: string
  valor: string
  unidade?: string
  rotulo: string
  marcada: boolean
  onEscolher: () => void
}) {
  return (
    <label className="celula" data-marcada={marcada ? '' : undefined}>
      <input type="radio" name={nome} className="sr-only" checked={marcada} onChange={onEscolher} aria-label={rotulo} />
      <span className="celula-valor num" aria-hidden="true">
        {valor}
      </span>
      {unidade && (
        <span className="celula-unidade" aria-hidden="true">
          {unidade}
        </span>
      )}
    </label>
  )
}

/** O perfil enviado, em segmentos que não quebram no meio. */
function ResumoDoRascunho({ r }: { r: Rascunho }) {
  const objetivo = OBJETIVOS.find((o) => o.valor === r.objetivo)?.titulo ?? ''
  const equipamento = r.equipamento?.length ? `${r.equipamento.length} equipamentos` : 'só peso do corpo'
  const partes = [objetivo, `${r.diasPorSemana} dias`, `${r.minutosPorSessao} min`, equipamento]
  return (
    <p className="gerando-resumo num">
      {partes.map((parte, i) => (
        <span key={parte}>
          {i > 0 && ' · '}
          <span className="sem-quebra">{parte}</span>
        </span>
      ))}
    </p>
  )
}

function Gerando({
  fase,
  rascunho,
  onTentar,
  onAjustar,
}: {
  fase: { tipo: 'gerando'; desde: number } | { tipo: 'erro'; mensagem: string }
  rascunho: Rascunho
  onTentar: () => void
  onAjustar: () => void
}) {
  const agora = useAgora(fase.tipo === 'gerando', 500)
  const decorrido = fase.tipo === 'gerando' ? Math.max(0, (agora - fase.desde) / 1000) : 0

  return (
    <main className="gerando">
      <section className="placa placa-gerando" aria-live="polite">
        {fase.tipo === 'gerando' ? (
          <>
            <h1 className="gerando-titulo">Montando seu plano</h1>
            <p className="gerando-relogio num" role="timer" aria-label={`${Math.round(decorrido)} segundos`}>
              {formatarTempo(decorrido)}
            </p>
            <p className="gerando-texto">
              A IA está escolhendo os exercícios do catálogo e organizando a semana. Costuma levar uns 20 segundos.
            </p>
            <ResumoDoRascunho r={rascunho} />
          </>
        ) : (
          <>
            <h1 className="gerando-titulo">O plano não saiu</h1>
            <p className="gerando-texto">{fase.mensagem}</p>
            <ResumoDoRascunho r={rascunho} />
            <div className="placa-base gerando-acoes">
              <button type="button" className="botao botao-placa-contorno" onClick={onAjustar}>
                Ajustar respostas
              </button>
              <button type="button" className="botao botao-placa" onClick={onTentar}>
                Tentar de novo
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

function PlanoPronto({ gerado }: { gerado: PlanoGerado }) {
  const { plano } = gerado
  return (
    <main className="hoje plano-pronto">
      <header className="hoje-cabeca">
        <h1 className="hoje-titulo">{plano.nome}</h1>
        <p className="hoje-numeros num">
          {plano.dias.length} treinos por semana · {plano.duracaoSemanas} semanas
        </p>
        <p className="plano-resumo">{plano.resumo}</p>
      </header>

      <ol className="torre" aria-label="Treinos da semana">
        {plano.dias.map((dia, i) => (
          <li key={dia.nome} className="torre-linha" data-estado="pendente">
            <div className="torre-cabeca plano-dia">
              <span className="torre-pos">{i + 1}</span>
              <span className="torre-faixa" aria-hidden="true" />
              <span className="plano-dia-texto">
                <span className="torre-nome">{dia.nome}</span>
                <span className="plano-dia-foco">{dia.foco}</span>
              </span>
              <span className="torre-valor num">{dia.exercicios.length} exercícios</span>
            </div>
          </li>
        ))}
      </ol>

      <section className="plano-secao" aria-labelledby="como-progredir">
        <h2 id="como-progredir">Como progredir</h2>
        <p>{plano.progressao}</p>
      </section>

      {plano.cuidados.length > 0 && (
        <section className="plano-secao" aria-labelledby="cuidados">
          <h2 id="cuidados">Cuidados</h2>
          <ul>
            {plano.cuidados.map((cuidado) => (
              <li key={cuidado}>{cuidado}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="hoje-base">
        <button type="button" className="botao botao-primario botao-largo" onClick={() => navegar('/', { substituir: true })}>
          Ir para o treino de hoje
        </button>
      </div>
    </main>
  )
}
