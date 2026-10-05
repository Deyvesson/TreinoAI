// Página local de revisão (.preview/revisao.html): pares animados e estáticos, com aprovação por exercício.
// A página não grava nada sozinha: o botão copia o novo aprovados.json para colar em tools/imagens/.
import { mkdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { EXERCICIOS, type Exercicio } from '../../shared/exercicios.ts'
import { ARQ_APROVADOS, ARQ_POSES, ARQ_REVISAO, PASTA_SAIDA, lerJson, type Poses } from './config.ts'

const escapar = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

async function versao(arquivo: string): Promise<number | null> {
  try {
    return Math.round((await stat(arquivo)).mtimeMs)
  } catch {
    return null
  }
}

export async function gerarRevisao(): Promise<void> {
  const poses = await lerJson<Poses>(ARQ_POSES, {})
  const aprovados = new Set(await lerJson<string[]>(ARQ_APROVADOS, []))
  const relativo = path.relative(path.dirname(ARQ_REVISAO), PASTA_SAIDA).split(path.sep).join('/')

  const cartoes: string[] = []
  for (const e of EXERCICIOS as readonly Exercicio[]) {
    const v1 = await versao(path.join(PASTA_SAIDA, `${e.id}-1.webp`))
    if (v1 === null) continue
    const v2 = await versao(path.join(PASTA_SAIDA, `${e.id}-2.webp`))
    const src1 = `${relativo}/${e.id}-1.webp?v=${v1}`
    const src2 = v2 === null ? null : `${relativo}/${e.id}-2.webp?v=${v2}`
    const pose = poses[e.id]
    cartoes.push(`
    <article class="cartao" data-id="${e.id}">
      <div class="anim">
        <img src="${src1}" alt="${escapar(e.nome)}, posição inicial" loading="lazy">
        ${src2 ? `<img class="b" src="${src2}" alt="${escapar(e.nome)}, posição final" loading="lazy">` : ''}
      </div>
      <div class="quadros">
        <img src="${src1}" alt="" loading="lazy">
        ${src2 ? `<img src="${src2}" alt="" loading="lazy">` : '<span class="unico">quadro único</span>'}
      </div>
      <h2>${escapar(e.nome)}</h2>
      <p class="meta">${e.id} · ${e.grupo}${e.unilateral ? ' · unilateral' : ''}${pose ? ` · câmera ${pose.camera}` : ''}</p>
      ${pose ? `<p class="pose"><b>Início:</b> ${escapar(pose.inicio)}</p>${pose.fim ? `<p class="pose"><b>Fim:</b> ${escapar(pose.fim)}</p>` : ''}` : ''}
      <label class="aprovar"><input type="checkbox" ${aprovados.has(e.id) ? 'checked' : ''}> Aprovado</label>
    </article>`)
  }

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Revisão das imagens dos exercícios</title>
<style>
  :root { color-scheme: dark; --bg: #111214; --fg: #eceef1; --muted: #a3a8b0; --linha: #2a2d33; --ok: #7dd3a0; --foco: #8fb8ff; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif; }
  header { position: sticky; top: 0; z-index: 1; display: flex; flex-wrap: wrap; gap: .75rem; align-items: center; padding: 1rem 1.25rem; background: var(--bg); border-bottom: 1px solid var(--linha); }
  header h1 { font-size: 1.125rem; margin: 0 auto 0 0; }
  .contagem { color: var(--muted); font-variant-numeric: tabular-nums; }
  button, select { font: inherit; min-height: 2.5rem; padding: 0 .9rem; border-radius: .5rem; border: 1px solid var(--linha); background: #1b1d21; color: var(--fg); cursor: pointer; }
  button.principal { background: var(--fg); color: var(--bg); border-color: var(--fg); font-weight: 600; }
  :focus-visible { outline: 2px solid var(--foco); outline-offset: 2px; }
  main { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem; padding: 1.25rem; }
  .cartao { border: 1px solid var(--linha); border-radius: .75rem; padding: .75rem; }
  .cartao.ok { border-color: var(--ok); }
  .anim { position: relative; aspect-ratio: 1; border-radius: .5rem; overflow: hidden; background: #222; }
  .anim img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .anim .b { animation: alterna 2.4s ease-in-out infinite; }
  @keyframes alterna { 0%, 35% { opacity: 0 } 50%, 85% { opacity: 1 } 100% { opacity: 0 } }
  @media (prefers-reduced-motion: reduce) { .anim .b { animation: none; opacity: 0 } }
  .quadros { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; margin-top: .5rem; }
  .quadros img { width: 100%; border-radius: .375rem; display: block; }
  .unico { display: grid; place-items: center; color: var(--muted); font-size: .875rem; border: 1px dashed var(--linha); border-radius: .375rem; }
  h2 { font-size: 1rem; margin: .75rem 0 0; }
  .meta { margin: .125rem 0 .5rem; color: var(--muted); font-size: .8125rem; }
  .pose { margin: .25rem 0; font-size: .8125rem; color: var(--muted); }
  .pose b { color: var(--fg); font-weight: 600; }
  .aprovar { display: flex; gap: .5rem; align-items: center; margin-top: .75rem; font-weight: 600; cursor: pointer; }
  .aprovar input { width: 1.25rem; height: 1.25rem; accent-color: var(--ok); }
  .oculto { display: none; }
</style>
</head>
<body>
<header>
  <h1>Revisão das imagens</h1>
  <span class="contagem" id="contagem"></span>
  <select id="filtro" aria-label="Filtrar">
    <option value="todos">Todos</option>
    <option value="pendentes">Pendentes</option>
    <option value="aprovados">Aprovados</option>
  </select>
  <button type="button" id="copiar-refazer">Copiar IDs para refazer</button>
  <button type="button" class="principal" id="copiar-aprovados">Copiar aprovados.json</button>
</header>
<main>${cartoes.join('') || '<p>Nenhuma imagem gerada ainda. Rode <code>npm run imagens:gerar</code>.</p>'}</main>
<script>
  const chave = 'revisao-${Date.now()}'
  const cartoes = [...document.querySelectorAll('.cartao')]
  const salvo = JSON.parse(localStorage.getItem(chave) || 'null')
  const caixa = (c) => c.querySelector('input')
  if (salvo) cartoes.forEach((c) => (caixa(c).checked = salvo.includes(c.dataset.id)))
  const aprovados = () => cartoes.filter((c) => caixa(c).checked).map((c) => c.dataset.id)
  function atualizar() {
    const filtro = document.getElementById('filtro').value
    cartoes.forEach((c) => {
      const ok = caixa(c).checked
      c.classList.toggle('ok', ok)
      c.classList.toggle('oculto', (filtro === 'pendentes' && ok) || (filtro === 'aprovados' && !ok))
    })
    document.getElementById('contagem').textContent = aprovados().length + ' de ' + cartoes.length + ' aprovados'
    localStorage.setItem(chave, JSON.stringify(aprovados()))
  }
  async function copiar(botao, texto, rotulo) {
    await navigator.clipboard.writeText(texto)
    botao.textContent = 'Copiado'
    setTimeout(() => (botao.textContent = rotulo), 1500)
  }
  document.addEventListener('change', atualizar)
  document.getElementById('copiar-aprovados').addEventListener('click', (ev) =>
    copiar(ev.currentTarget, JSON.stringify(aprovados(), null, 2) + '\\n', 'Copiar aprovados.json'))
  document.getElementById('copiar-refazer').addEventListener('click', (ev) =>
    copiar(ev.currentTarget, cartoes.filter((c) => !caixa(c).checked).map((c) => c.dataset.id).join(','), 'Copiar IDs para refazer'))
  atualizar()
</script>
</body>
</html>
`
  await mkdir(path.dirname(ARQ_REVISAO), { recursive: true })
  await writeFile(ARQ_REVISAO, html)
}
