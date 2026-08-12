// Publicador confiável no Instagram: form-encoded (igual curl, evita erros de
// token) + legenda UTF-8 nativa do Node + imagem real da matéria + intervalo
// grande (conta nova não tolera rajada). Uso: node scripts/social-pub.js <slug...>
const fs = require('fs')
const path = require('path')

const IG_ID = '17841440791860842'
const GRAPH = 'https://graph.facebook.com/v20.0'
const TOKEN_FILE = 'C:/Users/Administrator/OneDrive/Documentos/documentos/token explosao.txt'
const INTERVALO_MS = 60000

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

const legenda = (a) => {
  const tags = HASHTAGS[a.categorySlug] || '#noticias'
  const resumo = a.excerpt ? `\n\n${String(a.excerpt).slice(0, 220)}` : ''
  return `${a.title}${resumo}\n\n📲 Notícia completa no link da bio\n\n${tags} #explosaosolar`
}

const token = () => fs.readFileSync(TOKEN_FILE, 'utf8').split(/\r?\n/)[0].trim()

async function form(url, campos) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(campos).toString(),
  })
  return r.json()
}

async function postar(slug) {
  const t = token()
  const a = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', 'articles', slug + '.json'), 'utf8'))
  const c = await form(`${GRAPH}/${IG_ID}/media`, { image_url: a.imagem, caption: legenda(a), access_token: t })
  if (!c.id) return { ok: false, erro: c.error?.error_user_msg || c.error?.message || JSON.stringify(c) }
  const pub = await form(`${GRAPH}/${IG_ID}/media_publish`, { creation_id: c.id, access_token: t })
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
        console.log('filtro anti-spam ativo — parando (tenta mais tarde).')
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
