// Correções de forma que não exigem reescrever o texto: intertítulos formulaicos,
// excerpt sem ponto final e frases em que o texto fala de si mesmo.
// Uso: node scripts/polir.js [--aplicar]

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const aplicar = process.argv.includes('--aplicar')

// Intertítulo formulaico não informa nada ao leitor nem ao Google. Tirar o <h2>
// mantém o parágrafo e melhora o texto.
const H2_GENERICO = new RegExp(
  '<h2[^>]*>\\s*(introdu[çc][ãa]o|conclus[ãa]o|considera[çc][õo]es finais|contexto hist[óo]rico|desafios e perspectivas( futuras)?|[^<]*leitor brasileiro[^<]*)\\s*</h2>\\s*',
  'gi'
)

const AUTORREFERENCIA = [
  [/\b(Este|Neste) artigo,? (explora|apresenta|discute|aborda|re[úu]ne|mostra|analisa)\b[^.]*\.\s*/gi, ''],
  [/\b(Esta|Nesta) mat[ée]ria,? (explora|apresenta|discute|aborda|re[úu]ne|mostra|analisa)\b[^.]*\.\s*/gi, ''],
  [/\bEste guia (re[úu]ne|apresenta|traz)\b[^.]*\.\s*/gi, ''],
  [/\bO objetivo (deste|desta) (texto|artigo|mat[ée]ria)\b[^.]*\.\s*/gi, ''],
  [/\bneste artigo\b,?\s*/gi, ''],
  [/\bnesta mat[ée]ria\b,?\s*/gi, ''],
]

function pontuarExcerpt(e) {
  const s = String(e || '').trim()
  if (!s || /[.!?]$/.test(s)) return s
  return s.replace(/[,;:\-–—]+$/, '') + '.'
}

let arquivos = 0
let h2 = 0
let auto = 0
let exc = 0

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

    const semH2 = String(a.contentHtml || '').replace(H2_GENERICO, '')
    if (semH2 !== a.contentHtml) {
      a.contentHtml = semH2
      h2++
      mudou = true
    }

    let corpo = a.contentHtml
    for (const [re, sub] of AUTORREFERENCIA) corpo = corpo.replace(re, sub)
    corpo = corpo.replace(/<p>\s*<\/p>/g, '')
    if (corpo !== a.contentHtml) {
      a.contentHtml = corpo
      auto++
      mudou = true
    }

    const novoExc = pontuarExcerpt(a.excerpt)
    if (novoExc !== a.excerpt) {
      a.excerpt = novoExc
      exc++
      mudou = true
    }

    if (mudou) {
      arquivos++
      if (aplicar) fs.writeFileSync(p, JSON.stringify(a, null, 2))
    }
  }
}

console.log(`${arquivos} arquivos ${aplicar ? 'polidos' : 'a polir'} | ${h2} intertítulos formulaicos removidos | ${auto} autorreferências | ${exc} excerpts pontuados`)
if (!aplicar) console.log('rode com --aplicar para gravar')
