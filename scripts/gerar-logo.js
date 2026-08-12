// Gera a logo/foto de perfil do Explosão Solar (PNG 1080x1080) com o sharp.
// Uso: node scripts/gerar-logo.js
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const S = 1080
const CX = 540
const CY = 470

// raios do sol ao redor do núcleo
let raios = ''
const nRaios = 16
for (let i = 0; i < nRaios; i++) {
  const ang = (i * 360) / nRaios
  const longo = i % 2 === 0
  const y1 = CY - (longo ? 296 : 262)
  const y2 = CY - 214
  const w = longo ? 20 : 12
  raios += `<rect x="${CX - w / 2}" y="${y1}" width="${w}" height="${y2 - y1}" rx="${w / 2}" fill="url(#sun)" transform="rotate(${ang} ${CX} ${CY})"/>`
}

const svg = `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="75%">
      <stop offset="0%" stop-color="#1c2440"/>
      <stop offset="55%" stop-color="#0C0E1A"/>
      <stop offset="100%" stop-color="#06070E"/>
    </radialGradient>
    <linearGradient id="sun" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFC53D"/>
      <stop offset="50%" stop-color="#FF8A00"/>
      <stop offset="100%" stop-color="#FF5400"/>
    </linearGradient>
    <radialGradient id="core" cx="42%" cy="38%" r="70%">
      <stop offset="0%" stop-color="#FFD873"/>
      <stop offset="45%" stop-color="#FF9A1F"/>
      <stop offset="100%" stop-color="#FF5A00"/>
    </radialGradient>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="42" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="${S}" height="${S}" fill="url(#bg)"/>
  <circle cx="${CX}" cy="${CY}" r="250" fill="#FF7A00" opacity="0.30" filter="url(#glow)"/>
  <g>${raios}</g>
  <circle cx="${CX}" cy="${CY}" r="172" fill="url(#core)"/>
  <circle cx="${CX}" cy="${CY}" r="172" fill="none" stroke="#FFE0A3" stroke-opacity="0.35" stroke-width="4"/>

  <text x="${CX}" y="812" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="118" letter-spacing="2" fill="#FFFFFF">EXPLOSÃO</text>
  <text x="${CX}" y="928" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="118" letter-spacing="18" fill="#FFB300">SOLAR</text>
</svg>`

async function main() {
  const buf = Buffer.from(svg)
  const destinos = [
    path.join(__dirname, '..', 'public', 'perfil-instagram.png'),
    'C:/Users/Administrator/Desktop/explosaosolar-perfil.png',
    'C:/Users/Administrator/OneDrive/Documentos/documentos/explosaosolar-perfil.png',
  ]
  for (const d of destinos) {
    try {
      await sharp(buf).png().toFile(d)
      console.log('gerado:', d)
    } catch (e) {
      console.log('falhou', d, '-', e.message)
    }
  }
  // versão só ícone (sem texto), útil pra favicon/app
  const soIcone = svg.replace(/<text[\s\S]*?<\/text>\s*<text[\s\S]*?<\/text>/, '').replace(`cy="${CY}"`, `cy="540"`)
}

main().catch((e) => {
  console.error('ERRO:', e.message)
  process.exit(1)
})
