import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { LegendaTorre, Torre } from '../componentes/Torre'
import { db } from '../dados/db'
import { diaDaSessao, recordesAnteriores } from '../dados/repositorio'
import { formatarNumero, formatarTempo, montarTorre } from '../dados/sessao'
import { navegar } from '../rotas'

export default function Resumo({ sessaoId }: { sessaoId: number }) {
  const dados = useLiveQuery(async () => {
    const sessao = await db.sessoes.get(sessaoId)
    if (!sessao) return null
    const plano = await db.planos.get(sessao.planoId)
    if (!plano) return null
    const series = await db.series.where('sessaoId').equals(sessaoId).toArray()
    return { sessao, plano, series }
  }, [sessaoId])
  const [recordes, setRecordes] = useState<Map<string, number> | null>(null)

  useEffect(() => {
    if (dados) recordesAnteriores(diaDaSessao(dados.plano, dados.sessao), dados.sessao).then(setRecordes)
  }, [dados])

  if (dados === undefined || (dados && !recordes)) return <div className="carregando" aria-busy="true" />
  if (!dados) {
    return (
      <main className="hoje hoje-vazio">
        <h1 className="hoje-titulo">Treino não encontrado</h1>
        <p className="hoje-texto">Este resumo não existe neste aparelho.</p>
        <div className="hoje-base">
          <button type="button" className="botao botao-primario botao-largo" onClick={() => navegar('/')}>
            Voltar ao início
          </button>
        </div>
      </main>
    )
  }

  const { sessao, plano, series } = dados
  const dia = diaDaSessao(plano, sessao)
  const torre = montarTorre(dia, series, null, recordes!)
  const ultimaSerie = series.map((s) => s.registradaEm).sort().at(-1)
  const fim = Date.parse(sessao.encerradaEm ?? ultimaSerie ?? sessao.iniciadaEm)
  const duracao = (fim - Date.parse(sessao.iniciadaEm)) / 1000
  const volume = series.reduce((total, s) => total + (s.carga ?? 0) * (s.repeticoes ?? 0), 0)
  const quantos = (estado: string) => torre.filter((l) => l.estado === estado).length
  const concluido = sessao.estado === 'concluida'
  const data = new Date(sessao.iniciadaEm).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <main className="resumo">
      <header className="resumo-cabeca">
        <h1 className="hoje-titulo">{dia.nome}</h1>
        <p className="resumo-data">
          {data}
          {concluido ? '' : ' · encerrado antes do fim'}
        </p>
        <p className="resumo-linha num">
          {formatarTempo(duracao)} · {series.length} séries · {formatarNumero(Math.round(volume))} kg
        </p>
        <p className="resumo-frase">
          {quantos('meta') + quantos('recorde')} de {torre.length} exercícios na meta
          {quantos('recorde') ? `, ${quantos('recorde')} com recorde pessoal` : ''}
          {quantos('abaixo') ? `, ${quantos('abaixo')} abaixo` : ''}
          {quantos('pendente') ? `, ${quantos('pendente')} sem registro` : ''}.
        </p>
      </header>

      <Torre linhas={torre} modo="classificacao" />
      <LegendaTorre />

      <div className="hoje-base">
        <button type="button" className="botao botao-primario botao-largo" onClick={() => navegar('/')}>
          Voltar ao início
        </button>
      </div>
    </main>
  )
}
