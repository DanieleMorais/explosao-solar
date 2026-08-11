// Gera public/logo.png (600x60) para o JSON-LD do publisher — o Google não aceita SVG ali.
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const W = 600
const H = 60

function crc32(buf) {
  let c
  const table = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

// Bitmap 5x7 das letras usadas em "EXPLOSAO SOLAR"
const FONT = {
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
}

const px = Array.from({ length: H }, () => Array.from({ length: W }, () => [12, 14, 26, 255]))

// Sol à esquerda
const cx = 32
const cy = 30
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - cx, y - cy)
    if (d <= 15) {
      const tt = Math.min(1, d / 15)
      px[y][x] = [Math.round(255 - tt * 0), Math.round(179 - tt * 72), Math.round(0 + tt * 0), 255]
    } else if (d <= 21 && d >= 17) {
      const ang = Math.atan2(y - cy, x - cx)
      if (Math.abs(Math.sin(ang * 6)) > 0.72) px[y][x] = [255, 140, 0, 255]
    }
  }
}

// Texto
const text = 'EXPLOSAO SOLAR'
const scale = 5
let ox = 62
const oy = 13
for (const ch of text) {
  const glyph = FONT[ch] || FONT[' ']
  for (let gy = 0; gy < 7; gy++) {
    for (let gx = 0; gx < 5; gx++) {
      if (glyph[gy][gx] !== '1') continue
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const y = oy + gy * scale + sy
          const x = ox + gx * scale + sx
          if (y < 0 || y >= H || x < 0 || x >= W) continue
          const tt = (x - 62) / (W - 62)
          px[y][x] = [255, Math.round(107 + tt * 72), Math.round(0 + tt * 0), 255]
        }
      }
    }
  }
  ox += 6 * scale
}

const raw = Buffer.alloc(H * (1 + W * 4))
let p = 0
for (let y = 0; y < H; y++) {
  raw[p++] = 0
  for (let x = 0; x < W; x++) {
    const [r, g, b, a] = px[y][x]
    raw[p++] = r
    raw[p++] = g
    raw[p++] = b
    raw[p++] = a
  }
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(W, 0)
ihdr.writeUInt32BE(H, 4)
ihdr[8] = 8
ihdr[9] = 6
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

const out = path.join(__dirname, '..', 'public', 'logo.png')
fs.writeFileSync(out, png)
console.log(`logo.png gerado: ${W}x${H}, ${(png.length / 1024).toFixed(1)} KB`)
