import { useLiveQuery } from 'dexie-react-hooks'
import { Ellipsis, Undo2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Ajuste } from '../componentes/Ajuste'
import { ImagemExercicio } from '../componentes/ImagemExercicio'
import { LegendaTorre, Torre, TorreRecolhida } from '../componentes/Torre'
import { db, type SerieSalva, type SessaoSalva } from '../dados/db'
import {
  ajustarDescanso,
  cargaSugerida,
  desfazerUltimaSerie,
  diaDaSessao,
  encerrarSessao,
  recordesAnteriores,
  registrarSerie,
  sessaoAtiva,
  trocarExercicio,
  type ValoresSerie,
} from '../dados/repositorio'
import {
  exercicioDe,
  formatarTempo,
  incrementoDeCarga,
  montarTorre,
  progressoDaSessao,
  textoTempoRestante,
  textoMeta,
  textoSerie,
  type LinhaTorre,
} from '../dados/sessao'
import { avisarFimDoDescanso, prepararSom, useAgora, useMovimentoReduzido, useSomDescanso, useTelaAcesa } from '../ganchos'
import { navegar } from '../rotas'

/** O fim do descanso inverte a tela inteira uma vez: legível do outro lado da academia. */
function inverterTela() {
  const raiz = document.documentElement
  raiz.classList.remove('invertida')
  void raiz.offsetWidth
  raiz.classList.add('invertida')
  window.setTimeout(() => raiz.classList.remove('invertida'), 900)
}

export default function Sessao() {
  const sessao = useLiveQuery(async () => (await sessaoAtiva()) ?? null, [])
  const plano = useLiveQuery(
    async () => (sessao ? ((await db.planos.get(sessao.planoId)) ?? null) : undefined),
    [sessao?.planoId],
  )
  const series = useLiveQuery(
    async () => (sessao?.id ? db.series.where('sessaoId').equals(sessao.id).toArray() : undefined),
    [sessao?.id],
  )
  const [recordes, setRecordes] = useState<Map<string, number>>(new Map())
  const [torreAberta, setTorreAberta] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const reduzido = useMovimentoReduzido()
  const emDescanso = Boolean(sessao?.descansoAte)
  const agora = useAgora(true, emDescanso ? 250 : 1000)
  useTelaAcesa(Boolean(sessao))

  useEffect(() => {
    if (sessao === null) navegar('/', { substituir: true })
  }, [sessao])

  useEffect(() => {
    if (sessao && plano) recordesAnteriores(diaDaSessao(plano, sessao), sessao).then(setRecordes)
    // A régua do recorde só muda quando muda a sessão, não a cada série registrada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao?.id, plano?.id])

  // Sincroniza com o relógio: o aviso nasce do tempo passando, não de uma ação do usuário.
  useEffect(() => {
    if (!sessao?.descansoAte || agora < sessao.descansoAte) return
    const atraso = agora - sessao.descansoAte
    ajustarDescanso(sessao, null)
    if (document.visibilityState === 'visible' && atraso < 3000) {
      avisarFimDoDescanso()
      // eslint-disable-next-line react/set-state-in-effect
      if (reduzido) setAviso('Hora da próxima série')
      else inverterTela()
    } else {
      setAviso(`O descanso terminou há ${formatarTempo(atraso / 1000)}`)
    }
  }, [agora, sessao, reduzido])

  useEffect(() => {
    if (!aviso) return
    const id = window.setTimeout(() => setAviso(null), 6000)
    return () => window.clearTimeout(id)
  }, [aviso])

  if (!sessao || !plano || !series) return <div className="carregando" aria-busy="true" />

  const dia = diaDaSessao(plano, sessao)
  const torre = montarTorre(dia, series, sessao.atual, recordes)
  const linha = torre.find((l) => l.prescrito.exercicioId === sessao.atual) ?? torre.find((l) => !l.completo)
  const restante = sessao.descansoAte ? Math.max(0, (sessao.descansoAte - agora) / 1000) : null
  const decorrido = (agora - Date.parse(sessao.iniciadaEm)) / 1000
  const ultima = [...series].sort((a, b) => a.registradaEm.localeCompare(b.registradaEm)).at(-1) ?? null
  const feitos = torre.filter((l) => l.completo).length
  const { percentual, segundosRestantes } = progressoDaSessao(torre, restante)

  async function registrar(valores: ValoresSerie) {
    prepararSom()
    const resultado = await registrarSerie(sessao!, dia, valores)
    if (resultado.concluida) navegar(`/resumo/${sessao!.id}`)
  }

  async function fazerAgora(exercicioId: string) {
    await trocarExercicio(sessao!, exercicioId)
    setTorreAberta(false)
  }

  return (
    <div className="sessao">
      <aside className="sessao-lateral" aria-label="Torre do treino">
        <h2 className="sessao-lateral-titulo">{dia.nome}</h2>
        <Torre linhas={torre} modo="sessao" descanso={restante} onFazerAgora={fazerAgora} />
        <LegendaTorre />
      </aside>

      <main className="sessao-principal">
        <header className="sessao-topo">
          <div className="sessao-titulo">
            <span className="sessao-dia">{dia.nome}</span>
            <span className="sessao-relogio num" aria-label={`Tempo de treino ${formatarTempo(decorrido)}`}>
              <span className="sessao-relogio-rotulo">Tempo </span>
              {formatarTempo(decorrido)}
            </span>
          </div>
          <button
            type="button"
            className="botao-icone"
            aria-label="Opções do treino"
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto(!menuAberto)}
          >
            <Ellipsis size={24} aria-hidden="true" />
          </button>
          <TorreRecolhida linhas={torre} descanso={restante} onAbrir={() => setTorreAberta(true)} />
          <p className="sessao-progresso num">
            {feitos} de {torre.length} exercícios · <strong>{percentual}%</strong> · faltam{' '}
            {textoTempoRestante(segundosRestantes)}
          </p>
        </header>

        {aviso && (
          <p className="sessao-aviso" role="status">
            {aviso}
          </p>
        )}

        {restante !== null && ultima ? (
          <PlacaDescanso
            restante={restante}
            ultima={ultima}
            proxima={linha ?? null}
            onMais={() => ajustarDescanso(sessao, 15)}
            onPular={() => ajustarDescanso(sessao, null)}
            onDesfazer={() => desfazerUltimaSerie(sessao)}
          />
        ) : (
          linha && (
            <PlacaSerie
              key={`${linha.prescrito.exercicioId}-${linha.feitas}`}
              linha={linha}
              sessaoId={sessao.id!}
              onRegistrar={registrar}
              onDesfazer={ultima ? () => desfazerUltimaSerie(sessao) : undefined}
            />
          )
        )}
      </main>

      {torreAberta && (
        <PainelTorre
          titulo={dia.nome}
          linhas={torre}
          restante={restante}
          onFazerAgora={fazerAgora}
          onFechar={() => setTorreAberta(false)}
        />
      )}
      {menuAberto && <MenuSessao sessao={sessao} onFechar={() => setMenuAberto(false)} />}
    </div>
  )
}

function PlacaSerie({
  linha,
  sessaoId,
  onRegistrar,
  onDesfazer,
}: {
  linha: LinhaTorre
  sessaoId: number
  onRegistrar: (valores: ValoresSerie) => Promise<void>
  onDesfazer?: () => void
}) {
  const { prescrito: p, exercicio: e } = linha
  const anterior = linha.series.at(-1)
  const [carga, setCarga] = useState<number | null>(anterior?.carga ?? null)
  const [reps, setReps] = useState<number | null>(anterior?.repeticoes ?? p.repeticoesMin)
  const [duracao, setDuracao] = useState(p.duracaoSegundos ?? 30)
  const [distancia, setDistancia] = useState<number | null>(p.distanciaKm)
  const [minutos, setMinutos] = useState<number | null>(p.duracaoSegundos ? Math.round(p.duracaoSegundos / 60) : null)
  const [cronometroDesde, setCronometroDesde] = useState<number | null>(null)
  const [enviando, setEnviando] = useState(false)
  const agora = useAgora(cronometroDesde !== null, 200)
  const temCarga = e.medida === 'carga-reps' || e.medida === 'carga-tempo'
  const cronometrado = e.medida === 'tempo' || e.medida === 'carga-tempo'
  const decorrido = cronometroDesde === null ? 0 : (agora - cronometroDesde) / 1000

  useEffect(() => {
    if (temCarga && carga === null) cargaSugerida(e.id, sessaoId).then((c) => setCarga((atual) => atual ?? c))
    // Sugestão carregada uma vez por série (o componente é recriado a cada série).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const valores = (): ValoresSerie => {
    switch (e.medida) {
      case 'carga-reps':
        return { carga, repeticoes: reps, duracaoSegundos: null, distanciaKm: null }
      case 'reps':
        return { carga: null, repeticoes: reps, duracaoSegundos: null, distanciaKm: null }
      case 'tempo':
      case 'carga-tempo':
        return {
          carga: temCarga ? carga : null,
          repeticoes: null,
          duracaoSegundos: Math.round(cronometroDesde === null ? duracao : Math.min(decorrido, duracao)),
          distanciaKm: null,
        }
      case 'distancia-tempo':
        return { carga: null, repeticoes: null, duracaoSegundos: minutos ? minutos * 60 : null, distanciaKm: distancia }
    }
  }

  const valido =
    (e.medida === 'carga-reps' && carga !== null && Boolean(reps)) ||
    (e.medida === 'reps' && Boolean(reps)) ||
    (e.medida === 'tempo' && duracao > 0) ||
    (e.medida === 'carga-tempo' && carga !== null && duracao > 0) ||
    (e.medida === 'distancia-tempo' && Boolean(distancia || minutos))

  async function enviar() {
    if (enviando) return
    setEnviando(true)
    await onRegistrar(valores())
  }

  // Série cronometrada: ao zerar, registra sozinha com o tempo da meta.
  // Só o relógio dispara este efeito; `enviar` se protege de envio duplo.
  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    if (cronometroDesde !== null && decorrido >= duracao) enviar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decorrido])

  const restanteCronometro = Math.max(0, duracao - decorrido)

  return (
    <section className="placa" aria-labelledby="placa-nome">
      <div className="placa-cabeca">
        <p className="placa-posicao num" aria-label={`Exercício ${linha.posicao}`}>
          {linha.posicao}
        </p>
        <div>
          <h1 id="placa-nome" className="placa-nome">
            {e.nome}
          </h1>
          <p className="placa-serie">
            <span className="num">
              Série {linha.feitas + 1} de {linha.total}
            </span>
            <span className="placa-meta">{textoMeta(p, e)}</span>
          </p>
        </div>
      </div>

      <div className="placa-midia">
        <ImagemExercicio id={e.id} nome={e.nome} />
      </div>

      <ol className="placa-series" aria-label="Séries deste exercício">
        {Array.from({ length: linha.total }, (_, i) => {
          const feita = linha.series[i]
          const atual = i === linha.feitas
          return (
            <li key={i} data-feita={feita ? '' : undefined} data-atual={atual ? '' : undefined}>
              <span className="num">{i + 1}</span>
              {linha.total <= 5 && (
                <span className="num">{feita ? textoSerie(feita, e) : atual ? 'agora' : ''}</span>
              )}
            </li>
          )
        })}
      </ol>

      <div className="placa-registro" data-campos={temCarga || e.medida === 'distancia-tempo' ? 2 : 1}>
        {temCarga && (
          <Ajuste rotulo="Carga" unidade="kg" valor={carga} passo={incrementoDeCarga(e)} max={500} decimal onChange={setCarga} />
        )}
        {(e.medida === 'carga-reps' || e.medida === 'reps') && (
          <Ajuste
            rotulo={e.unilateral ? 'Reps por lado' : 'Reps'}
            valor={reps}
            passo={1}
            min={1}
            max={100}
            onChange={setReps}
          />
        )}
        {cronometrado &&
          (cronometroDesde === null ? (
            <Ajuste rotulo="Tempo" unidade="s" valor={duracao} passo={5} min={5} max={3600} onChange={setDuracao} />
          ) : (
            <div className="ajuste">
              <span className="ajuste-rotulo">Faltam</span>
              <p className="cronometro num" role="timer">
                {formatarTempo(restanteCronometro)}
              </p>
            </div>
          ))}
        {e.medida === 'distancia-tempo' && (
          <>
            <Ajuste rotulo="Distância" unidade="km" valor={distancia} passo={0.5} max={60} decimal onChange={setDistancia} />
            <Ajuste rotulo="Tempo" unidade="min" valor={minutos} passo={1} max={600} onChange={setMinutos} />
          </>
        )}
      </div>

      <div className="placa-base">
        {cronometrado && cronometroDesde === null ? (
          <button
            type="button"
            className="botao botao-placa"
            disabled={!valido}
            onClick={() => {
              prepararSom()
              setCronometroDesde(Date.now())
            }}
          >
            Iniciar <span className="num">{formatarTempo(duracao)}</span>
          </button>
        ) : (
          <button type="button" className="botao botao-placa" disabled={!valido || enviando} onClick={enviar}>
            {cronometroDesde === null ? 'Registrar série' : 'Parar e registrar'}
          </button>
        )}
      </div>

      {onDesfazer && (
        <button type="button" className="botao-desfazer" onClick={onDesfazer}>
          <Undo2 size={18} aria-hidden="true" /> Desfazer última série
        </button>
      )}
    </section>
  )
}

function PlacaDescanso({
  restante,
  ultima,
  proxima,
  onMais,
  onPular,
  onDesfazer,
}: {
  restante: number
  ultima: SerieSalva
  proxima: LinhaTorre | null
  onMais: () => void
  onPular: () => void
  onDesfazer: () => void
}) {
  const exercicioUltima = exercicioDe(ultima.exercicioId)
  return (
    <section className="placa placa-descanso" aria-label="Descanso">
      <button type="button" className="botao-desfazer" onClick={onDesfazer}>
        <Undo2 size={18} aria-hidden="true" /> Desfazer série
      </button>
      <div className="descanso-centro">
        <p className="descanso-contagem num" role="timer" aria-label={`Descanso: ${formatarTempo(restante)}`}>
          {formatarTempo(Math.ceil(restante))}
        </p>
        <p className="descanso-registrada">
          {exercicioUltima.nome}: <span className="num">{textoSerie(ultima, exercicioUltima)}</span>
        </p>
      </div>
      {proxima && (
        <div className="descanso-seguir">
          <p className="descanso-seguir-nome">
            A seguir: <span className="num">{proxima.posicao}</span> {proxima.exercicio.nome}
          </p>
          <p className="descanso-seguir-meta num">
            Série {proxima.feitas + 1} de {proxima.total} · {textoMeta(proxima.prescrito, proxima.exercicio)}
          </p>
        </div>
      )}
      <div className="placa-base descanso-acoes">
        <button type="button" className="botao botao-placa-contorno" onClick={onMais}>
          +15 s
        </button>
        <button type="button" className="botao botao-placa" onClick={onPular}>
          Pular descanso
        </button>
      </div>
    </section>
  )
}

function PainelTorre({
  titulo,
  linhas,
  restante,
  onFazerAgora,
  onFechar,
}: {
  titulo: string
  linhas: LinhaTorre[]
  restante: number | null
  onFazerAgora: (id: string) => void
  onFechar: () => void
}) {
  const fechar = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    fechar.current?.focus()
    const aoTeclar = (evento: KeyboardEvent) => evento.key === 'Escape' && onFechar()
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  return (
    <div className="painel-torre" role="dialog" aria-modal="true" aria-labelledby="painel-torre-titulo">
      <header className="painel-torre-topo">
        <h2 id="painel-torre-titulo">{titulo}</h2>
        <button ref={fechar} type="button" className="botao-icone" aria-label="Fechar a torre" onClick={onFechar}>
          <X size={24} aria-hidden="true" />
        </button>
      </header>
      <Torre linhas={linhas} modo="sessao" descanso={restante} onFazerAgora={onFazerAgora} />
      <p className="painel-torre-dica">Aparelho ocupado? Toque num exercício pendente para fazê-lo agora.</p>
      <LegendaTorre />
    </div>
  )
}

function MenuSessao({ sessao, onFechar }: { sessao: SessaoSalva; onFechar: () => void }) {
  const [som, setSom] = useSomDescanso()
  const [confirmando, setConfirmando] = useState(false)
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => evento.key === 'Escape' && onFechar()
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  return (
    <>
      <div className="menu-fundo" onClick={onFechar} aria-hidden="true" />
      <div className="menu-sessao" role="dialog" aria-label="Opções do treino">
        <label className="interruptor">
          <input type="checkbox" checked={som} onChange={(evento) => setSom(evento.currentTarget.checked)} />
          <span>Som no fim do descanso</span>
        </label>
        <div className="menu-perigo">
          {confirmando ? (
            <>
              <p>Encerrar agora? As séries feitas ficam salvas.</p>
              <button
                type="button"
                className="botao botao-perigo"
                onClick={async () => {
                  await encerrarSessao(sessao)
                  navegar(`/resumo/${sessao.id}`)
                }}
              >
                Encerrar treino
              </button>
              <button type="button" className="botao botao-texto" onClick={() => setConfirmando(false)}>
                Continuar treinando
              </button>
            </>
          ) : (
            <button type="button" className="botao botao-texto-perigo" onClick={() => setConfirmando(true)}>
              Encerrar treino…
            </button>
          )}
        </div>
      </div>
    </>
  )
}
