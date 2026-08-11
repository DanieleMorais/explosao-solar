// Corrige datas de publicação retroativas: usa a data real de criação do arquivo.
// Uso: node scripts/corrigir-datas.js [--aplicar]

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const aplicar = process.argv.includes('--aplicar')

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

let corrigidas = 0

for (const lang of ['pt', 'en', 'es']) {
  const dir = lang === 'pt' ? path.join(ROOT, 'content', 'articles') : path.join(ROOT, 'content', lang, 'articles')
  if (!fs.existsSync(dir)) continue

  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue
    const p = path.join(dir, f)
    let a
    try {
      a = JSON.parse(fs.readFileSync(p, 'utf8'))
    } catch {
      continue
    }
    if (ORIGINAIS.has(a.slug)) continue

    const real = fs.statSync(p).birthtime
    const declarada = new Date(a.publishedAt)
    if (Math.abs(real - declarada) < 36 * 3600 * 1000) continue

    console.log(`${lang} ${a.slug.slice(0, 52).padEnd(52)} ${a.publishedAt.slice(0, 10)} → ${real.toISOString().slice(0, 10)}`)
    if (aplicar) {
      a.publishedAt = real.toISOString()
      fs.writeFileSync(p, JSON.stringify(a, null, 2))
    }
    corrigidas++
  }
}

console.log(`\n${corrigidas} datas ${aplicar ? 'corrigidas' : 'a corrigir (rode com --aplicar)'}`)
