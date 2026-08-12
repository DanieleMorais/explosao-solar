// Gera um CARD de manchete no padrão Explosão Solar (1080x1080) pra Instagram:
// foto da matéria escurecida + selo da editoria + manchete + logo do sol.
// Uso: node scripts/card.js <slug> [saida.png]
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const S = 1080

const CAT = {
  mundo: { cor: '#2563EB', nome: 'MUNDO' },
  brasil: { cor: '#16A34A', nome: 'BRASIL' },
  politica: { cor: '#DC2626', nome: 'POLÍTICA' },
  economia: { cor: '#D97706', nome: 'ECONOMIA' },
  tecnologia: { cor: '#7C3AED', nome: 'TECNOLOGIA' },
  ciencia: { cor: '#0891B2', nome: 'CIÊNCIA' },
  esportes: { cor: '#EA580C', nome: 'ESPORTES' },
  cultura: { cor: '#DB2777', nome: 'CULTURA' },
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// quebra a manchete em linhas de ~no máx `max` caracteres
function quebrar(txt, max = 20, maxLinhas = 4) {
  const palavras = txt.split(/\s+/)
  const linhas = []
  let atual = ''
  for (const p of palavras) {
    if ((atual + ' ' + p).trim().length > max) {
      if (atual) linhas.push(atual.trim())
      atual = p
    } else {
      atual = (atual + ' ' + p).trim()
    }
  }
  if (atual) linhas.push(atual.trim())
  if (linhas.length > maxLinhas) {
    linhas.length = maxLinhas
    linhas[maxLinhas - 1] = linhas[maxLinhas - 1].replace(/[.,;:]?$/, '') + '…'
  }
  return linhas
}

async function baixar(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) })
  if (!r.ok) throw new Error('imagem ' + r.status)
  return Buffer.from(await r.arrayBuffer())
}

async function fundoDesign(cor) {
  const svg = `<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg" cx="72%" cy="26%" r="85%">
        <stop offset="0%" stop-color="${cor}" stop-opacity="0.42"/>
        <stop offset="45%" stop-color="#101426"/>
        <stop offset="100%" stop-color="#06070E"/>
      </radialGradient>
      <linearGradient id="s2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FFC53D"/><stop offset="100%" stop-color="#FF5400"/>
      </linearGradient>
    </defs>
    <rect width="${S}" height="${S}" fill="url(#bg)"/>
    <circle cx="830" cy="250" r="150" fill="url(#s2)" opacity="0.9"/>
    <circle cx="830" cy="250" r="220" fill="none" stroke="#FFB300" stroke-opacity="0.18" stroke-width="2"/>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

async function gerar(slug, saida, opts = {}) {
  const a = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', 'articles', slug + '.json'), 'utf8'))
  const c = CAT[a.categorySlug] || { cor: '#FF6B00', nome: 'NOTÍCIAS' }

  const origem = opts.bg
    ? await sharp(fs.readFileSync(opts.bg)).resize(S, S, { fit: 'cover', position: 'attention' }).toBuffer()
    : opts.design
      ? await fundoDesign(c.cor)
      : await sharp(await baixar(a.imagem)).resize(S, S, { fit: 'cover', position: 'attention' }).toBuffer()
  const fundo = origem

  const linhas = quebrar(a.title, 20, 4)
  const fs0 = 62
  const lh = 74
  const baseY = S - 96 - (linhas.length - 1) * lh
  const manchete = linhas
    .map((l, i) => `<text x="70" y="${baseY + i * lh}" font-family="Georgia, 'DejaVu Serif', serif" font-weight="700" font-size="${fs0}" fill="#FFFFFF">${esc(l)}</text>`)
    .join('')

  const overlay = `<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sh" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0C0E1A" stop-opacity="0"/>
        <stop offset="30%" stop-color="#0C0E1A" stop-opacity="0.12"/>
        <stop offset="52%" stop-color="#0C0E1A" stop-opacity="0.55"/>
        <stop offset="66%" stop-color="#0C0E1A" stop-opacity="0.92"/>
        <stop offset="100%" stop-color="#06070E" stop-opacity="1"/>
      </linearGradient>
      <linearGradient id="sun" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#FF6B00"/><stop offset="100%" stop-color="#FFB300"/>
      </linearGradient>
    </defs>
    <rect width="${S}" height="${S}" fill="url(#sh)"/>
    <rect x="0" y="0" width="${S}" height="8" fill="url(#sun)"/>

    <rect x="70" y="70" rx="8" width="${c.nome.length * 22 + 44}" height="52" fill="${c.cor}"/>
    <text x="${70 + 22}" y="105" font-family="Arial, 'DejaVu Sans', sans-serif" font-weight="700" font-size="26" letter-spacing="2" fill="#FFFFFF">${esc(c.nome)}</text>

    <rect x="70" y="${baseY - 84}" width="70" height="6" fill="url(#sun)"/>
    ${manchete}

    <circle cx="88" cy="${S - 46}" r="15" fill="url(#sun)"/>
    <text x="116" y="${S - 38}" font-family="Georgia, serif" font-weight="700" font-size="30" letter-spacing="1" fill="#FFFFFF">EXPLOSÃO <tspan fill="#FFB300">SOLAR</tspan></text>
  </svg>`

  const out = saida || path.join(__dirname, '..', 'public', 'cards', slug + '.png')
  fs.mkdirSync(path.dirname(out), { recursive: true })
  await sharp(fundo).composite([{ input: Buffer.from(overlay) }]).png().toFile(out)
  return out
}

if (require.main === module) {
  const bgArg = process.argv.includes('--bg') ? process.argv[process.argv.indexOf('--bg') + 1] : null
  gerar(process.argv[2], process.argv[3], { design: process.argv.includes('--design'), bg: bgArg })
    .then((o) => console.log('card:', o))
    .catch((e) => {
      console.error('ERRO:', e.message)
      process.exit(1)
    })
}

module.exports = { gerar }
