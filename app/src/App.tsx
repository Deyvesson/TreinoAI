import Diagnostico from './telas/Diagnostico'
import EditarPlano from './telas/EditarPlano'
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
  if (caminho === '/plano/editar') return <EditarPlano novo={false} />
  if (caminho === '/plano/novo') return <EditarPlano novo />
  if (caminho === '/progresso') return <Progresso />
  if (caminho === '/diagnostico') return <Diagnostico />
  return <Hoje />
}
