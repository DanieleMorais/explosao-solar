// Gera os cards ilustrados (IA + overlay) pras N últimas matérias e salva em
// public/cards/<slug>.png. Uso: node scripts/fazer-cards.js [N] [slug1 slug2 ...]
const fs = require('fs')
const path = require('path')
const ilustra = require('./ilustra')
const card = require('./card')

const PT_DIR = path.join(__dirname, '..', 'content', 'articles')
const CARDS = path.join(__dirname, '..', 'public', 'cards')
const TMP = path.join(__dirname, '.tmp-ia')

function ultimas(n) {
  return fs
    .readdirSync(PT_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try { return JSON.parse(fs.readFileSync(path.join(PT_DIR, f), 'utf8')) } catch { return null }
    })
    .filter((a) => a && a.slug && a.imagem)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, n)
    .map((a) => a.slug)
}

async function main() {
  const args = process.argv.slice(2)
  const explicitos = args.filter((a) => !/^\d+$/.test(a))
  const n = parseInt(args.find((a) => /^\d+$/.test(a)) || '10', 10)
  const slugs = explicitos.length ? explicitos : ultimas(n)

  fs.mkdirSync(CARDS, { recursive: true })
  fs.mkdirSync(TMP, { recursive: true })
  const feitos = []
  for (const slug of slugs) {
    const saidaCard = path.join(CARDS, slug + '.png')
    try {
      let bg = null
      try {
        bg = path.join(TMP, slug + '.png')
        await ilustra.gerar(slug, bg) // ilustração IA (Pollinations)
      } catch (e) {
        console.log(`  ~ ${slug}: IA falhou (${e.message}), usando foto`)
        bg = null
      }
      await card.gerar(slug, saidaCard, { bg })
      feitos.push(slug)
      console.log(`✓ ${slug}`)
    } catch (e) {
      console.log(`✗ ${slug}: ${e.message}`)
    }
  }
  try { fs.rmSync(TMP, { recursive: true, force: true }) } catch {}
  console.log(`\n${feitos.length} card(s) em public/cards/`)
  console.log(feitos.join(' '))
}

main().catch((e) => {
  console.error('ERRO:', e.message)
  process.exit(1)
})
