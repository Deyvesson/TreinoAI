import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MINIMO_TREINOS_ANALISE } from '../../../shared/progresso'
import { GraficoEvolucao } from '../componentes/GraficoEvolucao'
import { analisarProgresso } from '../dados/api'
import { db, lerPerfil, planoAtivo, type AnaliseSalva } from '../dados/db'
import { carregarHistorico, montarResumo, nomeDoExercicio, type Historico } from '../dados/progresso'
import { formatarNumero, formatarTempo } from '../dados/sessao'
import { useAgora } from '../ganchos'
import { navegar } from '../rotas'

const dataLonga = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
const diaDaSemana = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
const diaMes = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

export default function Progresso() {
  const versao = useLiveQuery(async () => `${await db.sessoes.count()}-${await db.series.count()}`, [])
  const [historico, setHistorico] = useState<Historico | null>(null)
  const ultimaAnalise = useLiveQuery(async () => (await db.analises.orderBy('geradaEm').last()) ?? null, [])
  const perfil = useLiveQuery(async () => (await lerPerfil()) ?? null, [])

  useEffect(() => {
    if (versao !== undefined) carregarHistorico().then(setHistorico)
  }, [versao])

  if (!historico || ultimaAnalise === undefined || perfil === undefined) return <div className="carregando" aria-busy="true" />

  const { treinos, evolucao, frequencia } = historico
  const primeiro = treinos.at(-1)
  const meta = perfil?.diasPorSemana ?? null
  const semanasNaMeta = meta ? frequencia.filter((s) => s.treinos >= meta).length : 0

  return (
    <main className="progresso">
      <header className="progresso-topo">
        <button type="button" className="botao-icone" aria-label="Voltar ao treino de hoje" onClick={() => navegar('/')}>
          <ChevronLeft size={26} aria-hidden="true" />
        </button>
      </header>
      <div className="progresso-cabeca">
        <h1 className="hoje-titulo">Progresso</h1>
        <p className="hoje-numeros num">
          {treinos.length === 0
            ? 'Nenhum treino registrado ainda'
            : `${treinos.length} ${treinos.length === 1 ? 'treino' : 'treinos'} · ${frequencia.length} ${frequencia.length === 1 ? 'semana' : 'semanas'}${meta ? ` · ${semanasNaMeta} na meta` : ''}`}
        </p>
        {primeiro && <p className="progresso-desde">Desde {dataLonga(primeiro.sessao.iniciadaEm)}</p>}
      </div>

      {treinos.length === 0 ? (
        <section className="progresso-vazio">
          <p className="hoje-texto">
            A evolução de cada exercício, a frequência e a análise da IA aparecem aqui depois do primeiro treino registrado.
          </p>
          <button type="button" className="botao botao-primario botao-largo" onClick={() => navegar('/')}>
            Ir para o treino de hoje
          </button>
        </section>
      ) : (
        <>
          <SecaoAnalise historico={historico} ultima={ultimaAnalise} />
          <SecaoFrequencia frequencia={frequencia} meta={meta} />
          <section className="progresso-secao" aria-labelledby="titulo-evolucao">
            <h2 id="titulo-evolucao">Evolução por exercício</h2>
            <ul className="legenda legenda-topo" aria-label="Cores do último treino de cada exercício">
              <li data-estado="recorde">
                <span aria-hidden="true" />
                Recorde no último treino
              </li>
              <li data-estado="meta">
                <span aria-hidden="true" />
                Meta cumprida
              </li>
              <li data-estado="abaixo">
                <span aria-hidden="true" />
                Abaixo da meta
              </li>
            </ul>
            <ListaEvolucao evolucao={evolucao} />
          </section>
          <section className="progresso-secao" aria-labelledby="titulo-treinos">
            <h2 id="titulo-treinos">Treinos feitos</h2>
            <ul className="legenda legenda-topo" aria-label="Cores dos treinos">
              <li data-estado="meta">
                <span aria-hidden="true" />
                Todos os exercícios na meta
              </li>
              <li data-estado="abaixo">
                <span aria-hidden="true" />
                Algum abaixo da meta
              </li>
            </ul>
            <ol className="torre treinos-feitos">
              {treinos.map((t) => (
                <li key={t.sessao.id} className="torre-linha" data-estado={t.exerciciosNaMeta === t.exerciciosNoDia ? 'meta' : 'abaixo'}>
                  <button type="button" className="torre-cabeca treino-feito" onClick={() => navegar(`/resumo/${t.sessao.id}`)}>
                    <span className="treino-feito-data num">
                      <span>{diaDaSemana(t.sessao.iniciadaEm)}</span>
                      <span>{diaMes(t.sessao.iniciadaEm)}</span>
                    </span>
                    <span className="torre-faixa" aria-hidden="true" />
                    <span className="treino-feito-texto">
                      <span className="torre-nome">{t.nomeDia}</span>
                      <span className="treino-feito-meta num">
                        {formatarTempo(t.duracaoSegundos)} · {t.series} séries · {t.exerciciosNaMeta} de {t.exerciciosNoDia} na meta
                      </span>
                    </span>
                    <ChevronRight className="torre-seta" size={18} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </main>
  )
}

function SecaoAnalise({ historico, ultima }: { historico: Historico; ultima: AnaliseSalva | null }) {
  const [estado, setEstado] = useState<{ tipo: 'parado' } | { tipo: 'gerando'; desde: number } | { tipo: 'erro'; mensagem: string }>({
    tipo: 'parado',
  })
  const agora = useAgora(estado.tipo === 'gerando', 500)
  const total = historico.treinos.length
  const faltam = Math.max(0, MINIMO_TREINOS_ANALISE - total)
  const novos = ultima ? total - ultima.treinosAnalisados : total

  async function analisar() {
    const [perfil, plano] = await Promise.all([lerPerfil(), planoAtivo()])
    if (!perfil || !plano) {
      setEstado({ tipo: 'erro', mensagem: 'Monte um plano antes de pedir a análise.' })
      return
    }
    setEstado({ tipo: 'gerando', desde: Date.now() })
    const resultado = await analisarProgresso(montarResumo(historico, perfil, plano))
    if (!resultado.ok) {
      setEstado({ tipo: 'erro', mensagem: resultado.erro })
      return
    }
    await db.analises.add(resultado.valor)
    setEstado({ tipo: 'parado' })
  }

  return (
    <section className="progresso-secao" aria-labelledby="titulo-analise">
      <h2 id="titulo-analise">Análise da IA</h2>

      {faltam > 0 ? (
        <div className="analise-bloqueada">
          <ol className="passos" aria-label={`${total} de ${MINIMO_TREINOS_ANALISE} treinos`}>
            {Array.from({ length: MINIMO_TREINOS_ANALISE }, (_, i) => (
              <li key={i} className="num" data-estado={i < total ? 'feito' : 'pendente'}>
                {i + 1}
              </li>
            ))}
          </ol>
          <p>
            A IA analisa sua evolução a partir de {MINIMO_TREINOS_ANALISE} treinos registrados. Falta{faltam > 1 ? 'm' : ''}{' '}
            {faltam}.
          </p>
        </div>
      ) : estado.tipo === 'gerando' ? (
        <p className="analise-gerando" role="status">
          Analisando seu histórico… <span className="num">{formatarTempo((agora - estado.desde) / 1000)}</span>
        </p>
      ) : (
        <>
          {ultima && <Analise analise={ultima} />}
          {estado.tipo === 'erro' && (
            <p className="analise-erro" role="alert">
              {estado.mensagem}
            </p>
          )}
          {!ultima ? (
            <>
              <p className="analise-intro">
                A IA lê a evolução de cada exercício e a sua frequência, aponta o que avançou e o que estagnou e sugere os
                próximos passos. Seu histórico resumido é enviado ao serviço de IA (Azure AI Foundry).
              </p>
              <button type="button" className="botao botao-primario botao-largo" onClick={analisar}>
                Analisar meu progresso
              </button>
            </>
          ) : novos > 0 ? (
            <>
              <button type="button" className="botao botao-contorno analise-refazer" onClick={analisar}>
                Analisar de novo ({novos} {novos === 1 ? 'treino novo' : 'treinos novos'})
              </button>
              <p className="analise-nota">Seu histórico resumido é enviado ao serviço de IA (Azure AI Foundry).</p>
            </>
          ) : (
            <p className="analise-nota">Uma nova análise fica disponível depois do próximo treino.</p>
          )}
        </>
      )}
    </section>
  )
}

function Analise({ analise: salva }: { analise: AnaliseSalva }) {
  const { analise } = salva
  return (
    <article className="analise">
      <p className="analise-data">
        Análise de {dataLonga(salva.geradaEm)} · {salva.treinosAnalisados} treinos
      </p>
      <p className="analise-resumo">{analise.resumo}</p>

      {analise.destaques.length > 0 && (
        <>
          <h3>O que avançou</h3>
          <ul className="analise-lista" data-estado="meta">
            {analise.destaques.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </>
      )}

      {analise.estagnados.length > 0 && (
        <>
          <h3>O que estagnou</h3>
          <ul className="analise-lista" data-estado="abaixo">
            {analise.estagnados.map((e) => (
              <li key={e.exercicioId}>
                <strong>{nomeDoExercicio(e.exercicioId)}</strong>
                <span>{e.explicacao}</span>
                <span className="analise-sugestao">{e.sugestao}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>Próximos passos</h3>
      <ol className="analise-passos">
        {analise.proximosPassos.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ol>

      <h3>Frequência</h3>
      <p>{analise.frequencia}</p>
      {analise.limitacoes && <p className="analise-nota">{analise.limitacoes}</p>}
    </article>
  )
}

function SecaoFrequencia({ frequencia, meta }: { frequencia: Historico['frequencia']; meta: number | null }) {
  return (
    <section className="progresso-secao" aria-labelledby="titulo-frequencia">
      <h2 id="titulo-frequencia">Frequência semanal</h2>
      <p className="frequencia-meta">{meta ? `Meta do plano: ${meta} treinos por semana` : 'Treinos por semana'}</p>
      <ol className="frequencia">
        {frequencia.map((s, i) => {
          const [ano, mes, dia] = s.inicio.split('-')
          const atual = i === frequencia.length - 1
          // A semana atual só é julgada quando termina ou quando a meta já foi cumprida.
          const estado = meta && s.treinos >= meta ? 'meta' : atual ? 'atual' : s.treinos === 0 ? 'pendente' : 'abaixo'
          return (
            <li
              key={s.inicio}
              data-estado={estado}
              aria-label={`Semana de ${dia}/${mes}/${ano}: ${s.treinos} ${s.treinos === 1 ? 'treino' : 'treinos'}${atual ? ' (semana atual)' : ''}`}
              title={`Semana de ${dia}/${mes}: ${s.treinos} ${s.treinos === 1 ? 'treino' : 'treinos'}`}
            >
              <span className="frequencia-valor num">{s.treinos}</span>
              <span className="frequencia-semana num">{atual ? 'atual' : `${dia}/${mes}`}</span>
            </li>
          )
        })}
      </ol>
      <ul className="legenda frequencia-legenda" aria-label="Cores da frequência">
        <li data-estado="meta">
          <span aria-hidden="true" />
          Meta cumprida
        </li>
        <li data-estado="abaixo">
          <span aria-hidden="true" />
          Abaixo da meta
        </li>
        <li data-estado="pendente">
          <span aria-hidden="true" />
          Sem treino
        </li>
        <li data-estado="atual">
          <span aria-hidden="true" />
          Semana atual
        </li>
      </ul>
    </section>
  )
}

function ListaEvolucao({ evolucao }: { evolucao: Historico['evolucao'] }) {
  const [aberto, setAberto] = useState<string | null>(null)
  return (
    <ol className="torre evolucao">
      {evolucao.map((e) => {
        const ultimo = e.pontos.at(-1)!
        const recordes = e.pontos.filter((p) => p.recorde).length
        // O ganho desde o primeiro treino, como a diferença na transmissão.
        const ganho = Math.round((ultimo.valor - e.pontos[0].valor) * 10) / 10
        const estaAberto = aberto === e.id
        // Cor da torre aplicada ao último treino: roxo se foi recorde, verde se cumpriu a meta, amarelo se ficou abaixo.
        const estado = ultimo.recorde ? 'recorde' : ultimo.metaCumprida ? 'meta' : 'abaixo'
        return (
          <li key={e.id} className="torre-linha" data-estado={estado} data-aberta={estaAberto ? '' : undefined}>
            <button
              type="button"
              className="torre-cabeca evolucao-cabeca"
              aria-expanded={estaAberto}
              onClick={() => setAberto(estaAberto ? null : e.id)}
            >
              <span className="torre-faixa" aria-hidden="true" />
              <span className="treino-feito-texto">
                <span className="torre-nome">{e.nome}</span>
                <span className="treino-feito-meta num">
                  {e.pontos.length} {e.pontos.length === 1 ? 'treino' : 'treinos'}
                  {ganho > 0 ? ` · +${formatarNumero(ganho)} ${e.unidade} desde o primeiro` : ''}
                  {recordes ? ` · ${recordes} ${recordes === 1 ? 'recorde' : 'recordes'}` : ''}
                </span>
              </span>
              <span className="torre-valor num">{ultimo.texto}</span>
              <ChevronDown className="torre-seta" size={18} aria-hidden="true" />
            </button>
            {estaAberto && (
              <div className="evolucao-detalhe">
                <GraficoEvolucao evolucao={e} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
