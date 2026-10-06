// Os prompts exatos de cada quadro. Ficam num lugar só porque viram a proveniência das imagens publicadas.
import type { Exercicio } from '../../shared/exercicios.ts'
import type { Pose } from './config.ts'
import { CONTINUIDADE, ESTILO } from './estilo.ts'

export function promptsDoExercicio(e: Exercicio, pose: Pose): { inicial: string; final: string | null } {
  const apelidos = e.apelidos?.length ? ` (also known as ${e.apelidos.join(', ')})` : ''
  return {
    inicial: `${ESTILO} Camera: ${pose.camera} view. Exercise: ${e.nome}${apelidos}. Pose: ${pose.inicio}`,
    final: pose.fim ? `${CONTINUIDADE} ${pose.fim}` : null,
  }
}

/** Conteúdo do arquivo `<imagem>.webp.json`, o formato de proveniência que o Impeccable lê para WebP. */
export function proveniencia(prompt: string, modelo: string, quadro: 1 | 2): string {
  const origem = quadro === 2 ? `Edição do quadro 1 com ${modelo}` : `Gerado com ${modelo}`
  return JSON.stringify({ prompt, origin: `${origem} (Azure AI Foundry, treinoai-foundry)`, createdAt: new Date().toISOString() }, null, 2) + '\n'
}
