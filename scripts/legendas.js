// Gera as legendas prontas (pra copiar e colar no Instagram) das matérias que
// têm card em public/cards. Uso: node scripts/legendas.js [saida.txt]
const fs = require('fs')
const path = require('path')

const CARDS = path.join(__dirname, '..', 'public', 'cards')
const PT_DIR = path.join(__dirname, '..', 'content', 'articles')

const HASHTAGS = {
  mundo: '#noticias #mundo #atualidades',
  brasil: '#brasil #noticias #brasilnews',
  politica: '#politica #brasil #noticias',
  economia: '#economia #dinheiro #mercado',
  tecnologia: '#tecnologia #inovacao #ia',
  ciencia: '#ciencia #descobertas #conhecimento',
  esportes: '#esportes #futebol #esporte',
  cultura: '#cultura #arte #entretenimento',
}

function legenda(a) {
  const tags = HASHTAGS[a.categorySlug] || '#noticias'
  const resumo = a.excerpt ? `\n\n${String(a.excerpt).slice(0, 220)}` : ''
  return `${a.title}${resumo}\n\n📲 Notícia completa no link da bio\n\n${tags} #explosaosolar`
}

function main() {
  const saida = process.argv[2] || path.join(__dirname, 'legendas.txt')
  const slugs = fs.existsSync(CARDS)
    ? fs.readdirSync(CARDS).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, ''))
    : []
  const arts = slugs
    .map((s) => { try { return JSON.parse(fs.readFileSync(path.join(PT_DIR, s + '.json'), 'utf8')) } catch { return null } })
    .filter(Boolean)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

  const blocos = arts.map((a, i) => `━━━━━━━━━━ CARD ${i + 1} · ${a.slug}.png ━━━━━━━━━━\n\n${legenda(a)}\n`)
  const txt = `LEGENDAS — EXPLOSÃO SOLAR (copie e cole ao postar cada card)\n\n${blocos.join('\n')}`
  fs.writeFileSync(saida, txt, 'utf8')
  console.log(`${arts.length} legendas em ${saida}`)
}

main()
