// Pede indexação instantânea das URLs do portal na API de Indexação do Google.
// Uso: node scripts/indexar.js [--limite 200]

const fs = require('fs')
const path = require('path')
const { api } = require('./google')

const ROOT = path.join(__dirname, '..')
const BASE = 'https://explosaosolar.com'
const CATS = ['mundo', 'brasil', 'politica', 'economia', 'tecnologia', 'ciencia', 'esportes', 'cultura']

function urls() {
  const lista = [BASE, `${BASE}/en`, `${BASE}/es`]
  for (const c of CATS) for (const p of ['', '/en', '/es']) lista.push(`${BASE}${p}/${c}`)
  for (const p of ['/sobre', '/faq', '/contato', '/politica-de-privacidade', '/politica-de-cookies', '/termos-de-uso']) lista.push(BASE + p)

  for (const lang of ['pt', 'en', 'es']) {
    const dir = lang === 'pt' ? path.join(ROOT, 'content', 'articles') : path.join(ROOT, 'content', lang, 'articles')
    if (!fs.existsSync(dir)) continue
    const prefixo = lang === 'pt' ? '' : `/${lang}`
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.json')) lista.push(`${BASE}${prefixo}/noticia/${f.replace('.json', '')}`)
    }
  }
  return lista
}

async function main() {
  const args = process.argv.slice(2)
  const limite = args.includes('--limite') ? parseInt(args[args.indexOf('--limite') + 1], 10) : 200

  const lista = urls().slice(0, limite)
  console.log(`enviando ${lista.length} URLs para indexação...`)

  let ok = 0
  let falhou = 0
  for (const url of lista) {
    const r = await api('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      body: { url, type: 'URL_UPDATED' },
    })
    if (r.ok) ok++
    else {
      falhou++
      if (falhou <= 3) console.log(`  falhou ${url.slice(28)}: HTTP ${r.status} ${JSON.stringify(r.data).slice(0, 110)}`)
      if (r.status === 429) {
        console.log('  cota diária de indexação atingida — parando')
        break
      }
    }
  }
  console.log(`indexação: ${ok} aceitas, ${falhou} falhas`)
}

main().catch((e) => {
  console.error('ERRO:', e.message)
  process.exit(1)
})
