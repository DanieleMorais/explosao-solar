// Semeador pausado do Instagram: publica UMA matéria por vez, com intervalo
// grande (conta nova só tolera ~1 post a cada ~20 min). Roda em segundo plano
// e enche o feed ao longo da tarde. Em bloqueio, espera mais e tenta de novo.
// Uso: node scripts/social-fila.js <slug...>
const fs = require('fs')
const path = require('path')

const IG_ID = '17841440791860842'
const GRAPH = 'https://graph.facebook.com/v20.0'
const TOKEN_FILE = 'C:/Users/Administrator/OneDrive/Documentos/documentos/token explosao.txt'
const LOG = path.join(__dirname, 'social-fila.log')
const GAP = 20 * 60 * 1000
const GAP_BLOCK = 25 * 60 * 1000

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

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`
  console.log(line)
  try { fs.appendFileSync(LOG, line + '\n') } catch {}
}

const legenda = (a) => {
  const tags = HASHTAGS[a.categorySlug] || '#noticias'
  const resumo = a.excerpt ? `\n\n${String(a.excerpt).slice(0, 220)}` : ''
  return `${a.title}${resumo}\n\n📲 Notícia completa no link da bio\n\n${tags} #explosaosolar`
}

const RAW = 'https://raw.githubusercontent.com/DanieleMorais/explosao-solar/main/public/cards'
const token = () => fs.readFileSync(TOKEN_FILE, 'utf8').split(/\r?\n/)[0].trim()
const espera = (ms) => new Promise((s) => setTimeout(s, ms))

// usa o card ilustrado (se existir em public/cards) via URL pública do GitHub; senão a foto
function imagemDoPost(slug, a) {
  const local = path.join(__dirname, '..', 'public', 'cards', slug + '.png')
  return fs.existsSync(local) ? `${RAW}/${slug}.png` : a.imagem
}

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
  const c = await form(`${GRAPH}/${IG_ID}/media`, { image_url: imagemDoPost(slug, a), caption: legenda(a), access_token: t })
  if (!c.id) return { erro: c.error?.error_user_msg || c.error?.message || JSON.stringify(c) }
  const pub = await form(`${GRAPH}/${IG_ID}/media_publish`, { creation_id: c.id, access_token: t })
  if (!pub.id) return { erro: pub.error?.error_user_msg || pub.error?.message || JSON.stringify(pub) }
  const link = await fetch(`${GRAPH}/${pub.id}?fields=permalink&access_token=${t}`).then((r) => r.json())
  return { link: link.permalink || pub.id }
}

async function main() {
  const slugs = process.argv.slice(2)
  log(`fila iniciada: ${slugs.length} matérias`)
  let ok = 0
  for (const slug of slugs) {
    let feito = false
    for (let tent = 1; tent <= 3 && !feito; tent++) {
      const r = await postar(slug)
      if (r.link) {
        ok++
        feito = true
        log(`✓ ${slug} -> ${r.link}`)
      } else if (/limit|bloque|restring|spam|equívoco/i.test(r.erro)) {
        log(`… bloqueio em ${slug} (tent ${tent}) — esperando ${GAP_BLOCK / 60000}min`)
        await espera(GAP_BLOCK)
      } else {
        log(`✗ ${slug}: ${r.erro} — pulando`)
        break
      }
    }
    if (feito) await espera(GAP)
  }
  log(`fila concluída: ${ok}/${slugs.length} publicadas`)
}

main().catch((e) => log('ERRO FATAL: ' + (e.stack || e.message)))
