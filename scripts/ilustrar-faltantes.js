// Ilustra por IA as matérias que o Openverse não cobriu (tema abstrato não tem foto
// de banco de imagem). Arte conceitual na identidade do portal — nunca cena realista
// de evento ou pessoa real — e o crédito diz que é ilustração de IA.
// Uso: node scripts/ilustrar-faltantes.js [--limite 40] [--paralelas 3] [--refazer]
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const RAIZ = path.join(__dirname, '..')
const DIRS = { pt: 'content/articles', en: 'content/en/articles', es: 'content/es/articles' }
const CREDITO = { pt: 'Ilustração de IA · Explosão Solar', en: 'AI illustration · Explosão Solar', es: 'Ilustración de IA · Explosão Solar' }
// Workers AI roda na conta do plano pago (Fadamadrinhadm); a imagem gerada vira
// arquivo no repo, então não precisa ser a mesma conta que hospeda o site.
const CONTA = process.env.CF_AI_ACCOUNT || 'e6a577fc41381f574578e6c851d6990a'
const MODELO = '@cf/black-forest-labs/flux-1-schnell'
const TOKEN_FILE = process.env.CF_AI_TOKEN_FILE || 'C:/Users/Administrator/OneDrive/Documentos/documentos/token zona.txt'
const log = (m) => console.log(`[${new Date().toISOString()}] ${m}`)

// Linguagem visual por editoria: só formas, luz e textura. O tema entra como clima,
// nunca como cena — arte que "quase" reproduz o fato acaba lida como foto do fato.
const MOTIVO = {
  mundo: 'arcs and meridian lines of light wrapping dark spherical forms',
  brasil: 'layered ridges and flowing coastal curves traced in light',
  politica: 'tall vertical forms in symmetry cut by shafts of light',
  economia: 'rising crystalline volumes and ascending trails of light',
  tecnologia: 'networks of luminous filaments and floating particles',
  ciencia: 'orbital rings, glowing particles and drifting cosmic dust',
  esportes: 'sweeping motion trails and dynamic arcs of energy',
  cultura: 'draped folds of fabric, haze and a single beam of light',
}

// O modelo escreve letras em QUALQUER superfície que aceite inscrição — moeda, tela,
// placa, papel. A única defesa confiável é não colocar esses objetos na cena. Rosto
// humano some pelo mesmo motivo: cena realista de evento real vira foto falsa.
const PROIBIDO =
  'No people, no faces, no human figures, no coins, no currency, no screens, no monitors, no paper, no books, ' +
  'no posters, no signs, no panels, no buildings with windows, no vehicles, no recognizable everyday objects. ' +
  'Absolutely no text, no letters, no numbers, no symbols, no typography, no logos, no watermark.'

function prompt(a, en) {
  const tema = en?.title || a.title
  const tags = (en?.tags || a.tags || []).slice(0, 5).join(', ')
  const motivo = MOTIVO[a.categorySlug] || 'flowing forms of light and shadow'
  return (
    `Abstract conceptual editorial artwork for a premium news magazine. Pure visual metaphor ` +
    `inspired by the ideas of: ${tags} — evoking the theme "${tema}" as mood and energy only, ` +
    `never as a depiction of the event itself. Composition built from ${motivo}, with translucent ` +
    `geometric and organic forms, fine luminous particles and layered depth. Deep navy blue (#0C0E1A) ` +
    `and black background, warm golden orange light, cinematic lighting, elegant and minimal, richly ` +
    `detailed. ${PROIBIDO}`
  )
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms))

function token() {
  if (process.env.CF_AI_TOKEN) return process.env.CF_AI_TOKEN
  const m = fs.readFileSync(TOKEN_FILE, 'utf8').match(/(cfat_[A-Za-z0-9_-]+)/)
  if (!m) throw new Error('token da Cloudflare não encontrado em ' + TOKEN_FILE)
  return m[1]
}

function versaoEn(slug) {
  const f = path.join(RAIZ, DIRS.en, slug + '.json')
  // O título e as tags em inglês vêm da tradução que o site já publica — o Flux
  // entende inglês muito melhor do que português.
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null
}

async function ilustrar(a, tok) {
  let dados
  for (let tentativa = 1; ; tentativa++) {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CONTA}/ai/run/${MODELO}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt(a, versaoEn(a.slug)), steps: 8 }),
      signal: AbortSignal.timeout(120000),
    })
    dados = await r.json()
    if (r.ok && dados?.result?.image) break
    const msg = (dados?.errors || []).map((e) => e.message).join('; ') || 'HTTP ' + r.status
    if ((r.status !== 429 && r.status < 500) || tentativa >= 3) throw new Error(msg)
    await espera(20000 * tentativa)
  }

  // O flux-1-schnell só devolve 1024×1024; o corte central deixa no 16:9 usado na
  // capa da matéria e na imagem de compartilhamento.
  const wide = await sharp(Buffer.from(dados.result.image, 'base64'))
    .resize(1024, 576, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 86 })
    .toBuffer()

  const rel = `/ia/${a.slug}.jpg`
  const destino = path.join(RAIZ, 'public', 'ia', `${a.slug}.jpg`)
  fs.mkdirSync(path.dirname(destino), { recursive: true })
  fs.writeFileSync(destino, wide)
  return rel
}

function aplicar(slug, rel) {
  let escritos = 0
  for (const [lang, dir] of Object.entries(DIRS)) {
    const f = path.join(RAIZ, dir, slug + '.json')
    if (!fs.existsSync(f)) continue
    const a = JSON.parse(fs.readFileSync(f, 'utf8'))
    if (a.imagem && a.imagem !== rel) continue
    a.imagem = rel
    a.imagemCredito = CREDITO[lang]
    a.imagemCreditoUrl = ''
    fs.writeFileSync(f, JSON.stringify(a, null, 2))
    escritos++
  }
  return escritos
}

async function main() {
  const args = process.argv.slice(2)
  const limite = args.includes('--limite') ? parseInt(args[args.indexOf('--limite') + 1], 10) : 40
  const paralelas = args.includes('--paralelas') ? parseInt(args[args.indexOf('--paralelas') + 1], 10) : 3
  // --refazer regera só o que já é ilustração de IA; foto real do Openverse não se toca.
  const refazer = args.includes('--refazer')
  const tok = token()
  const dir = path.join(RAIZ, DIRS.pt)
  const pendentes = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
    .filter((a) => (refazer ? String(a.imagem || '').startsWith('/ia/') : !a.imagem))
    .slice(0, limite)

  log(`${pendentes.length} matéria(s) a ilustrar (limite ${limite}, ${paralelas} em paralelo${refazer ? ', refazendo' : ''})`)
  let ok = 0
  let falhas = 0
  const fila = [...pendentes]
  async function trabalhador() {
    while (fila.length) {
      const a = fila.shift()
      try {
        const rel = await ilustrar(a, tok)
        const n = aplicar(a.slug, rel)
        ok++
        log(`ok [${a.categorySlug}] ${a.slug} (${n} idioma(s)) — restam ${fila.length}`)
      } catch (e) {
        falhas++
        log(`falhou ${a.slug}: ${e.message}`)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(paralelas, fila.length) }, trabalhador))
  log(`fim: ${ok} ilustradas, ${falhas} falharam`)
}

main().catch((e) => {
  log('ERRO: ' + (e.stack || e.message))
  process.exit(1)
})
