// Gera uma ILUSTRAÇÃO editorial de IA (grátis, via Pollinations/FLUX) pra uma
// matéria — arte conceitual no tema da marca, nunca foto realista de evento real.
// Uso: node scripts/ilustra.js <slug> [saida.png]
const fs = require('fs')
const path = require('path')

// Sujeito + Contexto simbólico por editoria (fórmula de 5 componentes do Google)
const SUBJECT = {
  mundo: 'A lone silhouetted figure standing before a vast luminous world horizon at dusk, distant continents suggested in light',
  brasil: 'A sweeping Brazilian city skyline silhouette under a golden tropical dusk, mountains and sea in the distance',
  politica: 'Grand neoclassical government architecture with tall columns and a wide empty hall in dramatic chiaroscuro light',
  economia: 'An abstract luminous financial skyline of glass towers with flowing streaks of golden light trails',
  tecnologia: 'Abstract glowing digital forms, flowing circuits and particles of light suspended in dark space',
  ciencia: 'A cosmic laboratory scene with glowing particles, orbiting light and distant starfields',
  esportes: 'A dynamic athletic silhouette caught mid-motion under dramatic stadium floodlights, energy trails',
  cultura: 'An elegant empty stage and artistic set bathed in warm dramatic spotlight, curtains and haze',
}

function prompt(a) {
  const s = SUBJECT[a.categorySlug] || 'An atmospheric symbolic editorial scene'
  // Sujeito/Contexto → Ação/Mood → Composição → Estilo(câmera/luz/cor) → restrições
  return `${s}. Mood evoked by the news theme "${a.title}" — symbolic and general, never a literal depiction of a real event or any identifiable real person. Wide cinematic composition, centered, strong sense of depth. Editorial magazine photograph, shot on Canon EOS R5, 35mm f/2 lens, dramatic directional lighting, dark navy color palette (#0C0E1A) with warm orange and golden highlights, cinematic color grade, richly detailed, elegant. CRITICAL: absolutely NO text, NO letters, NO words, NO numbers, NO typography, NO logos, NO emblems, NO badges, NO signage, NO watermark, NO posters or screens with writing.`
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
