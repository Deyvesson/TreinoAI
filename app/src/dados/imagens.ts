// Manifesto das imagens publicadas (tools/imagens publicar): quais exercícios têm imagem e em quantos quadros.
import manifesto from '../gerado/imagens-exercicios.json'

export interface ItemManifesto {
  quadros: 1 | 2
  v: string
}

export const IMAGENS = manifesto as Record<string, ItemManifesto>

/** Primeiro quadro do exercício, para listas; null quando não há imagem publicada. */
export function miniaturaDe(id: string): string | null {
  const item = IMAGENS[id]
  return item ? `/exercicios/${id}-1.webp?v=${item.v}` : null
}
