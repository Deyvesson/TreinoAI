import { Minus, Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { formatarNumero } from '../dados/sessao'

interface Props {
  rotulo: string
  unidade?: string
  valor: number | null
  passo: number
  min?: number
  max: number
  decimal?: boolean
  onChange: (valor: number) => void
}

const arredondar = (valor: number) => Math.round(valor * 100) / 100

/** Número grande com − e + para o polegar; tocar no número abre o teclado numérico. */
export function Ajuste({ rotulo, unidade, valor, passo, min = 0, max, decimal = false, onChange }: Props) {
  const id = useId()
  // Enquanto o usuário digita, vale o rascunho; fora disso, o texto deriva do valor.
  const [rascunho, setRascunho] = useState<string | null>(null)
  const texto = rascunho ?? (valor === null ? '' : formatarNumero(valor))

  const limitar = (n: number) => arredondar(Math.min(max, Math.max(min, n)))
  const mudar = (delta: number) => onChange(limitar((valor ?? 0) + delta))

  function confirmar() {
    const lido = Number(texto.replace(/\./g, '').replace(',', '.'))
    setRascunho(null)
    if (texto.trim() === '' || Number.isNaN(lido)) return
    onChange(limitar(decimal ? lido : Math.round(lido)))
  }

  return (
    <div className="ajuste">
      <label className="ajuste-rotulo" htmlFor={id}>
        {rotulo}
        {unidade && <span> · {unidade}</span>}
      </label>
      <div className="ajuste-linha">
        <button
          type="button"
          className="ajuste-botao"
          onClick={() => mudar(-passo)}
          disabled={valor === null || valor <= min}
          aria-label={`Diminuir ${rotulo.toLowerCase()} em ${formatarNumero(passo)}`}
        >
          <Minus size={26} strokeWidth={2.25} aria-hidden="true" />
        </button>
        <input
          id={id}
          className="ajuste-valor num"
          inputMode={decimal ? 'decimal' : 'numeric'}
          enterKeyHint="done"
          autoComplete="off"
          placeholder="—"
          value={texto}
          onFocus={(evento) => {
            setRascunho(texto)
            evento.currentTarget.select()
          }}
          onChange={(evento) => setRascunho(evento.currentTarget.value)}
          onBlur={confirmar}
          onKeyDown={(evento) => evento.key === 'Enter' && evento.currentTarget.blur()}
        />
        <button
          type="button"
          className="ajuste-botao"
          onClick={() => mudar(passo)}
          disabled={valor !== null && valor >= max}
          aria-label={`Aumentar ${rotulo.toLowerCase()} em ${formatarNumero(passo)}`}
        >
          <Plus size={26} strokeWidth={2.25} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
