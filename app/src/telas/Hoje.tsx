import { useLiveQuery } from 'dexie-react-hooks'
import { TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { InstalarApp } from '../componentes/InstalarApp'
import { Torre } from '../componentes/Torre'
import { TOTAL_TREINOS_PADRAO } from '../../../shared/plano'
import { db, planoAtivo } from '../dados/db'
import { diaDaSessao, encerrarSessao, iniciarSessao, proximoDia, sessaoAtiva, treinosFeitos } from '../dados/repositorio'
import { minutosEstimados, montarTorre } from '../dados/sessao'
import { prepararSom, useSomDescanso } from '../ganchos'
import { navegar } from '../rotas'

export default function Hoje() {
  const plano = useLiveQuery(async () => (await planoAtivo()) ?? null, [])
  const sessao = useLiveQuery(async () => (await sessaoAtiva()) ?? null, [])
  const seriesDaSessao = useLiveQuery(
    async () => (sessao?.id ? db.series.where('sessaoId').equals(sessao.id).toArray() : []),
    [sessao?.id],
  )
  const feitos = useLiveQuery(async () => (plano ? treinosFeitos(plano) : 0), [plano])
  const [diaEscolhido, setDiaEscolhido] = useState<number | null>(null)
  const [diaSugerido, setDiaSugerido] = useState<number | null>(null)
  const [som, setSom] = useSomDescanso()
  const [confirmandoEncerrar, setConfirmandoEncerrar] = useState(false)

  useEffect(() => {
    if (plano) proximoDia(plano).then(setDiaSugerido)
  }, [plano])

  if (plano === undefined || sessao === undefined || seriesDaSessao === undefined || feitos === undefined) {
    return <div className="carregando" aria-busy="true" />
  }

  if (!plano) {
    return (
      <main className="hoje hoje-vazio">
        <h1 className="hoje-titulo">Seu plano de treino, montado pela IA</h1>
        <p className="hoje-texto">
          Responda seis perguntas rápidas: objetivo, experiência, dias, tempo, equipamento e limitações. A IA monta um
          plano completo com exercícios do catálogo e explica o motivo de cada um.
        </p>
        <p className="hoje-texto">
          Prefere escolher cada exercício?{' '}
          <button type="button" className="botao botao-texto botao-inline" onClick={() => navegar('/plano/novo')}>
            Monte seu plano do zero
          </button>
          .
        </p>
        <InstalarApp />
        <div className="hoje-base">
          <button type="button" className="botao botao-primario botao-largo" onClick={() => navegar('/comecar')}>
            Montar meu plano
          </button>
        </div>
      </main>
    )
  }

  if (sessao && sessao.planoId === plano.id) {
    const dia = diaDaSessao(plano, sessao)
    const torre = montarTorre(dia, seriesDaSessao, sessao.atual)
    const feitos = torre.filter((l) => l.completo).length
    return (
      <main className="hoje">
        <section className="hoje-retomar" aria-labelledby="retomar-titulo">
          <h1 id="retomar-titulo" className="hoje-titulo">
            {dia.nome}
          </h1>
          <p className="num">
            Em andamento · {feitos} de {torre.length} exercícios · {seriesDaSessao.length} séries registradas
          </p>
          <button type="button" className="botao botao-placa" onClick={() => navegar('/treino')}>
            Retomar treino
          </button>
        </section>
        <Torre linhas={torre} modo="classificacao" />
        <div className="hoje-instalar-retomar">
          <InstalarApp />
        </div>
        <div className="hoje-perigo">
          {confirmandoEncerrar ? (
            <>
              <p>Encerrar este treino? As séries feitas ficam salvas.</p>
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
              <button type="button" className="botao botao-texto" onClick={() => setConfirmandoEncerrar(false)}>
                Voltar
              </button>
            </>
          ) : (
            <button type="button" className="botao botao-texto-perigo" onClick={() => setConfirmandoEncerrar(true)}>
              Encerrar treino…
            </button>
          )}
        </div>
      </main>
    )
  }

  // Depois de editar, o plano pode ter menos dias que o índice lembrado.
  const indice = Math.min(diaEscolhido ?? diaSugerido ?? 0, plano.plano.dias.length - 1)
  const dia = plano.plano.dias[indice]
  const torre = montarTorre(dia, [], null)
  const total = plano.plano.totalTreinos ?? TOTAL_TREINOS_PADRAO

  async function comecar() {
    prepararSom()
    await iniciarSessao(plano!, indice)
    navegar('/treino')
  }

  return (
    <main className="hoje">
      <header className="hoje-cabeca">
        <button type="button" className="hoje-progresso" onClick={() => navegar('/progresso')}>
          <TrendingUp size={18} aria-hidden="true" /> Progresso
        </button>
        <h1 className="hoje-titulo">{dia.nome}</h1>
        <p className="hoje-foco">{dia.foco}</p>
        <p className="hoje-contagem num" aria-label={`${feitos} de ${total} treinos feitos`}>
          <strong>{feitos}</strong>/{total} treinos{feitos >= total && ' · plano concluído'}
        </p>
        <p className="hoje-numeros num">
          {indice === diaSugerido ? 'Próximo treino' : 'Treino escolhido'} · {dia.exercicios.length} exercícios · cerca
          de {minutosEstimados(dia)} min
        </p>
      </header>

      <InstalarApp />

      {plano.plano.dias.length > 1 && (
        <nav className="dias" aria-label="Dias do plano">
          {plano.plano.dias.map((d, i) => (
            <button
              key={i}
              type="button"
              className="dia-chip"
              aria-pressed={i === indice}
              onClick={() => setDiaEscolhido(i)}
            >
              <span className="num">{i + 1}</span> {d.nome}
            </button>
          ))}
        </nav>
      )}

      <Torre linhas={torre} modo="abertura" />

      <section className="hoje-ajustes" aria-label="Ajustes">
        <label className="interruptor">
          <input type="checkbox" checked={som} onChange={(evento) => setSom(evento.currentTarget.checked)} />
          <span>Som no fim do descanso</span>
        </label>
        <p className="hoje-plano">
          Plano: {plano.plano.nome} · {plano.plano.duracaoSemanas} semanas
        </p>
        <div className="hoje-plano-acoes">
          <button type="button" className="botao botao-texto" onClick={() => navegar('/plano/editar')}>
            Editar plano
          </button>
          <button type="button" className="botao botao-texto" onClick={() => navegar('/comecar')}>
            Refazer com a IA
          </button>
          <button type="button" className="botao botao-texto" onClick={() => navegar('/plano/novo')}>
            Montar do zero
          </button>
        </div>
      </section>

      <div className="hoje-base">
        <button type="button" className="botao botao-primario botao-largo" onClick={comecar}>
          Começar treino
        </button>
      </div>
    </main>
  )
}
