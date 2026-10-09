import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDown, ArrowUp, ChevronLeft, Minus, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Exercicio } from '../../../shared/exercicios'
import {
  LIMITES_TOTAL_TREINOS,
  TOTAL_TREINOS_PADRAO,
  type DiaDeTreino,
  type ExercicioPrescrito,
  type Plano,
} from '../../../shared/plano'
import { EscolherExercicio } from '../componentes/EscolherExercicio'
import { db, planoAtivo, type PlanoSalvo } from '../dados/db'
import {
  LIMITES_EDICAO,
  planoVazio,
  prescricaoPadrao,
  problemasDoPlano,
  salvarPlano,
  trocarExercicioPrescrito,
} from '../dados/edicao'
import { sessaoAtiva } from '../dados/repositorio'
import { exercicioDe, formatarNumero, formatarTempo, textoPrescricao } from '../dados/sessao'
import { navegar } from '../rotas'

type Escolha = { modo: 'adicionar' } | { modo: 'trocar'; exercicioId: string }

interface Removido {
  prescrito: ExercicioPrescrito
  indice: number
  diaIndice: number
}

/** Carrega o plano de partida e a trava de sessão; o editor só monta com os dados prontos. */
export default function EditarPlano({ novo }: { novo: boolean }) {
  const dados = useLiveQuery(async () => {
    const [plano, sessao, treinos] = await Promise.all([
      planoAtivo(),
      sessaoAtiva(),
      planoAtivo().then((p) => (p?.id === undefined ? 0 : db.sessoes.where('planoId').equals(p.id).count())),
    ])
    return { plano: plano ?? null, emAndamento: Boolean(sessao), treinos }
  }, [])
  const [carregado, setCarregado] = useState<typeof dados>(undefined)

  // A primeira leitura vale para a edição inteira: salvar muda o plano ativo e não deve remontar o rascunho.
  if (dados && !carregado) setCarregado(dados)
  if (!carregado) return <div className="carregando" aria-busy="true" />

  if (carregado.emAndamento) {
    return (
      <main className="editor editor-travado">
        <h1 className="hoje-titulo">Há um treino em andamento</h1>
        <p className="hoje-texto">
          Termine ou encerre o treino de hoje para mudar o plano. As séries feitas ficam salvas.
        </p>
        <button type="button" className="botao botao-contorno" onClick={() => navegar('/')}>
          Voltar ao treino
        </button>
      </main>
    )
  }

  const original = novo ? null : carregado.plano
  return (
    <Editor
      original={original}
      inicial={original?.plano ?? planoVazio('Meu plano', 1)}
      treinosFeitos={original ? carregado.treinos : 0}
      substituiPlano={novo && carregado.plano !== null}
    />
  )
}

interface PropsEditor {
  original: PlanoSalvo | null
  inicial: Plano
  treinosFeitos: number
  substituiPlano: boolean
}

function Editor({ original, inicial, treinosFeitos, substituiPlano }: PropsEditor) {
  const [plano, setPlano] = useState<Plano>(inicial)
  const [diaIndice, setDiaIndice] = useState(0)
  const [aberto, setAberto] = useState<string | null>(null)
  const [escolha, setEscolha] = useState<Escolha | null>(null)
  const [aviso, setAviso] = useState('')
  const [problemas, setProblemas] = useState<string[]>([])
  const [confirmando, setConfirmando] = useState<'sair' | 'remover-dia' | null>(null)
  const [removido, setRemovido] = useState<Removido | null>(null)
  const [salvando, setSalvando] = useState(false)
  const voltarPara = useRef<string | null>(null)
  const escolhaAberta = useRef(false)
  const guarda = useRef(false)
  const manter = useRef<HTMLButtonElement>(null)

  const dia = plano.dias[diaIndice]
  const alterado = JSON.stringify(plano) !== JSON.stringify(inicial)

  // Ao fechar a escolha, a lista volta montada do topo: leva a vista e o foco ao exercício escolhido.
  useEffect(() => {
    if (escolha || !voltarPara.current) return
    const botao = document.querySelector<HTMLButtonElement>(`[aria-controls="detalhe-${voltarPara.current}"]`)
    botao?.focus({ preventScroll: true })
    botao?.closest('li')?.scrollIntoView({ block: 'center' })
    voltarPara.current = null
  }, [escolha])

  // O voltar do Android (e o gesto de voltar) passa por entradas próprias no histórico:
  // fecha a escolha de exercício ou pede confirmação, e o rascunho nunca se perde sem aviso.
  useEffect(() => {
    if (!alterado || guarda.current) return
    history.pushState({ editor: 'guarda' }, '', location.pathname)
    guarda.current = true
  }, [alterado])

  useEffect(() => {
    const aoVoltar = () => {
      if (escolhaAberta.current) {
        escolhaAberta.current = false
        setEscolha(null)
      } else if (guarda.current) {
        history.pushState({ editor: 'guarda' }, '', location.pathname)
        setConfirmando('sair')
      }
    }
    window.addEventListener('popstate', aoVoltar)
    return () => window.removeEventListener('popstate', aoVoltar)
  }, [])

  useEffect(() => {
    if (!alterado) return
    const aoSair = (evento: BeforeUnloadEvent) => evento.preventDefault()
    window.addEventListener('beforeunload', aoSair)
    return () => window.removeEventListener('beforeunload', aoSair)
  }, [alterado])

  useEffect(() => {
    if (confirmando) manter.current?.focus()
  }, [confirmando])

  // "Desfazer" fica à mão por alguns segundos depois de remover um exercício.
  useEffect(() => {
    if (!removido) return
    const relogio = setTimeout(() => setRemovido(null), 10000)
    return () => clearTimeout(relogio)
  }, [removido])

  function mudarDia(mudanca: (d: DiaDeTreino) => DiaDeTreino) {
    setPlano((p) => ({
      ...p,
      dias: p.dias.map((d, i) => (i === diaIndice ? mudanca(d) : d)),
    }))
    setProblemas([])
  }

  function mudarExercicio(exercicioId: string, mudanca: Partial<ExercicioPrescrito>) {
    mudarDia((d) => ({
      ...d,
      exercicios: d.exercicios.map((p) => (p.exercicioId === exercicioId ? { ...p, ...mudanca } : p)),
    }))
  }

  function mover(indice: number, delta: -1 | 1) {
    const destino = indice + delta
    const nome = exercicioDe(dia.exercicios[indice].exercicioId).nome
    mudarDia((d) => {
      const lista = [...d.exercicios]
      ;[lista[indice], lista[destino]] = [lista[destino], lista[indice]]
      return { ...d, exercicios: lista }
    })
    setAviso(`${nome} agora é o ${destino + 1}º.`)
  }

  function remover(indice: number) {
    const prescrito = dia.exercicios[indice]
    mudarDia((d) => ({ ...d, exercicios: d.exercicios.filter((_, i) => i !== indice) }))
    setAberto(null)
    setRemovido({ prescrito, indice, diaIndice })
  }

  function desfazerRemocao() {
    if (!removido) return
    const { prescrito, indice } = removido
    setPlano((p) => ({
      ...p,
      dias: p.dias.map((d, i) =>
        i === removido.diaIndice
          ? { ...d, exercicios: [...d.exercicios.slice(0, indice), prescrito, ...d.exercicios.slice(indice)] }
          : d,
      ),
    }))
    setDiaIndice(removido.diaIndice)
    setRemovido(null)
    setAberto(prescrito.exercicioId)
    voltarPara.current = prescrito.exercicioId
    setAviso(`${exercicioDe(prescrito.exercicioId).nome} voltou ao treino.`)
  }

  function abrirEscolha(nova: Escolha) {
    history.pushState({ editor: 'escolha' }, '', location.pathname)
    escolhaAberta.current = true
    setEscolha(nova)
  }

  /** Fecha pela própria entrada do histórico, para o voltar seguinte continuar coerente. */
  function fecharEscolha() {
    if (escolhaAberta.current) history.back()
  }

  function escolher(exercicio: Exercicio) {
    if (escolha?.modo === 'trocar') {
      const alvo = escolha.exercicioId
      mudarDia((d) => ({
        ...d,
        exercicios: d.exercicios.map((p) => (p.exercicioId === alvo ? trocarExercicioPrescrito(p, exercicio) : p)),
      }))
      setAviso(`Trocado por ${exercicio.nome}.`)
    } else {
      mudarDia((d) => ({
        ...d,
        exercicios: [...d.exercicios, prescricaoPadrao(exercicio)],
      }))
      setAviso(`${exercicio.nome} adicionado.`)
    }
    setAberto(exercicio.id)
    voltarPara.current = exercicio.id
    fecharEscolha()
  }

  function trocarDeDia(indice: number) {
    setDiaIndice(indice)
    setAberto(null)
    setConfirmando(null)
  }

  function adicionarDia() {
    const indice = plano.dias.length
    setPlano((p) => ({
      ...p,
      dias: [...p.dias, { nome: `Treino ${String.fromCharCode(65 + indice)}`, foco: '', exercicios: [] }],
    }))
    trocarDeDia(indice)
    setProblemas([])
  }

  function removerDia() {
    setPlano((p) => ({ ...p, dias: p.dias.filter((_, i) => i !== diaIndice) }))
    trocarDeDia(Math.max(0, diaIndice - 1))
    setRemovido(null)
    setProblemas([])
  }

  function sair() {
    if (alterado) setConfirmando('sair')
    else navegar('/')
  }

  /** Leva ao primeiro campo com problema: o nome do plano, o nome de um treino ou a lista de um treino. */
  function irAoProblema() {
    if (!plano.nome.trim()) {
      document.getElementById('editor-nome')?.focus()
      return
    }
    const indice = plano.dias.findIndex((d) => {
      const ids = d.exercicios.map((p) => p.exercicioId)
      return !d.nome.trim() || !d.exercicios.length || new Set(ids).size !== ids.length
    })
    if (indice < 0) return
    trocarDeDia(indice)
    requestAnimationFrame(() => {
      const alvo = plano.dias[indice].nome.trim()
        ? document.querySelector<HTMLElement>('.editor-adicionar')
        : document.getElementById('editor-dia-nome')
      alvo?.focus({ preventScroll: true })
      alvo?.scrollIntoView({ block: 'center' })
    })
  }

  async function salvar() {
    const encontrados = problemasDoPlano(plano)
    setProblemas(encontrados)
    if (encontrados.length) {
      irAoProblema()
      return
    }
    setSalvando(true)
    try {
      await salvarPlano(original, plano)
      navegar('/', { substituir: guarda.current })
    } catch {
      setProblemas(['Não foi possível salvar. Tente de novo; suas mudanças continuam aqui.'])
    } finally {
      setSalvando(false)
    }
  }

  if (escolha) {
    return (
      <EscolherExercicio
        titulo={
          escolha.modo === 'trocar'
            ? `Trocar ${exercicioDe(escolha.exercicioId).nome}`
            : `Adicionar a ${dia.nome || 'este treino'}`
        }
        jaNoTreino={dia.exercicios.map((p) => p.exercicioId)}
        onEscolher={escolher}
        onFechar={fecharEscolha}
      />
    )
  }

  const cheio = dia.exercicios.length >= LIMITES_EDICAO.exerciciosPorDia
  const visiveis = problemas.slice(0, 2)

  return (
    <main className="editor">
      <header className="progresso-topo">
        <button
          type="button"
          className="botao-icone"
          aria-label="Voltar"
          disabled={confirmando === 'sair'}
          onClick={sair}
        >
          <ChevronLeft size={26} aria-hidden="true" />
        </button>
      </header>

      <div className="editor-cabeca">
        <label className="editor-rotulo" htmlFor="editor-nome">
          Nome do plano
        </label>
        <input
          id="editor-nome"
          className="editor-nome"
          value={plano.nome}
          maxLength={60}
          autoComplete="off"
          onChange={(evento) => {
            const nome = evento.currentTarget.value
            setPlano((p) => ({ ...p, nome }))
            setProblemas([])
          }}
        />
        <div className="editor-total">
          <Contador
            rotulo="Quantidade de treinos"
            valor={plano.totalTreinos ?? TOTAL_TREINOS_PADRAO}
            min={LIMITES_TOTAL_TREINOS.min}
            max={LIMITES_TOTAL_TREINOS.max}
            passo={1}
            digitavel
            onChange={(totalTreinos) => {
              setPlano((p) => ({ ...p, totalTreinos }))
              setProblemas([])
            }}
          />
          <p>Quantas vezes você vai fazer estes treinos antes de trocar de plano.</p>
        </div>
        {treinosFeitos > 0 && (
          <p className="nota editor-nota">
            Você já fez {treinosFeitos} {treinosFeitos === 1 ? 'treino' : 'treinos'} com este plano. Salvar cria uma
            nova versão; o histórico continua como está.
          </p>
        )}
        {substituiPlano && (
          <p className="nota editor-nota">
            O plano atual sai de uso, mas os treinos feitos com ele continuam no histórico.
          </p>
        )}
      </div>

      <nav className="dias" aria-label="Treinos do plano">
        {plano.dias.map((d, i) => (
          <button
            key={i}
            type="button"
            className="dia-chip"
            aria-pressed={i === diaIndice}
            onClick={() => trocarDeDia(i)}
          >
            <span className="num">{i + 1}</span> {d.nome || 'Sem nome'}
          </button>
        ))}
        {plano.dias.length < LIMITES_EDICAO.dias.max && (
          <button type="button" className="dia-chip dia-chip-novo" onClick={adicionarDia}>
            <Plus size={16} strokeWidth={2.5} aria-hidden="true" /> Treino
          </button>
        )}
      </nav>

      <section className="editor-dia" aria-label={dia.nome || `Treino ${diaIndice + 1}`}>
        <label className="editor-rotulo" htmlFor="editor-dia-nome">
          Nome do treino
        </label>
        <input
          id="editor-dia-nome"
          className="editor-campo"
          value={dia.nome}
          maxLength={40}
          autoComplete="off"
          onChange={(evento) => {
            const nome = evento.currentTarget.value
            mudarDia((d) => ({ ...d, nome }))
          }}
        />

        {dia.exercicios.length ? (
          <ol className="torre editor-lista">
            {dia.exercicios.map((p, i) => (
              <LinhaEditavel
                key={p.exercicioId}
                prescrito={p}
                posicao={i + 1}
                total={dia.exercicios.length}
                aberta={aberto === p.exercicioId}
                onAbrir={() => setAberto(aberto === p.exercicioId ? null : p.exercicioId)}
                onMudar={(mudanca) => mudarExercicio(p.exercicioId, mudanca)}
                onMover={(delta) => mover(i, delta)}
                onTrocar={() => abrirEscolha({ modo: 'trocar', exercicioId: p.exercicioId })}
                onRemover={() => remover(i)}
              />
            ))}
          </ol>
        ) : (
          <p className="editor-vazio">Nenhum exercício ainda.</p>
        )}

        <button
          type="button"
          className="botao botao-contorno editor-adicionar"
          disabled={cheio}
          onClick={() => abrirEscolha({ modo: 'adicionar' })}
        >
          <Plus size={20} strokeWidth={2.5} aria-hidden="true" />
          {cheio ? `Limite de ${LIMITES_EDICAO.exerciciosPorDia} exercícios` : 'Adicionar exercício'}
        </button>

        {plano.dias.length > 1 && (
          <div className="editor-perigo">
            <button type="button" className="botao botao-texto-perigo" onClick={() => setConfirmando('remover-dia')}>
              Remover este treino…
            </button>
          </div>
        )}
      </section>

      <p className="sr-only" aria-live="polite">
        {aviso}
      </p>

      {/* A barra de baixo troca de conteúdo em vez de empilhar: nunca há duas placas na tela. */}
      <div className="hoje-base editor-base">
        {confirmando ? (
          <div className="editor-confirmar" role="alertdialog" aria-labelledby="editor-confirmar-texto">
            <p id="editor-confirmar-texto">
              {confirmando === 'sair'
                ? 'Sair sem salvar as mudanças?'
                : `Remover ${dia.nome || 'este treino'}${dia.exercicios.length ? ` e seus ${dia.exercicios.length} exercícios` : ''}?`}
            </p>
            <div>
              <button
                type="button"
                className="botao botao-perigo"
                onClick={() => (confirmando === 'sair' ? navegar('/', { substituir: guarda.current }) : removerDia())}
              >
                {confirmando === 'sair' ? 'Descartar' : 'Remover treino'}
              </button>
              <button type="button" className="botao botao-texto" ref={manter} onClick={() => setConfirmando(null)}>
                {confirmando === 'sair' ? 'Continuar editando' : 'Manter'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {removido && (
              <p className="editor-desfazer">
                <span>{exercicioDe(removido.prescrito.exercicioId).nome} removido.</span>
                <button type="button" className="botao botao-texto" onClick={desfazerRemocao}>
                  Desfazer
                </button>
              </p>
            )}
            {visiveis.length > 0 && (
              <ul className="editor-problemas" role="alert">
                {visiveis.map((problema) => (
                  <li key={problema}>{problema}</li>
                ))}
                {problemas.length > visiveis.length && <li>E mais {problemas.length - visiveis.length}.</li>}
              </ul>
            )}
            <button
              type="button"
              className="botao botao-primario botao-largo"
              onClick={salvar}
              disabled={salvando || (!alterado && original !== null)}
            >
              {original ? 'Salvar plano' : 'Criar plano'}
            </button>
          </>
        )}
      </div>
    </main>
  )
}

interface PropsLinha {
  prescrito: ExercicioPrescrito
  posicao: number
  total: number
  aberta: boolean
  onAbrir: () => void
  onMudar: (mudanca: Partial<ExercicioPrescrito>) => void
  onMover: (delta: -1 | 1) => void
  onTrocar: () => void
  onRemover: () => void
}

function LinhaEditavel({
  prescrito: p,
  posicao,
  total,
  aberta,
  onAbrir,
  onMudar,
  onMover,
  onTrocar,
  onRemover,
}: PropsLinha) {
  const e = exercicioDe(p.exercicioId)
  const idDetalhe = `detalhe-${p.exercicioId}`
  const { series, descanso, reps } = LIMITES_EDICAO

  return (
    <li className="torre-linha editor-linha" data-aberta={aberta ? '' : undefined}>
      <div className="editor-linha-cabeca">
        <span className="torre-pos num">{posicao}</span>
        <span className="torre-faixa" aria-hidden="true" />
        <button
          type="button"
          className="editor-linha-abrir"
          aria-expanded={aberta}
          aria-controls={idDetalhe}
          onClick={onAbrir}
        >
          <span className="torre-nome">{e.nome}</span>
          <span className="editor-linha-meta num">
            {textoPrescricao(p, e)} · descanso {formatarTempo(p.descansoSegundos)}
          </span>
        </button>
        <button
          type="button"
          className="botao-icone"
          disabled={posicao === 1}
          aria-label={`Subir ${e.nome}`}
          onClick={() => onMover(-1)}
        >
          <ArrowUp size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="botao-icone"
          disabled={posicao === total}
          aria-label={`Descer ${e.nome}`}
          onClick={() => onMover(1)}
        >
          <ArrowDown size={20} aria-hidden="true" />
        </button>
      </div>

      {aberta && (
        <div className="editor-detalhe" id={idDetalhe}>
          <div className="editor-campos">
            <Contador
              rotulo="Séries"
              valor={p.series}
              min={series.min}
              max={series.max}
              passo={1}
              onChange={(n) => onMudar({ series: n })}
            />
            {(e.medida === 'carga-reps' || e.medida === 'reps') && (
              <>
                <Contador
                  rotulo="Repetições mín."
                  valor={p.repeticoesMin ?? 8}
                  min={reps.min}
                  max={reps.max}
                  passo={1}
                  onChange={(n) =>
                    onMudar({
                      repeticoesMin: n,
                      repeticoesMax: Math.max(n, p.repeticoesMax ?? n),
                    })
                  }
                />
                <Contador
                  rotulo="Repetições máx."
                  valor={p.repeticoesMax ?? 12}
                  min={reps.min}
                  max={reps.max}
                  passo={1}
                  onChange={(n) =>
                    onMudar({
                      repeticoesMax: n,
                      repeticoesMin: Math.min(n, p.repeticoesMin ?? n),
                    })
                  }
                />
              </>
            )}
            {(e.medida === 'tempo' || e.medida === 'carga-tempo') && (
              <Contador
                rotulo="Duração"
                valor={p.duracaoSegundos ?? 30}
                min={5}
                max={600}
                passo={5}
                formatar={formatarTempo}
                onChange={(n) => onMudar({ duracaoSegundos: n })}
              />
            )}
            {e.medida === 'distancia-tempo' && (
              <>
                <Contador
                  rotulo="Minutos"
                  valor={Math.round((p.duracaoSegundos ?? 0) / 60)}
                  min={1}
                  max={180}
                  passo={1}
                  onChange={(n) => onMudar({ duracaoSegundos: n * 60 })}
                />
                <Contador
                  rotulo="Distância (km)"
                  valor={p.distanciaKm}
                  min={0.5}
                  max={50}
                  passo={0.5}
                  formatar={formatarNumero}
                  onChange={(n) => onMudar({ distanciaKm: n })}
                />
              </>
            )}
            <Contador
              rotulo="Descanso"
              valor={p.descansoSegundos}
              min={descanso.min}
              max={descanso.max}
              passo={descanso.passo}
              formatar={formatarTempo}
              onChange={(n) => onMudar({ descansoSegundos: n })}
            />
          </div>
          <div className="editor-acoes">
            <button type="button" className="botao botao-contorno" onClick={onTrocar}>
              Trocar exercício
            </button>
            <button type="button" className="botao botao-texto-perigo" onClick={onRemover}>
              Remover
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

interface PropsContador {
  rotulo: string
  /** null = sem meta; o primeiro + começa do mínimo. */
  valor: number | null
  min: number
  max: number
  passo: number
  formatar?: (n: number) => string
  /** Tocar no número abre o teclado numérico (para valores que vão longe, como a quantidade de treinos). */
  digitavel?: boolean
  onChange: (n: number) => void
}

/** − valor +, compacto, para a lista do editor. */
function Contador({ rotulo, valor, min, max, passo, formatar = String, digitavel = false, onChange }: PropsContador) {
  const limitar = (n: number) => Math.round(Math.min(max, Math.max(min, n)) * 100) / 100
  const [rascunho, setRascunho] = useState<string | null>(null)

  function confirmar() {
    const lido = Number((rascunho ?? '').trim())
    setRascunho(null)
    if (rascunho?.trim() && Number.isFinite(lido)) onChange(limitar(Math.round(lido)))
  }
  return (
    <div className="contador" role="group" aria-label={rotulo}>
      <span className="contador-rotulo" aria-hidden="true">
        {rotulo}
      </span>
      <div className="contador-linha">
        <button
          type="button"
          className="contador-botao"
          disabled={valor === null || valor <= min}
          aria-label={`Menos ${rotulo.toLowerCase()}`}
          onClick={() => valor !== null && onChange(limitar(valor - passo))}
        >
          <Minus size={20} strokeWidth={2.25} aria-hidden="true" />
        </button>
        {digitavel ? (
          <input
            className="contador-valor num"
            inputMode="numeric"
            enterKeyHint="done"
            autoComplete="off"
            aria-label={rotulo}
            value={rascunho ?? (valor === null ? '' : formatar(valor))}
            onFocus={(evento) => {
              setRascunho(evento.currentTarget.value)
              evento.currentTarget.select()
            }}
            onChange={(evento) => setRascunho(evento.currentTarget.value.replace(/D/g, ''))}
            onBlur={confirmar}
            onKeyDown={(evento) => evento.key === 'Enter' && evento.currentTarget.blur()}
          />
        ) : (
          <output className="contador-valor num" aria-live="polite">
            {valor === null ? '—' : formatar(valor)}
          </output>
        )}
        <button
          type="button"
          className="contador-botao"
          disabled={valor !== null && valor >= max}
          aria-label={`Mais ${rotulo.toLowerCase()}`}
          onClick={() => onChange(valor === null ? min : limitar(valor + passo))}
        >
          <Plus size={20} strokeWidth={2.25} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
