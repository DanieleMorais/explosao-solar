// Aprofunda matérias evergreen que ficaram abaixo do padrão do portal e
// regenera as traduções. Matérias de notícia (com sourceUrl) são ignoradas:
// elas têm padrão de tamanho próprio.
//
// Uso: node scripts/enriquecer.js [--piso 620] [--aplicar]

const fs = require('fs')
const path = require('path')
const { askJson } = require('./ia-pool')
const { adquirir } = require('./trava')
const { REGRAS_DE_FATO, REGRAS_DE_FORMA, TAGS_PERMITIDAS, sanitize: san, contaPalavras: cw, cortar, validar } = require('./regras-editoriais')

const ROOT = path.join(__dirname, '..')
const CONTENT = path.join(ROOT, 'content')
const PT_DIR = path.join(CONTENT, 'articles')
const LOG = path.join(__dirname, 'enriquecer.log')

const LANGS = { en: { nome: 'inglês', author: 'Daniele Morais' }, es: { nome: 'espanhol', author: 'Daniele Morais' } }

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`
  console.log(line)
  fs.appendFileSync(LOG, line + '\n')
}

const sanitize = san
const conta = cw

async function aprofundar(a, piso) {
  const alvo = piso >= 1500 ? '2.000 a 2.400' : '750 a 950'
  const prompt = `Você é editor sênior do portal brasileiro "Explosão Solar". A matéria abaixo ficou curta (${conta(a.contentHtml)} palavras) para o padrão do portal. Reescreva-a com MUITO mais profundidade, chegando a ${alvo} palavras${piso >= 1500 ? ' (leitura de 10+ minutos, padrão de revista premium, 6 a 9 seções <h2> que esgotem o tema)' : ''}.

COMO APROFUNDAR:
- Acrescente contexto histórico, explicação didática dos mecanismos, exemplos concretos e implicações práticas para o leitor brasileiro.
- Organize com subtítulos <h2> e feche com uma conclusão que amarre o texto.
- Nada de encheção: cada parágrafo precisa informar.
- Mantenha o ASSUNTO, mas NÃO copie FATOS: toda afirmação factual do texto original que você não reconheça como conhecimento consolidado deve ser CORTADA na reescrita — nomes de tratados e planos, composição de órgãos, percentuais e alíquotas, anos exatos de mudança de regra, e quem mediou/criou/presidiu o quê. Não tente "melhorar" a frase duvidosa: apague.
${REGRAS_DE_FATO}
${REGRAS_DE_FORMA}
- Português brasileiro impecável, tom de jornal premium.

Responda APENAS com JSON válido:
{"title":"máx 72 caracteres, caixa de frase","seoTitle":"entre 45 e 58 caracteres","subtitle":"uma frase que acrescente informação ao título","excerpt":"entre 120 e 160 caracteres, terminado em ponto final","tags":["4 a 6 tags"],"contentHtml":"corpo em HTML usando apenas <p> <h2> <h3> <ul> <ol> <li> <strong> <em>"}

MATÉRIA ATUAL:
${JSON.stringify({ title: a.title, subtitle: a.subtitle, category: a.category, contentHtml: a.contentHtml })}`

  const novo = await askJson(prompt, { maxTokens: 16000, onLog: log })
  if (!novo.title || !novo.contentHtml) throw new Error('resposta incompleta')
  novo.contentHtml = sanitize(novo.contentHtml)
  const erros = validar(novo, { minPalavras: piso >= 1500 ? 1700 : 620, maxTitulo: 78 })
  if (erros.length) throw new Error('reprovada: ' + erros.join('; '))
  return { ...novo, palavras: conta(novo.contentHtml) }
}

async function traduzir(article, lang) {
  const prompt = `Traduza esta matéria jornalística do português brasileiro para ${LANGS[lang].nome}, com fluência de publicação nativa. Preserve as tags HTML. NÃO adicione nem remova informação.

Responda APENAS com JSON válido:
{"title":"...","seoTitle":"máx 58 caracteres","subtitle":"...","excerpt":"máx 165 caracteres","tags":[...],"contentHtml":"..."}

MATÉRIA:
${JSON.stringify({ title: article.title, subtitle: article.subtitle, excerpt: article.excerpt, tags: article.tags, contentHtml: article.contentHtml })}`

  const tr = await askJson(prompt, { maxTokens: 8192, onLog: log })
  if (!tr.title || !tr.contentHtml) throw new Error('tradução incompleta')
  return {
    ...article,
    title: tr.title,
    seoTitle: cortar(tr.seoTitle || tr.title, 58),
    subtitle: tr.subtitle || article.subtitle,
    excerpt: cortar(tr.excerpt || '', 168),
    tags: Array.isArray(tr.tags) && tr.tags.length ? tr.tags.slice(0, 6) : article.tags,
    contentHtml: sanitize(tr.contentHtml),
    author: LANGS[lang].author,
    lang,
  }
}

async function main() {
  if (!adquirir('enriquecer', log)) return

  const args = process.argv.slice(2)
  const piso = args.includes('--piso') ? parseInt(args[args.indexOf('--piso') + 1], 10) : 620
  const limite = args.includes('--limite') ? parseInt(args[args.indexOf('--limite') + 1], 10) : 999
  const aplicar = args.includes('--aplicar')

  const alvos = []
  for (const f of fs.readdirSync(PT_DIR)) {
    if (!f.endsWith('.json')) continue
    const a = JSON.parse(fs.readFileSync(path.join(PT_DIR, f), 'utf8'))
    if (a.sourceUrl) continue
    const w = conta(a.contentHtml)
    if (w < piso) alvos.push({ a, w })
  }
  alvos.sort((x, y) => x.w - y.w)
  alvos.splice(limite)

  log(`${alvos.length} matéria(s) evergreen abaixo de ${piso} palavras${aplicar ? '' : ' (simulação — use --aplicar)'}`)
  if (!aplicar) {
    alvos.forEach(({ a, w }) => console.log(`  ${a.slug} (${w}p)`))
    return
  }

  let ok = 0
  for (const { a, w } of alvos) {
    try {
      const novo = await aprofundar(a, piso)
      const atualizado = {
        ...a,
        title: novo.title,
        seoTitle: cortar(novo.seoTitle || novo.title, 58),
        subtitle: novo.subtitle || a.subtitle,
        excerpt: cortar(novo.excerpt || a.excerpt, 168),
        tags: Array.isArray(novo.tags) && novo.tags.length ? novo.tags.slice(0, 6) : a.tags,
        contentHtml: sanitize(novo.contentHtml),
        readingMinutes: Math.max(3, Math.round(novo.palavras / 200)),
        updatedAt: new Date().toISOString(),
      }
      fs.writeFileSync(path.join(PT_DIR, a.slug + '.json'), JSON.stringify(atualizado, null, 2))
      log(`aprofundada [${a.categorySlug}] ${a.slug}: ${w} → ${novo.palavras} palavras`)

      for (const lang of Object.keys(LANGS)) {
        try {
          const dir = path.join(CONTENT, lang, 'articles')
          fs.mkdirSync(dir, { recursive: true })
          fs.writeFileSync(path.join(dir, a.slug + '.json'), JSON.stringify(await traduzir(atualizado, lang), null, 2))
        } catch (e) {
          log(`tradução ${lang} falhou [${a.slug}]: ${e.message}`)
        }
      }
      ok++
    } catch (e) {
      log(`falhou [${a.slug}]: ${e.message}`)
    }
  }
  log(`fim: ${ok}/${alvos.length} aprofundadas`)
}

main().catch((e) => {
  log('ERRO FATAL: ' + (e.stack || e.message))
  process.exit(1)
})
