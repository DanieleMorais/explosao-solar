// Remove matérias duplicadas apontadas pela auditoria editorial, nos 3 idiomas,
// e registra a pauta como usada para o robô não gerá-la de novo.
// Uso: node scripts/remover-duplicatas.js <slug> [<slug>...] [--aplicar]

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const CONTENT = path.join(ROOT, 'content')
const STATE_FILE = path.join(CONTENT, 'semear-state.json')

const ORIGINAIS = new Set([
  'como-funcionam-onu-e-conselho-de-seguranca', 'o-que-sao-os-brics-e-por-que-importam-para-o-brasil',
  'como-funciona-o-sus-e-por-que-e-unico-no-mundo', 'amazonia-e-economia-verde-o-que-esta-em-jogo',
  'como-funciona-o-sistema-eleitoral-brasileiro', 'tres-poderes-o-que-faz-cada-um-e-como-se-equilibram',
  'como-a-taxa-selic-afeta-sua-vida', 'renda-fixa-vs-renda-variavel-guia-para-iniciantes',
  'como-funciona-inteligencia-artificial-generativa', 'guia-seguranca-digital-golpes-comuns-brasil',
  'explosoes-solares-tempestades-geomagneticas', 'mudancas-climaticas-ciencia-brasil',
  'economia-exportacao-talentos-futebol-brasileiro', 'ciencia-alto-rendimento-atletas-olimpicos',
  'quem-ganha-e-quem-perde-na-era-do-streaming', 'do-samba-ao-oscar-a-forca-da-cultura-brasileira-no-mundo',
])

const aplicar = process.argv.includes('--aplicar')
const slugs = process.argv.slice(2).filter((a) => !a.startsWith('--'))

if (!slugs.length) {
  console.error('informe ao menos um slug')
  process.exit(1)
}

const protegidos = slugs.filter((s) => ORIGINAIS.has(s))
if (protegidos.length) {
  console.error('RECUSADO: estes slugs são matérias originais e não podem ser removidos:\n  ' + protegidos.join('\n  '))
  process.exit(1)
}

const state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : { pautas: {}, usadas: {} }
let removidos = 0

for (const slug of slugs) {
  const ptPath = path.join(CONTENT, 'articles', slug + '.json')
  if (!fs.existsSync(ptPath)) {
    console.log(`ausente (ignorado): ${slug}`)
    continue
  }
  const art = JSON.parse(fs.readFileSync(ptPath, 'utf8'))

  for (const lang of ['pt', 'en', 'es']) {
    const p = lang === 'pt' ? ptPath : path.join(CONTENT, lang, 'articles', slug + '.json')
    if (!fs.existsSync(p)) continue
    console.log(`  remove [${lang}] ${slug}`)
    if (aplicar) fs.unlinkSync(p)
  }

  // marca o tema como já coberto para o gerador de pautas não repetir
  const cat = art.categorySlug
  state.usadas[cat] = state.usadas[cat] || []
  if (!state.usadas[cat].includes(art.title)) state.usadas[cat].push(art.title)
  removidos++
}

if (aplicar) fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
console.log(`\n${removidos} matéria(s) ${aplicar ? 'removidas dos 3 idiomas' : 'a remover (rode com --aplicar)'}`)
