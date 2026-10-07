// Etapa 4: copia só os exercícios aprovados para o app e escreve o manifesto que o app importa.
// O manifesto guarda quantos quadros cada exercício tem e um hash para invalidar o cache offline.
// Cada imagem publicada leva sua proveniência em `<imagem>.webp.json` (prompt exato e origem).
import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { EXERCICIO_POR_ID, EXERCICIOS, type Exercicio } from '../../shared/exercicios.ts'
import { ARQ_APROVADOS, ARQ_MANIFESTO, ARQ_POSES, PASTA_PUBLICA, PASTA_SAIDA, lerFoundry, lerJson, type Poses } from './config.ts'
import { promptsDoExercicio, proveniencia } from './prompts.ts'

// Clareia só o fundo quase branco (rampa suave entre CLARO e BRANCO no canal mais escuro do pixel),
// para a imagem fundir com a célula branca do app sem tocar na figura nem apagar a sombra de contato.
const CLARO = 218
const BRANCO = 238
const POS_PROCESSAMENTO = `fundo clareado na publicação: pixels com canal mínimo acima de ${CLARO} levados gradualmente ao branco puro (#FFFFFF) até ${BRANCO}`

async function clarearFundo(webp: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(webp).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += 3) {
    const minimo = Math.min(data[i], data[i + 1], data[i + 2])
    if (minimo <= CLARO) continue
    const t = Math.min(1, (minimo - CLARO) / (BRANCO - CLARO))
    for (let k = 0; k < 3; k++) data[i + k] = Math.round(data[i + k] + (255 - data[i + k]) * t)
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } }).webp({ quality: 80, effort: 5 }).toBuffer()
}

interface ItemManifesto {
  quadros: 1 | 2
  v: string
}

const aprovados = new Set(await lerJson<string[]>(ARQ_APROVADOS, []))
const desconhecidos = [...aprovados].filter((id) => !EXERCICIO_POR_ID.has(id))
if (desconhecidos.length) throw new Error(`IDs fora do catálogo em aprovados.json: ${desconhecidos.join(', ')}`)

const poses = await lerJson<Poses>(ARQ_POSES, {})
const { imagem } = await lerFoundry().catch(() => ({ imagem: { deployment: 'gpt-image-2.5' } }))

await mkdir(PASTA_PUBLICA, { recursive: true })
await mkdir(path.dirname(ARQ_MANIFESTO), { recursive: true })

const manifesto: Record<string, ItemManifesto> = {}
const publicados = new Set<string>()
const faltando: string[] = []

for (const e of EXERCICIOS as readonly Exercicio[]) {
  if (!aprovados.has(e.id)) continue
  const arquivos = [`${e.id}-1.webp`, `${e.id}-2.webp`]
  const conteudos = await Promise.all(arquivos.map((a) => readFile(path.join(PASTA_SAIDA, a)).catch(() => null)))
  if (!conteudos[0]) {
    faltando.push(e.id)
    continue
  }
  const prompts = poses[e.id] ? promptsDoExercicio(e, poses[e.id]) : null
  const hash = createHash('sha256')
  for (const [i, conteudo] of conteudos.entries()) {
    if (!conteudo) continue
    const quadro = (i + 1) as 1 | 2
    const origem = path.join(PASTA_SAIDA, arquivos[i])
    const destino = path.join(PASTA_PUBLICA, arquivos[i])
    const final = await clarearFundo(conteudo)
    await writeFile(destino, final)
    // Gerações anteriores à proveniência automática: reconstrói o prompt a partir do estilo e das poses atuais.
    const sidecar = await readFile(`${origem}.json`, 'utf8').catch(() => null)
    const prompt = quadro === 1 ? prompts?.inicial : prompts?.final
    const registro = JSON.parse(sidecar ?? proveniencia(prompt ?? `Exercício ${e.nome}, quadro ${quadro}`, imagem.deployment, quadro))
    await writeFile(`${destino}.json`, JSON.stringify({ ...registro, postprocess: POS_PROCESSAMENTO }, null, 2) + '\n')
    publicados.add(arquivos[i])
    hash.update(final)
  }
  manifesto[e.id] = { quadros: conteudos[1] ? 2 : 1, v: hash.digest('hex').slice(0, 8) }
}

// Remove do app o que deixou de estar aprovado (imagem e proveniência).
for (const arquivo of await readdir(PASTA_PUBLICA)) {
  const imagemDoArquivo = arquivo.replace(/\.json$/, '')
  if (imagemDoArquivo.endsWith('.webp') && !publicados.has(imagemDoArquivo)) await rm(path.join(PASTA_PUBLICA, arquivo))
}

await writeFile(ARQ_MANIFESTO, JSON.stringify(manifesto, null, 2) + '\n')
console.log(`Publicados ${Object.keys(manifesto).length} exercício(s) em app/public/exercicios/.`)
if (faltando.length) {
  console.log(`Aprovados sem imagem gerada (ignorados): ${faltando.join(', ')}`)
  process.exitCode = 1
}
