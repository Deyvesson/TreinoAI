// Etapa 2: gera os quadros de cada exercício descrito em poses.json.
// O quadro 1 nasce do prompt; o quadro 2 é uma edição do quadro 1, para manter pessoa, roupa e cenário.
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { EXERCICIOS, type Exercicio } from '../../shared/exercicios.ts'
import {
  ARQ_POSES,
  PASTA_BRUTAS,
  PASTA_SAIDA,
  argumentos,
  chamar,
  emParalelo,
  lerFoundry,
  lerJson,
  type Destino,
  type Poses,
} from './config.ts'
import { promptsDoExercicio, proveniencia } from './prompts.ts'
import { gerarRevisao } from './revisao.ts'

const LADO_FINAL = 768

const existe = (arquivo: string) =>
  access(arquivo).then(
    () => true,
    () => false,
  )

async function gerarImagem(destino: Destino, prompt: string): Promise<Buffer> {
  const corpo = await chamar(`${destino.endpoint}/openai/v1/images/generations`, {
    method: 'POST',
    headers: { 'api-key': destino.apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({ model: destino.deployment, prompt, size: '1024x1024', n: 1 }),
  })
  return Buffer.from(corpo.data[0].b64_json, 'base64')
}

async function editarImagem(destino: Destino, referencia: Buffer, prompt: string): Promise<Buffer> {
  const formulario = new FormData()
  formulario.append('model', destino.deployment)
  formulario.append('prompt', prompt)
  formulario.append('size', '1024x1024')
  formulario.append('image', new Blob([new Uint8Array(referencia)], { type: 'image/png' }), 'quadro-1.png')
  const corpo = await chamar(`${destino.endpoint}/openai/v1/images/edits`, {
    method: 'POST',
    headers: { 'api-key': destino.apiKey },
    body: formulario,
  })
  return Buffer.from(corpo.data[0].b64_json, 'base64')
}

async function salvar(id: string, quadro: 1 | 2, png: Buffer, prompt: string, modelo: string) {
  await writeFile(path.join(PASTA_BRUTAS, `${id}-${quadro}.png`), png)
  const webp = path.join(PASTA_SAIDA, `${id}-${quadro}.webp`)
  await sharp(png).resize(LADO_FINAL, LADO_FINAL).webp({ quality: 80, effort: 5 }).toFile(webp)
  await writeFile(`${webp}.json`, proveniencia(prompt, modelo, quadro))
}

const { ids, forcar, soQuadro2, paralelo } = argumentos()
const { imagem } = await lerFoundry()
const poses = await lerJson<Poses>(ARQ_POSES, {})
await mkdir(PASTA_BRUTAS, { recursive: true })
await mkdir(PASTA_SAIDA, { recursive: true })

const semPose = EXERCICIOS.filter((e: Exercicio) => !poses[e.id] && (!ids || ids.includes(e.id))).map((e) => e.id)
if (semPose.length) console.warn(`Sem pose (rode imagens:descrever antes): ${semPose.join(', ')}`)

const candidatos = EXERCICIOS.filter((e: Exercicio) => poses[e.id] && (!ids || ids.includes(e.id)))
const alvo: Exercicio[] = []
for (const e of candidatos) {
  const quadros = poses[e.id].fim ? [1, 2] : [1]
  const prontos = await Promise.all(quadros.map((q) => existe(path.join(PASTA_SAIDA, `${e.id}-${q}.webp`))))
  if (forcar || soQuadro2 || !prontos.every(Boolean)) alvo.push(e)
}

const falhas: string[] = []
console.log(`Gerando ${alvo.length} exercício(s) com ${imagem.deployment} (${paralelo} em paralelo)…`)

await emParalelo(alvo, paralelo, async (e: Exercicio) => {
  const pose = poses[e.id]
  const prompts = promptsDoExercicio(e, pose)
  const inicio = Date.now()
  try {
    const bruta1 = path.join(PASTA_BRUTAS, `${e.id}-1.png`)
    let quadro1: Buffer
    if (soQuadro2 || (!forcar && (await existe(bruta1)))) {
      quadro1 = await readFile(bruta1)
      if (!(await existe(path.join(PASTA_SAIDA, `${e.id}-1.webp`)))) await salvar(e.id, 1, quadro1, prompts.inicial, imagem.deployment)
    } else {
      quadro1 = await gerarImagem(imagem, prompts.inicial)
      await salvar(e.id, 1, quadro1, prompts.inicial, imagem.deployment)
    }
    if (prompts.final) {
      await salvar(e.id, 2, await editarImagem(imagem, quadro1, prompts.final), prompts.final, imagem.deployment)
    }
    console.log(`  ✓ ${e.id} (${Math.round((Date.now() - inicio) / 1000)}s)`)
  } catch (erro) {
    falhas.push(e.id)
    console.error(`  ✗ ${e.id}: ${(erro as Error).message}`)
  }
})

await gerarRevisao()
console.log(`Pronto: ${alvo.length - falhas.length} gerado(s), ${falhas.length} falha(s). Revise em .preview/revisao.html`)
if (falhas.length) {
  console.log(`Para tentar de novo: npm run imagens:gerar -- --ids ${falhas.join(',')}`)
  process.exitCode = 1
}
