import { useState } from 'react'
import manifesto from '../gerado/imagens-exercicios.json'

interface ItemManifesto {
  quadros: 1 | 2
  v: string
}

const IMAGENS = manifesto as Record<string, ItemManifesto>

/**
 * Os dois quadros do exercício alternando com transição suave. Tocar pausa no quadro atual.
 * Sem imagem publicada, não renderiza nada: o nome do exercício basta.
 */
export function ImagemExercicio({ id, nome, className = '' }: { id: string; nome: string; className?: string }) {
  const [pausado, setPausado] = useState(false)
  const item = IMAGENS[id]
  if (!item) return null
  const src = (quadro: number) => `/exercicios/${id}-${quadro}.webp?v=${item.v}`

  if (item.quadros === 1) {
    return (
      <figure className={`imagem-exercicio ${className}`}>
        <img src={src(1)} alt={`Execução de ${nome}`} width={768} height={768} />
      </figure>
    )
  }
  return (
    <figure className={`imagem-exercicio ${className}`} data-pausado={pausado ? '' : undefined}>
      <button
        type="button"
        className="imagem-exercicio-alternar"
        onClick={() => setPausado(!pausado)}
        aria-label={pausado ? 'Retomar animação do exercício' : 'Pausar animação do exercício'}
        aria-pressed={pausado}
      >
        <img src={src(1)} alt={`${nome}: posição inicial`} width={768} height={768} />
        <img className="quadro-final" src={src(2)} alt={`${nome}: posição final`} width={768} height={768} />
      </button>
    </figure>
  )
}
