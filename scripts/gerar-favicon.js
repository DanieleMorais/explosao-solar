// Gera o conjunto de ícones do portal a partir do desenho do sol.
// SVG sozinho não basta: o Google usa favicon.ico nos resultados de busca e o
// iOS precisa de PNG. Sem dependências — encoder PNG/ICO escrito à mão.

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const PUBLIC = path.join(__dirname, '..', 'public')
const APP = path.join(__dirname, '..', 'app')

const FUNDO = [12, 14, 26, 255] // #0C0E1A, mesmo do cabeçalho
const LARANJA = [255, 107, 0]
const AMARELO = [255, 179, 0]

const tabelaCrc = (() => {
  const t = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let crc = 0xffffffff
  for (const b of buf) crc = tabelaCrc[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(tipo, dados) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(dados.length)
  const td = Buffer.concat([Buffer.from(tipo, 'ascii'), dados])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function png(px, size) {
  const raw = Buffer.alloc(size * (1 + size * 4))
  let p = 0
  for (let y = 0; y < size; y++) {
    raw[p++] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = px[y][x]
      raw[p++] = r
      raw[p++] = g
      raw[p++] = b
      raw[p++] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function mistura(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

// Desenha o sol com antialiasing por supersampling 3x.
function desenhar(size, comFundo = true) {
  const S = 3
  const cx = size / 2
  const cy = size / 2
  const rMiolo = size * 0.30
  const rRaioInt = size * 0.375
  const rRaioExt = size * 0.47
  const larguraRaio = size * 0.055
  const raioCanto = size * 0.22

  const px = []
  for (let y = 0; y < size; y++) {
    const linha = []
    for (let x = 0; x < size; x++) {
      let somaR = 0
      let somaG = 0
      let somaB = 0
      let somaA = 0

      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const fx = x + (sx + 0.5) / S
          const fy = y + (sy + 0.5) / S
          const dx = fx - cx
          const dy = fy - cy
          const d = Math.hypot(dx, dy)

          let cor = null

          if (d <= rMiolo) {
            cor = mistura(AMARELO, LARANJA, Math.min(1, d / rMiolo))
          } else if (d >= rRaioInt && d <= rRaioExt) {
            const ang = Math.atan2(dy, dx)
            const setor = ((ang + Math.PI * 2) % (Math.PI / 4)) - Math.PI / 8
            const dist = Math.abs(setor) * d
            if (dist <= larguraRaio / 2) cor = mistura(AMARELO, LARANJA, (d - rRaioInt) / (rRaioExt - rRaioInt))
          }

          if (cor) {
            somaR += cor[0]
            somaG += cor[1]
            somaB += cor[2]
            somaA += 255
          } else if (comFundo) {
            // cantos arredondados
            const qx = Math.max(raioCanto - fx, fx - (size - raioCanto), 0)
            const qy = Math.max(raioCanto - fy, fy - (size - raioCanto), 0)
            const dentro = Math.hypot(qx, qy) <= raioCanto
            if (dentro) {
              somaR += FUNDO[0]
              somaG += FUNDO[1]
              somaB += FUNDO[2]
              somaA += 255
            }
          }
        }
      }

      const n = S * S
      const a = Math.round(somaA / n)
      linha.push(a === 0 ? [0, 0, 0, 0] : [Math.round(somaR / n / (a / 255)), Math.round(somaG / n / (a / 255)), Math.round(somaB / n / (a / 255)), a])
    }
    px.push(linha)
  }
  return px
}

function ico(imagens) {
  const cabecalho = Buffer.alloc(6)
  cabecalho.writeUInt16LE(0, 0)
  cabecalho.writeUInt16LE(1, 2)
  cabecalho.writeUInt16LE(imagens.length, 4)

  const entradas = []
  const dados = []
  let offset = 6 + imagens.length * 16

  for (const { size, buf } of imagens) {
    const e = Buffer.alloc(16)
    e[0] = size >= 256 ? 0 : size
    e[1] = size >= 256 ? 0 : size
    e[2] = 0
    e[3] = 0
    e.writeUInt16LE(1, 4)
    e.writeUInt16LE(32, 6)
    e.writeUInt32LE(buf.length, 8)
    e.writeUInt32LE(offset, 12)
    entradas.push(e)
    dados.push(buf)
    offset += buf.length
  }
  return Buffer.concat([cabecalho, ...entradas, ...dados])
}

fs.mkdirSync(PUBLIC, { recursive: true })

const paraIco = [16, 32, 48].map((size) => ({ size, buf: png(desenhar(size), size) }))
fs.writeFileSync(path.join(PUBLIC, 'favicon.ico'), ico(paraIco))
console.log(`favicon.ico gerado (16, 32, 48px) — ${(fs.statSync(path.join(PUBLIC, 'favicon.ico')).size / 1024).toFixed(1)} KB`)

for (const [nome, size] of [
  ['apple-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
]) {
  const buf = png(desenhar(size), size)
  fs.writeFileSync(path.join(APP === PUBLIC ? PUBLIC : PUBLIC, nome), buf)
  console.log(`${nome} gerado (${size}px) — ${(buf.length / 1024).toFixed(1)} KB`)
}
