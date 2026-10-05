// Etapa 3: recria a página de revisão sem gerar nada (útil depois de editar aprovados.json).
import { gerarRevisao } from './revisao.ts'

await gerarRevisao()
console.log('Página de revisão: .preview/revisao.html')
