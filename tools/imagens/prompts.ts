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

/** Ordem inversa: o quadro final nasce do prompt e o inicial é uma edição dele. */
export function promptsInversos(e: Exercicio, pose: Pose & { fim: string }): { final: string; inicial: string } {
  const apelidos = e.apelidos?.length ? ` (also known as ${e.apelidos.join(', ')})` : ''
  return {
    final: `${ESTILO} Camera: ${pose.camera} view. Exercise: ${e.nome}${apelidos}. Pose: ${pose.fim}`,
    inicial: `${CONTINUIDADE} ${pose.inicio}`,
  }
}

/** Conteúdo do arquivo `<imagem>.webp.json`, o formato de proveniência que o Impeccable lê para WebP. */
export function proveniencia(prompt: string, modelo: string, quadro: 1 | 2, inverso = false): string {
  const editado = inverso ? quadro === 1 : quadro === 2
  const origem = editado ? `Edição do quadro ${quadro === 1 ? 2 : 1} com ${modelo}` : `Gerado com ${modelo}`
  return JSON.stringify({ prompt, origin: `${origem} (Azure AI Foundry, treinoai-foundry)`, createdAt: new Date().toISOString() }, null, 2) + '\n'
}
