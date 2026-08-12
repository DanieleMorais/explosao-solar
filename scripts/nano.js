// Gera uma ILUSTRAÇÃO EDITORIAL via Nano Banana (Gemini image API) pra uma matéria.
// Arte conceitual no tema da marca — nunca foto realista de evento real.
// Uso: node scripts/nano.js <slug> [saida.png]
const fs = require('fs')
const path = require('path')

const KEY_FILE = 'C:/Users/Administrator/OneDrive/Documentos/documentos/Chave de API.txt'
const MODELOS = ['gemini-3-pro-image', 'gemini-2.5-flash-image', 'gemini-3.1-flash-image']

const CAT = {
  mundo: 'geopolítica e mundo', brasil: 'Brasil', politica: 'política', economia: 'economia e finanças',
  tecnologia: 'tecnologia e inteligência artificial', ciencia: 'ciência', esportes: 'esportes', cultura: 'cultura',
}

function lerKey() {
  const linhas = fs.readFileSync(KEY_FILE, 'utf8').split(/\r?\n/).map((s) => s.trim())
  const k = linhas.find((l) => /^(AQ\.|AIza)[A-Za-z0-9._-]{20,}$/.test(l))
  if (!k) throw new Error('chave não encontrada no arquivo')
  return k
}

function prompt(a) {
  const tema = CAT[a.categorySlug] || 'notícias'
  return `Premium editorial illustration for a news article about ${tema}. Topic: "${a.title}". Style: modern conceptual digital art, clean and elegant, dark navy background (#0C0E1A) with warm orange and gold accents (solar theme), symbolic and abstract, magazine-quality. Absolutely NO text, NO words, NO letters, NO logos, NO watermarks. Do NOT depict real identifiable people or a photorealistic scene of a real event — keep it symbolic/conceptual. Square 1:1 composition.`
}

async function gerar(slug, saida) {
  const key = lerKey()
  const a = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', 'articles', slug + '.json'), 'utf8'))
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt(a) }] }],
    generationConfig: { responseModalities: ['IMAGE'] },
  })

  let ultimoErro = ''
  for (const modelo of MODELOS) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(60000),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) {
      ultimoErro = `${modelo}: ${j?.error?.message || r.status}`
      continue
    }
    const parte = (j.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data)
    if (!parte) {
      ultimoErro = `${modelo}: sem imagem na resposta (${JSON.stringify(j).slice(0, 160)})`
      continue
    }
    const out = saida || path.join(__dirname, '..', 'public', 'ia', slug + '.png')
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, Buffer.from(parte.inlineData.data, 'base64'))
    return { out, modelo }
  }
  throw new Error('falhou: ' + ultimoErro)
}

if (require.main === module) {
  gerar(process.argv[2], process.argv[3])
    .then((r) => console.log('✅ imagem IA:', r.out, '(modelo', r.modelo + ')'))
    .catch((e) => {
      console.error('ERRO:', e.message)
      process.exit(1)
    })
}

module.exports = { gerar }
