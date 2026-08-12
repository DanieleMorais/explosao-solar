// Publica várias matérias no Instagram, com intervalo entre elas (evita bloqueio
// anti-spam em conta nova). Uso: node scripts/social-lote.js <slug1> <slug2> ...
const fs = require('fs')
const path = require('path')

const IG_ID = '17841440791860842'
const GRAPH = 'https://graph.facebook.com/v20.0'
const TOKEN_FILE = 'C:/Users/Administrator/OneDrive/Documentos/documentos/token explosao.txt'
const SITE = 'https://explosaosolar.com'
const INTERVALO_MS = 40000

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

const token = () => fs.readFileSync(TOKEN_FILE, 'utf8').split(/\r?\n/)[0].trim()

async function postar(slug) {
  const t = token()
  const a = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', 'articles', slug + '.json'), 'utf8'))
  const c = await fetch(`${GRAPH}/${IG_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ image_url: a.imagem, caption: legenda(a), access_token: t }),
  }).then((r) => r.json())
  if (!c.id) return { ok: false, erro: c.error?.error_user_msg || c.error?.message || JSON.stringify(c) }
  const pub = await fetch(`${GRAPH}/${IG_ID}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ creation_id: c.id, access_token: t }),
  }).then((r) => r.json())
  if (!pub.id) return { ok: false, erro: pub.error?.error_user_msg || pub.error?.message || JSON.stringify(pub) }
  const link = await fetch(`${GRAPH}/${pub.id}?fields=permalink&access_token=${t}`).then((r) => r.json())
  return { ok: true, link: link.permalink || pub.id }
}

async function main() {
  const slugs = process.argv.slice(2)
  let ok = 0
  for (let i = 0; i < slugs.length; i++) {
    const r = await postar(slugs[i])
    if (r.ok) {
      ok++
      console.log(`✓ ${slugs[i]} -> ${r.link}`)
    } else {
      console.log(`✗ ${slugs[i]} -> ${r.erro}`)
      if (/limit|bloque|restring|spam/i.test(r.erro)) {
        console.log('bloqueio anti-spam — parando por aqui.')
        break
      }
    }
    if (i < slugs.length - 1) await new Promise((s) => setTimeout(s, INTERVALO_MS))
  }
  console.log(`\n${ok} publicada(s).`)
}

main().catch((e) => {
  console.error('ERRO:', e.message)
  process.exit(0)
})
