// Gera uma ILUSTRAÇÃO editorial de IA (grátis, via Pollinations/FLUX) pra uma
// matéria — arte conceitual no tema da marca, nunca foto realista de evento real.
// Uso: node scripts/ilustra.js <slug> [saida.png]
const fs = require('fs')
const path = require('path')

const CAT = {
  mundo: 'world geopolitics, globe, international',
  brasil: 'Brazil, brazilian identity',
  politica: 'politics, government institutions, democracy',
  economia: 'economy and finance, markets, money abstract',
  tecnologia: 'technology and artificial intelligence, circuits, digital',
  ciencia: 'science, discovery, laboratory, cosmos',
  esportes: 'sports, movement, energy, stadium abstract',
  cultura: 'culture, art, music, cinema',
}

function prompt(a) {
  const tema = CAT[a.categorySlug] || 'news'
  return `Cinematic atmospheric editorial photograph evoking ${tema}, mood inspired by "${a.title}". Dark navy tones (#0C0E1A) with warm orange and golden light, elegant, moody, depth of field, magazine-quality, photorealistic scene or abstract texture. CRITICAL: absolutely NO text, NO letters, NO words, NO numbers, NO typography, NO logos, NO emblems, NO badges, NO signage, NO watermark, NO posters, NO screens with writing. Just a clean atmospheric scene. Do not depict identifiable real people or a specific real event.`
}

async function gerar(slug, saida) {
  const a = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', 'articles', slug + '.json'), 'utf8'))
  const seed = [...slug].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 100000
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt(a))}?width=1080&height=1080&nologo=true&model=flux&seed=${seed}`
  const r = await fetch(url, { signal: AbortSignal.timeout(120000) })
  if (!r.ok) throw new Error('pollinations ' + r.status)
  const buf = Buffer.from(await r.arrayBuffer())
  if (buf.length < 3000) throw new Error('imagem muito pequena (falhou)')
  const out = saida || path.join(__dirname, '..', 'public', 'ia', slug + '.png')
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, buf)
  return out
}

if (require.main === module) {
  gerar(process.argv[2], process.argv[3])
    .then((o) => console.log('ilustração:', o))
    .catch((e) => {
      console.error('ERRO:', e.message)
      process.exit(1)
    })
}

module.exports = { gerar }
