import Diagnostico from './telas/Diagnostico'
import Hoje from './telas/Hoje'
import Progresso from './telas/Progresso'
import Questionario from './telas/Questionario'
import Resumo from './telas/Resumo'
import Sessao from './telas/Sessao'
import { useCaminho } from './rotas'

export default function App() {
  const caminho = useCaminho()
  const resumo = caminho.match(/^\/resumo\/(\d+)$/)

  if (caminho === '/treino') return <Sessao />
  if (resumo) return <Resumo sessaoId={Number(resumo[1])} />
  if (caminho === '/comecar') return <Questionario />
  if (caminho === '/progresso') return <Progresso />
  if (caminho === '/diagnostico') return <Diagnostico />
  return <Hoje />
}
