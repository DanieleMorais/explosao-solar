// Normaliza tipografia e corta títulos longos em todas as matérias.
// O hífen não separável (U+2011) quebra Ctrl+F, busca interna e indexação.
// Uso: node scripts/normalizar.js [--aplicar]

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const aplicar = process.argv.includes('--aplicar')

const TROCAS = [
  [new RegExp('\u2011','g'), '-'], // hífen não separável: quebra Ctrl+F e indexação
  [new RegExp('\u2010','g'), '-'],
  [new RegExp('\u00ad','g'), ''], // hífen suave invisível
  [new RegExp('[\u2002\u2003\u2009\u202f]','g'), ' '], // espaços tipográficos
  [new RegExp('\u00a0','g'), ' '],
]

function normalizar(s) {
  let out = String(s)
  for (const [re, sub] of TROCAS) out = out.replace(re, sub)
  return out
}

function cortarTitulo(t, max = 76) {
  if (t.length <= max) return t
  const corte = t.slice(0, max)
  const espaco = corte.lastIndexOf(' ')
  return corte.slice(0, espaco > max * 0.6 ? espaco : max).replace(/[\s,;:\-–—]+$/, '')
}

let arquivos = 0
let campos = 0
let titulos = 0

for (const lang of ['pt', 'en', 'es']) {
  const dir = lang === 'pt' ? path.join(ROOT, 'content', 'articles') : path.join(ROOT, 'content', lang, 'articles')
  if (!fs.existsSync(dir)) continue

  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue
    const p = path.join(dir, f)
    let a
    try {
      a = JSON.parse(fs.readFileSync(p, 'utf8'))
    } catch {
      continue
    }

    let mudou = false
    for (const campo of ['title', 'seoTitle', 'subtitle', 'excerpt', 'contentHtml']) {
      if (typeof a[campo] !== 'string') continue
      const novo = normalizar(a[campo])
      if (novo !== a[campo]) {
        a[campo] = novo
        campos++
        mudou = true
      }
    }
    if (Array.isArray(a.tags)) {
      const t = a.tags.map(normalizar)
      if (JSON.stringify(t) !== JSON.stringify(a.tags)) {
        a.tags = t
        mudou = true
      }
    }
    if (a.title && a.title.length > 78) {
      a.title = cortarTitulo(a.title)
      titulos++
      mudou = true
    }
    if (a.seoTitle && a.seoTitle.length > 60) {
      a.seoTitle = cortarTitulo(a.seoTitle, 58)
      mudou = true
    }

    if (mudou) {
      arquivos++
      if (aplicar) fs.writeFileSync(p, JSON.stringify(a, null, 2))
    }
  }
}

console.log(`${arquivos} arquivos ${aplicar ? 'normalizados' : 'a normalizar'} | ${campos} campos com tipografia corrigida | ${titulos} títulos encurtados`)
if (!aplicar) console.log('rode com --aplicar para gravar')
