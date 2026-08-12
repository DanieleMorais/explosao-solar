// Publica UMA matéria (por slug) no Instagram, via Node (UTF-8 correto).
// Uso: node scripts/social-uma.js <slug>
const fs = require('fs')
const path = require('path')

const IG_ID = '17841440791860842'
const GRAPH = 'https://graph.facebook.com/v20.0'
const TOKEN_FILE = 'C:/Users/Administrator/OneDrive/Documentos/documentos/token explosao.txt'
const SITE = 'https://explosaosolar.com'

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

async function main() {
  const slug = process.argv[2]
  if (!slug) throw new Error('informe o slug')
  const token = fs.readFileSync(TOKEN_FILE, 'utf8').replace(/[\s\r\n]+/g, '')
  const a = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', 'articles', slug + '.json'), 'utf8'))

  const c = await fetch(`${GRAPH}/${IG_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ image_url: a.imagem, caption: legenda(a), access_token: token }),
  }).then((r) => r.json())
  if (!c.id) throw new Error('container: ' + JSON.stringify(c.error || c))

  const pub = await fetch(`${GRAPH}/${IG_ID}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ creation_id: c.id, access_token: token }),
  }).then((r) => r.json())
  if (!pub.id) throw new Error('publish: ' + JSON.stringify(pub.error || pub))

  const link = await fetch(`${GRAPH}/${pub.id}?fields=permalink&access_token=${token}`).then((r) => r.json())
  console.log('publicado:', link.permalink || pub.id)
}

main().catch((e) => {
  console.error('ERRO:', e.message)
  process.exit(1)
})
