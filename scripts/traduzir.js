// Traduz as matérias em português para inglês e espanhol.
// Uso: node scripts/traduzir.js [--force]
// Pula o que já existe, a menos que --force.

const fs = require('fs')
const path = require('path')
const { askJson } = require('./ia-pool')

const ROOT = path.join(__dirname, '..')
const PT_DIR = path.join(ROOT, 'content', 'articles')
const LOG = path.join(__dirname, 'traduzir.log')

const LANGS = {
  en: { nome: 'inglês', author: 'Daniele Morais' },
  es: { nome: 'espanhol', author: 'Daniele Morais' },
}

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`
  console.log(line)
  fs.appendFileSync(LOG, line + '\n')
}

const ALLOWED = /<(?!\/?(p|h2|h3|ul|ol|li|strong|em|blockquote)\b)[a-z][^>]*>/gi
const sanitize = (h) => String(h || '').replace(ALLOWED, '')

async function translate(article, lang) {
  const { nome } = LANGS[lang]
  const prompt = `Você é tradutor profissional de jornalismo. Traduza esta matéria do português brasileiro para ${nome}, com fluência de publicação nativa (tradução jornalística, não literal). NÃO adicione nem remova informação. Preserve EXATAMENTE as tags HTML (<p> <h2> <h3> <ul> <ol> <li> <strong> <em> <blockquote>).

Responda APENAS com JSON válido, sem texto antes ou depois:
{"title":"título traduzido","seoTitle":"versão curta do título, máximo 58 caracteres","subtitle":"...","excerpt":"máximo 165 caracteres","tags":["tags traduzidas"],"contentHtml":"corpo traduzido em HTML"}

MATÉRIA ORIGINAL:
${JSON.stringify({
    title: article.title,
    subtitle: article.subtitle,
    excerpt: article.excerpt,
    tags: article.tags,
    contentHtml: article.contentHtml,
  })}`

  const tr = await askJson(prompt, { maxTokens: 8192, onLog: log })
  if (!tr.title || !tr.contentHtml) throw new Error('tradução incompleta')
  return {
    ...article,
    title: tr.title,
    seoTitle: (tr.seoTitle || tr.title).slice(0, 60),
    subtitle: tr.subtitle || article.subtitle,
    excerpt: (tr.excerpt || '').slice(0, 170),
    tags: Array.isArray(tr.tags) && tr.tags.length ? tr.tags.slice(0, 6) : article.tags,
    contentHtml: sanitize(tr.contentHtml),
    author: LANGS[lang].author,
    lang,
  }
}

async function main() {
  const force = process.argv.includes('--force')
  const slugs = fs.readdirSync(PT_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''))
  log(`traduzindo ${slugs.length} matérias para ${Object.keys(LANGS).join(' e ')}`)

  let ok = 0
  let skip = 0
  let fail = 0

  for (const slug of slugs) {
    const article = JSON.parse(fs.readFileSync(path.join(PT_DIR, slug + '.json'), 'utf8'))
    for (const lang of Object.keys(LANGS)) {
      const dir = path.join(ROOT, 'content', lang, 'articles')
      fs.mkdirSync(dir, { recursive: true })
      const out = path.join(dir, slug + '.json')
      if (fs.existsSync(out) && !force) { skip++; continue }
      try {
        const t0 = Date.now()
        const translated = await translate(article, lang)
        fs.writeFileSync(out, JSON.stringify(translated, null, 2))
        ok++
        log(`ok [${lang}] ${slug} (${Math.round((Date.now() - t0) / 1000)}s)`)
      } catch (e) {
        fail++
        log(`FALHOU [${lang}] ${slug}: ${e.message}`)
      }
    }
  }
  log(`fim: ${ok} traduzidas, ${skip} puladas, ${fail} falhas`)
}

main().catch((e) => {
  log('ERRO FATAL: ' + (e.stack || e.message))
  process.exit(1)
})
