import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const PASTA = path.join(RAIZ, 'tools/imagens')
export const ARQ_POSES = path.join(PASTA, 'poses.json')
export const ARQ_APROVADOS = path.join(PASTA, 'aprovados.json')
/** PNG originais do modelo (fora do Git). O quadro 1 é a referência para editar o quadro 2. */
export const PASTA_BRUTAS = path.join(PASTA, '.brutas')
/** WebP candidatos, aguardando revisão (fora do Git). */
export const PASTA_SAIDA = path.join(PASTA, '.saida')
export const PASTA_PUBLICA = path.join(RAIZ, 'app/public/exercicios')
export const ARQ_MANIFESTO = path.join(RAIZ, 'app/src/gerado/imagens-exercicios.json')
export const ARQ_REVISAO = path.join(RAIZ, '.preview/revisao.html')

export interface Pose {
  camera: 'lateral' | 'frontal' | 'diagonal'
  inicio: string
  /** null = um quadro só (isometrias). */
  fim: string | null
  /**
   * Gera primeiro o quadro final (a pose difícil) e edita para o inicial. Útil quando algo rígido muda
   * de ângulo (barra que gira num apoio) ou quando a amplitude final é grande demais para uma edição.
   */
  inverso?: boolean
  /**
   * Exercícios alternados (um lado e depois o outro): o quadro 2 é o espelho horizontal do quadro 1,
   * sem nova geração. A câmera deve olhar ao longo do corpo para a pessoa não mudar de lugar.
   */
  espelho?: boolean
}
export type Poses = Record<string, Pose>

export interface Destino {
  endpoint: string
  apiKey: string
  deployment: string
}

async function lerEnvLocal(): Promise<Record<string, string>> {
  try {
    const texto = await readFile(path.join(RAIZ, 'tools/.env.local'), 'utf8')
    return Object.fromEntries(
      texto
        .split(/\r?\n/)
        .map((linha) => linha.trim())
        .filter((linha) => linha && !linha.startsWith('#') && linha.includes('='))
        .map((linha) => [linha.slice(0, linha.indexOf('=')).trim(), linha.slice(linha.indexOf('=') + 1).trim()]),
    )
  } catch {
    return {}
  }
}

async function lerSettingsDaApi(): Promise<Record<string, string>> {
  try {
    return JSON.parse(await readFile(path.join(RAIZ, 'api/local.settings.json'), 'utf8')).Values ?? {}
  } catch {
    return {}
  }
}

// Precedência: variável de ambiente > tools/.env.local > api/local.settings.json.
// O destino de imagem pode apontar para outro recurso (FOUNDRY_IMAGE_*); sem isso, usa o mesmo do texto.
export async function lerFoundry(): Promise<{ texto: Destino; imagem: Destino }> {
  const [envLocal, api] = await Promise.all([lerEnvLocal(), lerSettingsDaApi()])
  const v = (nome: string) => process.env[nome] || envLocal[nome] || api[nome] || undefined
  const endpoint = v('FOUNDRY_ENDPOINT')
  const apiKey = v('FOUNDRY_API_KEY')
  if (!endpoint || !apiKey) {
    throw new Error('Defina FOUNDRY_ENDPOINT e FOUNDRY_API_KEY (ambiente, tools/.env.local ou api/local.settings.json).')
  }
  const limpar = (url: string) => url.replace(/\/+$/, '')
  return {
    texto: { endpoint: limpar(endpoint), apiKey, deployment: v('FOUNDRY_DEPLOYMENT') ?? 'gpt-6-luna' },
    imagem: {
      endpoint: limpar(v('FOUNDRY_IMAGE_ENDPOINT') ?? endpoint),
      apiKey: v('FOUNDRY_IMAGE_API_KEY') ?? apiKey,
      deployment: v('FOUNDRY_IMAGE_DEPLOYMENT') ?? 'gpt-image-2.5',
    },
  }
}

export async function lerJson<T>(arquivo: string, padrao: T): Promise<T> {
  try {
    return JSON.parse(await readFile(arquivo, 'utf8')) as T
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code === 'ENOENT') return padrao
    throw erro
  }
}

export function argumentos() {
  const lista = process.argv.slice(2)
  const valor = (nome: string) => {
    const i = lista.indexOf(`--${nome}`)
    return i >= 0 ? lista[i + 1] : undefined
  }
  return {
    ids: valor('ids')
      ?.split(',')
      .map((id) => id.trim())
      .filter(Boolean),
    forcar: lista.includes('--forcar'),
    /** `--quadro 2`: refaz só o quadro 2, reaproveitando o quadro 1 já gerado. */
    soQuadro2: valor('quadro') === '2',
    /** `--inverso`: força a ordem inversa (ver Pose.inverso) para os IDs desta execução. */
    inverso: lista.includes('--inverso'),
    paralelo: Math.max(1, Number(valor('paralelo') ?? 4)),
  }
}

export async function emParalelo<T>(itens: readonly T[], limite: number, tarefa: (item: T) => Promise<void>) {
  let proximo = 0
  const trabalhador = async () => {
    while (proximo < itens.length) await tarefa(itens[proximo++])
  }
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, trabalhador))
}

// 429 e 5xx são temporários: espera (respeitando Retry-After) e tenta de novo.
export async function chamar(url: string, init: RequestInit, tentativas = 5): Promise<any> {
  for (let n = 1; ; n++) {
    const resposta = await fetch(url, init)
    const corpo = await resposta.json().catch(() => ({}))
    if (resposta.ok) return corpo
    const temporario = resposta.status === 429 || resposta.status >= 500
    if (!temporario || n >= tentativas) {
      throw new Error(`${resposta.status}: ${JSON.stringify(corpo).slice(0, 300)}`)
    }
    const espera = Number(resposta.headers.get('retry-after')) * 1000 || Math.min(60_000, 2_000 * 2 ** n)
    await new Promise((resolver) => setTimeout(resolver, espera))
  }
}

export function ordenarPeloCatalogo<T>(registro: Record<string, T>, ordem: readonly string[]): Record<string, T> {
  return Object.fromEntries(ordem.filter((id) => id in registro).map((id) => [id, registro[id]]))
}
