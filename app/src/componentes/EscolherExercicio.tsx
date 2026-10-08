import { Check, ChevronLeft, Plus, Search, X } from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import type { Exercicio, Medida } from '../../../shared/exercicios'
import {
  buscarExercicios,
  criarExercicioPessoal,
  ehPessoal,
  existeComNome,
  OPCOES_MEDIDA,
  ROTULO_GRUPO,
} from '../dados/catalogo'
import { miniaturaDe } from '../dados/imagens'

interface Props {
  titulo: string
  /** Exercícios que já estão no treino: aparecem, mas não podem ser escolhidos de novo. */
  jaNoTreino: readonly string[]
  onEscolher: (exercicio: Exercicio) => void
  onFechar: () => void
}

/**
 * Tela cheia de escolha: a lista filtra enquanto digita (sem acento, nomes e apelidos).
 * Sem resultado exato, oferece criar o exercício com o nome digitado; ele entra sem imagem.
 */
export function EscolherExercicio({ titulo, jaNoTreino, onEscolher, onFechar }: Props) {
  const idTitulo = useId()
  const [texto, setTexto] = useState('')
  const [criando, setCriando] = useState<string | null>(null)
  const [medida, setMedida] = useState<Medida>('carga-reps')
  const [unilateral, setUnilateral] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const resultados = useMemo(() => buscarExercicios(texto), [texto])
  const nome = texto.trim().replace(/\s+/g, ' ')
  const podeCriar = nome.length >= 2 && !existeComNome(nome)

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key !== 'Escape') return
      if (criando) setCriando(null)
      else onFechar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [criando, onFechar])

  async function criar() {
    if (!criando || salvando) return
    setSalvando(true)
    try {
      onEscolher(await criarExercicioPessoal(criando, medida, unilateral))
    } finally {
      setSalvando(false)
    }
  }

  if (criando) {
    return (
      <div className="escolher" role="dialog" aria-modal="true" aria-labelledby={idTitulo}>
        <header className="escolher-topo">
          <button type="button" className="botao-icone" aria-label="Voltar à busca" onClick={() => setCriando(null)}>
            <ChevronLeft size={26} aria-hidden="true" />
          </button>
        </header>
        <div className="escolher-corpo">
          <h2 id={idTitulo} className="escolher-titulo">
            Como registrar “{criando}”?
          </h2>
          <p className="escolher-texto">Ele entra no treino sem imagem de execução e aparece nas próximas buscas.</p>
          <div className="opcoes" role="radiogroup" aria-label="Forma de registro">
            {OPCOES_MEDIDA.map((opcao) => {
              const marcada = medida === opcao.medida
              return (
                <label key={opcao.medida} className="opcao" data-marcada={marcada ? '' : undefined} data-sem-posicao="">
                  <input
                    type="radio"
                    name="medida"
                    className="sr-only"
                    checked={marcada}
                    onChange={() => setMedida(opcao.medida)}
                  />
                  <span className="opcao-faixa" aria-hidden="true" />
                  <span className="opcao-texto">
                    <span className="opcao-titulo">{opcao.titulo}</span>
                    <span className="opcao-detalhe">{opcao.detalhe}</span>
                  </span>
                  <Check className="opcao-marca" size={22} strokeWidth={2.5} aria-hidden="true" />
                </label>
              )
            })}
          </div>
          {medida !== 'distancia-tempo' && (
            <label className="interruptor escolher-lado">
              <input
                type="checkbox"
                checked={unilateral}
                onChange={(evento) => setUnilateral(evento.currentTarget.checked)}
              />
              <span>Um lado de cada vez (registro por lado)</span>
            </label>
          )}
        </div>
        <div className="hoje-base">
          <button type="button" className="botao botao-primario botao-largo" onClick={criar} disabled={salvando}>
            Criar e adicionar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="escolher" role="dialog" aria-modal="true" aria-labelledby={idTitulo}>
      <header className="escolher-topo">
        <button type="button" className="botao-icone" aria-label="Fechar" onClick={onFechar}>
          <X size={24} aria-hidden="true" />
        </button>
        <h2 id={idTitulo} className="escolher-topo-titulo">
          {titulo}
        </h2>
        <div className="escolher-busca">
          <Search size={20} aria-hidden="true" />
          <input
            type="search"
            // Tela aberta por um toque explícito em "Adicionar" ou "Trocar": o teclado já pode subir.
            autoFocus
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Buscar ou criar exercício"
            aria-label="Buscar exercício"
            value={texto}
            onChange={(evento) => setTexto(evento.currentTarget.value)}
          />
        </div>
      </header>
      <ul className="escolher-lista">
        {resultados.map((e) => {
          const repetido = jaNoTreino.includes(e.id)
          const miniatura = miniaturaDe(e.id)
          return (
            <li key={e.id}>
              <button type="button" className="escolher-item" disabled={repetido} onClick={() => onEscolher(e)}>
                <span className="escolher-miniatura" aria-hidden="true">
                  {miniatura && <img src={miniatura} alt="" width={56} height={56} loading="lazy" />}
                </span>
                <span className="escolher-item-texto">
                  <span className="escolher-item-nome">{e.nome}</span>
                  <span className="escolher-item-detalhe">
                    {repetido ? 'Já está neste treino' : ehPessoal(e.id) ? 'Criado por você' : ROTULO_GRUPO[e.grupo]}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
        {podeCriar && (
          <li>
            <button type="button" className="escolher-item escolher-criar" onClick={() => setCriando(nome)}>
              <span className="escolher-miniatura" aria-hidden="true">
                <Plus size={24} strokeWidth={2.25} />
              </span>
              <span className="escolher-item-texto">
                <span className="escolher-item-nome">Criar “{nome}”</span>
                <span className="escolher-item-detalhe">
                  {resultados.length ? 'Não é nenhum desses' : 'Não está no catálogo'} · entra sem imagem
                </span>
              </span>
            </button>
          </li>
        )}
      </ul>
      {!resultados.length && !podeCriar && (
        <p className="escolher-texto escolher-vazio">Digite pelo menos duas letras.</p>
      )}
    </div>
  )
}
