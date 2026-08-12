// Atribui uma imagem (com crédito) a cada matéria que ainda não tem, via Openverse
// (imagens de licença comercial). Aplica a mesma imagem às traduções.
// Resumável: só processa matérias sem `imagem`. Uso: node scripts/imagens.js [--limite 40]

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const PT_DIR = path.join(ROOT, 'content', 'articles')
const LOG = path.join(__dirname, 'imagens.log')
const UA = { 'User-Agent': 'ExplosaoSolarBot/1.0 (+https://explosaosolar.com)' }

const QUERIES = {
  mundo: ['world globe map', 'international flags', 'city skyline aerial', 'earth from space'],
  brasil: ['brazil landscape', 'brasilia architecture', 'brazilian city aerial', 'são paulo skyline'],
  politica: ['parliament building', 'government chamber', 'courthouse justice', 'voting ballot'],
  economia: ['finance money', 'stock market chart', 'business office', 'banknotes currency'],
  tecnologia: ['technology circuit board', 'artificial intelligence', 'computer code screen', 'data server'],
  ciencia: ['science laboratory', 'space astronomy galaxy', 'nature climate', 'microscope research'],
  esportes: ['stadium crowd', 'soccer football field', 'running athletics track', 'sport arena'],
  cultura: ['cinema film reel', 'music concert stage', 'books library', 'art gallery museum'],
}

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`
  console.log(line)
  fs.appendFileSync(LOG, line + '\n')
}

function hash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

let FORCAR = false

async function urlOk(u) {
  if (FORCAR) return true
  try {
    const r = await fetch(u, { method: 'GET', headers: { ...UA, Range: 'bytes=0-2048' }, signal: AbortSignal.timeout(12000) })
    return (r.status >= 200 && r.status < 400) || r.status === 416
  } catch {
    return false
  }
}

async function candidatos(q, wide) {
  try {
    const r = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=20&license_type=commercial${wide ? '&aspect_ratio=wide' : ''}&mature=false`,
      { headers: UA, signal: AbortSignal.timeout(20000) }
    )
    if (!r.ok) return []
    const j = await r.json()
    return (j.results || []).filter((x) => x.url && (x.width || 0) >= 500 && (x.width || 0) >= (x.height || 0))
  } catch {
    return []
  }
}

async function buscarImagem(cat, slug) {
  const termos = QUERIES[cat] || QUERIES.mundo
  const q = termos[hash(slug) % termos.length]
  let bons = await candidatos(q, true)
  if (bons.length < 4) bons = bons.concat(await candidatos(q, false))
  if (bons.length < 2) bons = bons.concat(await candidatos((QUERIES[cat] || QUERIES.mundo)[0], false))
  if (bons.length < 2) bons = bons.concat(await candidatos(['news newspaper', 'brazil landscape', 'world map', 'city street'][hash(slug) % 4], false))
  if (!bons.length) return null

  const ordem = [...new Map(bons.map((b) => [b.url, b])).values()].sort((a, b) => (hash(slug + (a.id || a.url)) % 997) - (hash(slug + (b.id || b.url)) % 997))
  for (const img of ordem.slice(0, 8)) {
    if (await urlOk(img.url)) {
      return {
        imagem: img.url,
        imagemCredito: img.attribution ? img.attribution.replace(/\s+/g, ' ').slice(0, 180) : `${img.creator || 'Autor desconhecido'} · ${img.license || 'CC'}`,
        imagemCreditoUrl: img.foreign_landing_url || img.creator_url || img.url,
      }
    }
  }
  return null
}

function aplicar(slug, dados) {
  for (const lang of ['pt', 'en', 'es']) {
    const dir = lang === 'pt' ? PT_DIR : path.join(ROOT, 'content', lang, 'articles')
    const p = path.join(dir, slug + '.json')
    if (!fs.existsSync(p)) continue
    try {
      const a = JSON.parse(fs.readFileSync(p, 'utf8'))
      Object.assign(a, dados)
      fs.writeFileSync(p, JSON.stringify(a, null, 2))
    } catch {}
  }
}

async function main() {
  const args = process.argv.slice(2)
  const limite = args.includes('--limite') ? parseInt(args[args.indexOf('--limite') + 1], 10) : 40
  FORCAR = args.includes('--forcar')

  const pendentes = fs
    .readdirSync(PT_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(PT_DIR, f), 'utf8'))
      } catch {
        return null
      }
    })
    .filter((a) => a && a.slug && !a.imagem)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, limite)

  log(`${pendentes.length} matéria(s) sem imagem (limite ${limite})`)

  let ok = 0
  let falhou = 0
  for (const a of pendentes) {
    const img = await buscarImagem(a.categorySlug, a.slug)
    if (img) {
      aplicar(a.slug, img)
      ok++
      log(`ok [${a.categorySlug}] ${a.slug}`)
    } else {
      falhou++
      log(`sem imagem [${a.categorySlug}] ${a.slug}`)
    }
    await new Promise((s) => setTimeout(s, 700))
  }
  log(`fim: ${ok} com imagem, ${falhou} sem`)
}

main().catch((e) => {
  log('ERRO FATAL: ' + (e.stack || e.message))
  process.exit(1)
})
