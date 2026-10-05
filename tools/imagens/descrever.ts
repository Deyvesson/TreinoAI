// Etapa 1: o modelo de texto descreve a posição inicial e a final de cada exercício.
// O resultado (poses.json) é versionado e pode ser editado à mão antes de gerar as imagens.
import { writeFile } from 'node:fs/promises'
import { EXERCICIOS, type Equipamento, type Exercicio } from '../../shared/exercicios.ts'
import {
  ARQ_POSES,
  argumentos,
  chamar,
  emParalelo,
  lerFoundry,
  lerJson,
  ordenarPeloCatalogo,
  type Pose,
  type Poses,
} from './config.ts'

const EQUIPAMENTO_EN: Record<Equipamento, string> = {
  barra: 'barbell',
  halteres: 'dumbbells',
  kettlebell: 'kettlebell',
  maquina: 'weight machine',
  polia: 'cable machine',
  smith: 'Smith machine',
  banco: 'adjustable bench',
  'barra-fixa': 'pull-up bar',
  paralelas: 'parallel dip bars',
  elastico: 'resistance band',
  caixa: 'plyo box',
  corda: 'jump rope',
  'roda-abdominal': 'ab wheel',
  esteira: 'treadmill',
  'bicicleta-ergometrica': 'stationary bike',
  'remo-ergometrico': 'rowing machine',
  eliptico: 'elliptical trainer',
  'escada-ergometrica': 'stair climber machine',
}

const INSTRUCOES = `You write pose descriptions for an image model that illustrates gym exercises for a Brazilian fitness app.
Return the starting position ("inicio") and the end or peak position ("fim") of ONE repetition, with correct and safe technique.
- Be concrete: stance, grip, joint angles, spine and head position, and exactly where the equipment is relative to the body.
- "fim" is null only for static holds (plank, side plank, wall sit, hollow hold) where one frame shows everything.
- Cardio (running, rowing, cycling, elliptical, stairs, jump rope): "inicio" and "fim" are two contrasting phases of the cycle.
- Unilateral exercises: the right side works.
- Pick the camera that makes the movement easiest to read: usually "lateral"; "frontal" for movements in the frontal plane (lateral raises, abduction, jumping jacks); "diagonal" when depth matters.
- Use only the listed equipment. If the list is empty, it is bodyweight only.
- English, one or two sentences each. No brand names, no text, no mention of the camera inside the pose texts.`

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['camera', 'inicio', 'fim'],
  properties: {
    camera: { type: 'string', enum: ['lateral', 'frontal', 'diagonal'] },
    inicio: { type: 'string' },
    fim: { type: ['string', 'null'] },
  },
}

const { ids, forcar, paralelo } = argumentos()
const { texto } = await lerFoundry()
const poses = await lerJson<Poses>(ARQ_POSES, {})
const alvo = EXERCICIOS.filter((e: Exercicio) => (ids ? ids.includes(e.id) : forcar || !poses[e.id]))
const falhas: string[] = []
console.log(`Descrevendo ${alvo.length} exercício(s) com ${texto.deployment}…`)

try {
  await emParalelo(alvo, paralelo, async (e: Exercicio) => {
    try {
      const corpo = await chamar(`${texto.endpoint}/openai/v1/chat/completions`, {
        method: 'POST',
        headers: { 'api-key': texto.apiKey, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: texto.deployment,
          messages: [
            { role: 'system', content: INSTRUCOES },
            {
              role: 'user',
              content: JSON.stringify({
                exercise_pt_br: e.nome,
                also_known_as: e.apelidos ?? [],
                primary_muscle: e.grupo,
                equipment: e.equipamento.map((item) => EQUIPAMENTO_EN[item]),
                unilateral: e.unilateral ?? false,
                logged_as: e.medida,
              }),
            },
          ],
          response_format: { type: 'json_schema', json_schema: { name: 'pose', strict: true, schema: SCHEMA } },
          max_completion_tokens: 1200,
        }),
      })
      poses[e.id] = JSON.parse(corpo.choices[0].message.content) as Pose
      console.log(`  ✓ ${e.id}`)
    } catch (erro) {
      falhas.push(e.id)
      console.error(`  ✗ ${e.id}: ${(erro as Error).message}`)
    }
  })
} finally {
  const ordem = EXERCICIOS.map((e: Exercicio) => e.id)
  await writeFile(ARQ_POSES, JSON.stringify(ordenarPeloCatalogo(poses, ordem), null, 2) + '\n')
}

console.log(`Pronto: ${alvo.length - falhas.length} descrito(s), ${falhas.length} falha(s). Arquivo: tools/imagens/poses.json`)
if (falhas.length) {
  console.log(`Para tentar de novo: npm run imagens:descrever -- --ids ${falhas.join(',')}`)
  process.exitCode = 1
}
