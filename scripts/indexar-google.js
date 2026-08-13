// Pinga o Google Indexing API pras últimas matérias (URL_UPDATED) — acelera o
// rastreamento. Cota padrão: 200 URLs/dia. Uso: node scripts/indexar-google.js [N]
const fs = require('fs')
const path = require('path')
const { api } = require('./google')

const SITE = 'https://explosaosolar.com'
const DIRS = { pt: 'articles', en: path.join('en', 'articles'), es: path.join('es', 'articles') }

function urlsUltimas(n) {
  const base = path.join(__dirname, '..', 'content', 'articles')
  const arts = fs
    .readdirSync(base)
    .filter((f) => f.endsWith('.json'))
    .map((f) => { try { return JSON.parse(fs.readFileSync(path.join(base, f), 'utf8')) } catch { return null } })
    .filter((a) => a && a.slug)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, n)
  const urls = []
  for (const a of arts) {
    urls.push(`${SITE}/noticia/${a.slug}`)
    if (fs.existsSync(path.join(__dirname, '..', 'content', 'en', 'articles', a.slug + '.json'))) urls.push(`${SITE}/en/noticia/${a.slug}`)
    if (fs.existsSync(path.join(__dirname, '..', 'content', 'es', 'articles', a.slug + '.json'))) urls.push(`${SITE}/es/noticia/${a.slug}`)
  }
  return urls
}

async function main() {
  const n = parseInt(process.argv[2] || '20', 10)
  const urls = urlsUltimas(n)
  console.log(`pingando ${urls.length} URL(s) no Indexing API...`)
  let ok = 0, falha = 0
  for (const url of urls) {
    const r = await api('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      body: { url, type: 'URL_UPDATED' },
    })
    if (r.ok) { ok++; }
    else { falha++; console.log(`  ✗ ${r.status} ${url} — ${JSON.stringify(r.data).slice(0, 120)}`) }
    await new Promise((s) => setTimeout(s, 300))
  }
  console.log(`\nfim: ${ok} enviadas, ${falha} falhas`)
}

main().catch((e) => console.error('ERRO:', e.stack || e.message))
