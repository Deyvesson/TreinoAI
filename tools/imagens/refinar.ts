// Refinamento pontual por edição: parte de um quadro já gerado e pede só a correção.
// Uso: npm run imagens:refinar -- --id <exercicio> --base <1|2> --destino <1|2> --prompt "<o que mudar>"
// Ex.: aprofundar o quadro 2 do stiff e depois refazer o quadro 1 a partir dele.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { EXERCICIO_POR_ID } from '../../shared/exercicios.ts'
import { PASTA_BRUTAS, PASTA_SAIDA, chamar, lerFoundry } from './config.ts'
import { CONTINUIDADE } from './estilo.ts'
import { gerarRevisao } from './revisao.ts'

const lista = process.argv.slice(2)
const valor = (nome: string) => {
  const i = lista.indexOf(`--${nome}`)
  return i >= 0 ? lista[i + 1] : undefined
}
const id = valor('id')
const base = Number(valor('base'))
const destino = Number(valor('destino'))
const pedido = valor('prompt')
if (!id || !EXERCICIO_POR_ID.has(id) || ![1, 2].includes(base) || ![1, 2].includes(destino) || !pedido) {
  throw new Error('Uso: --id <exercicio> --base <1|2> --destino <1|2> --prompt "<o que mudar>"')
}

const prompt = `${CONTINUIDADE} ${pedido}`
const { imagem } = await lerFoundry()
const referencia = await readFile(path.join(PASTA_BRUTAS, `${id}-${base}.png`))

const formulario = new FormData()
formulario.append('model', imagem.deployment)
formulario.append('prompt', prompt)
formulario.append('size', '1024x1024')
formulario.append('image', new Blob([new Uint8Array(referencia)], { type: 'image/png' }), 'base.png')
const corpo = await chamar(`${imagem.endpoint}/openai/v1/images/edits`, {
  method: 'POST',
  headers: { 'api-key': imagem.apiKey },
  body: formulario,
})
const png = Buffer.from(corpo.data[0].b64_json, 'base64')

await mkdir(PASTA_SAIDA, { recursive: true })
await writeFile(path.join(PASTA_BRUTAS, `${id}-${destino}.png`), png)
const webp = path.join(PASTA_SAIDA, `${id}-${destino}.webp`)
await sharp(png).resize(768, 768).webp({ quality: 80, effort: 5 }).toFile(webp)
await writeFile(
  `${webp}.json`,
  JSON.stringify(
    { prompt, origin: `Refinamento por edição do quadro ${base} com ${imagem.deployment} (Azure AI Foundry, treinoai-foundry)`, createdAt: new Date().toISOString() },
    null,
    2,
  ) + '\n',
)
await gerarRevisao()
console.log(`Refinado: ${id}-${destino} a partir do quadro ${base}.`)
