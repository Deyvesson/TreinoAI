// Etapa 4: copia só os exercícios aprovados para o app e escreve o manifesto que o app importa.
// O manifesto guarda quantos quadros cada exercício tem e um hash para invalidar o cache offline.
import { createHash } from 'node:crypto'
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { EXERCICIO_POR_ID, EXERCICIOS, type Exercicio } from '../../shared/exercicios.ts'
import { ARQ_APROVADOS, ARQ_MANIFESTO, PASTA_PUBLICA, PASTA_SAIDA, lerJson } from './config.ts'

interface ItemManifesto {
  quadros: 1 | 2
  v: string
}

const aprovados = new Set(await lerJson<string[]>(ARQ_APROVADOS, []))
const desconhecidos = [...aprovados].filter((id) => !EXERCICIO_POR_ID.has(id))
if (desconhecidos.length) throw new Error(`IDs fora do catálogo em aprovados.json: ${desconhecidos.join(', ')}`)

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
  const hash = createHash('sha256')
  for (const [i, conteudo] of conteudos.entries()) {
    if (!conteudo) continue
    await copyFile(path.join(PASTA_SAIDA, arquivos[i]), path.join(PASTA_PUBLICA, arquivos[i]))
    publicados.add(arquivos[i])
    hash.update(conteudo)
  }
  manifesto[e.id] = { quadros: conteudos[1] ? 2 : 1, v: hash.digest('hex').slice(0, 8) }
}

// Remove do app o que deixou de estar aprovado.
for (const arquivo of await readdir(PASTA_PUBLICA)) {
  if (arquivo.endsWith('.webp') && !publicados.has(arquivo)) await rm(path.join(PASTA_PUBLICA, arquivo))
}

await writeFile(ARQ_MANIFESTO, JSON.stringify(manifesto, null, 2) + '\n')
console.log(`Publicados ${Object.keys(manifesto).length} exercício(s) em app/public/exercicios/.`)
if (faltando.length) {
  console.log(`Aprovados sem imagem gerada (ignorados): ${faltando.join(', ')}`)
  process.exitCode = 1
}
