// Robô de notícias do Explosão Solar.
// Busca notícias em feeds do mundo todo, reescreve em PT-BR com IA (com atribuição),
// traduz para EN e ES, publica os JSONs e redeploya o site na Vercel.
//
// Uso: node scripts/robo-noticias.js [--max 5] [--dry]
// Agendado via Task Scheduler do Windows (3x/dia). Sem dependências npm.

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { askIA, askJson } = require('./ia-pool')
const { REGRAS_DE_FORMA, TAGS_PERMITIDAS, sanitize: sanitizeHtml, contaPalavras, cortar, slugify: slugCurto } = require('./regras-editoriais')
const { adquirir } = require('./trava')

const ROOT = path.join(__dirname, '..')
const CONTENT = path.join(ROOT, 'content')
const STATE_FILE = path.join(CONTENT, 'robo-state.json')
const LOG_FILE = path.join(__dirname, 'robo.log')

const TARGET_PER_CAT = 100
const RAMP_DAILY = 15
const CRUISE_DAILY = 5

const FEEDS = {
  mundo: [
    { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
    { name: 'DW', url: 'https://rss.dw.com/rdf/rss-en-world' },
  ],
  brasil: [
    { name: 'Agência Brasil', url: 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml' },
    { name: 'G1', url: 'https://g1.globo.com/rss/g1/' },
  ],
  politica: [
    { name: 'Agência Brasil', url: 'https://agenciabrasil.ebc.com.br/rss/politica/feed.xml' },
    { name: 'The Guardian', url: 'https://www.theguardian.com/politics/rss' },
  ],
  economia: [
    { name: 'Agência Brasil', url: 'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml' },
    { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
  ],
  tecnologia: [
    { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
  ],
  ciencia: [
    { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/all.xml' },
    { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml' },
  ],
  esportes: [
    { name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml' },
    { name: 'ESPN', url: 'https://www.espn.com/espn/rss/news' },
  ],
  cultura: [
    { name: 'The Guardian', url: 'https://www.theguardian.com/culture/rss' },
    { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml' },
  ],
}

const CAT_NAMES = {
  mundo: 'Mundo', brasil: 'Brasil', politica: 'Política', economia: 'Economia',
  tecnologia: 'Tecnologia', ciencia: 'Ciência', esportes: 'Esportes', cultura: 'Cultura',
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`
  console.log(line)
  fs.appendFileSync(LOG_FILE, line + '\n')
}

function loadEnv() {
  const f = path.join(ROOT, '.env.robo')
  if (!fs.existsSync(f)) return {}
  const env = {}
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/^([A-Z_]+)=(.+)$/gm)) env[m[1]] = m[2].trim()
  return env
}

const ENV = loadEnv()

function loadState() {
  if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
  return { seen: [], days: {} }
}

function saveState(state) {
  state.seen = state.seen.slice(-3000)
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

function today() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
}

function countByCategory() {
  const counts = {}
  for (const slug of Object.keys(FEEDS)) counts[slug] = 0
  for (const f of fs.readdirSync(path.join(CONTENT, 'articles'))) {
    if (!f.endsWith('.json')) continue
    try {
      const a = JSON.parse(fs.readFileSync(path.join(CONTENT, 'articles', f), 'utf8'))
      if (counts[a.categorySlug] !== undefined) counts[a.categorySlug]++
    } catch {}
  }
  return counts
}

function stripHtml(s) {
  return s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim()
}

function parseFeed(xml) {
  const items = []
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || []
  for (const b of blocks.slice(0, 15)) {
    const get = (tag) => {
      const m = b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
      return m ? stripHtml(m[1]) : ''
    }
    let link = get('link')
    if (!link) {
      const m = b.match(/<link[^>]*href="([^"]+)"/i)
      link = m ? m[1] : ''
    }
    const title = get('title')
    const desc = get('description') || get('summary') || get('content')
    if (title && link) items.push({ title, link, desc: desc.slice(0, 600) })
  }
  return items
}

async function fetchFeed(feed) {
  try {
    const r = await fetch(feed.url, { headers: { 'User-Agent': 'ExplosaoSolarBot/1.0 (+https://explosaosolar.com)' }, signal: AbortSignal.timeout(20000) })
    if (!r.ok) throw new Error('HTTP ' + r.status)
    return parseFeed(await r.text()).map((i) => ({ ...i, source: feed.name }))
  } catch (e) {
    log(`feed falhou ${feed.name} (${feed.url}): ${e.message}`)
    return []
  }
}


function extractJson(text) {
  const cleaned = text.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('sem JSON na resposta')
  return JSON.parse(cleaned.slice(start, end + 1))
}

function slugify(title) {
  return title.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 70).replace(/-$/, '')
}

const sanitize = sanitizeHtml

const ATTRIBUTION = {
  pt: (s) => `<p><em>Com informações de ${s}.</em></p>`,
  en: (s) => `<p><em>With information from ${s}.</em></p>`,
  es: (s) => `<p><em>Con información de ${s}.</em></p>`,
}

async function writeArticle(item, catSlug) {
  const ptPrompt = `Você é repórter sênior do portal de notícias brasileiro "Explosão Solar". Com base nesta notícia real publicada por ${item.source}:

TÍTULO: ${item.title}
RESUMO: ${item.desc}

Escreva uma matéria jornalística ORIGINAL em português brasileiro (300 a 600 palavras) sobre esse fato, com suas próprias palavras.

REGRA DE OURO: você só pode afirmar o que está literalmente em TÍTULO e RESUMO acima. O que não está ali não existe. PROIBIDO, sem exceção:
(a) seção ou parágrafo de perfil, biografia, histórico ou ficha técnica — "Quem é X", "Fundado em...", "O partido/empresa/entidade é...";
(b) classificar ideologia, espectro político, porte, origem, ano de fundação ou posição de qualquer pessoa, partido, empresa ou instituição;
(c) repercussão inventada: "nas redes sociais", "analistas apontam", "observadores avaliam", "especialistas divergem", "a notícia gerou reações";
(d) ineditismo ou superlativo: "pela primeira vez", "nunca antes", "o maior";
(e) data, hora, dia da semana ou cidade que não esteja no resumo;
(f) declarações entre aspas.
Quando faltar informação, escreva contexto GERAL e permanente do tema (como funciona uma convenção partidária, o que é o calendário eleitoral) — nunca preencha o vazio com fato novo. Se o resumo só der para 3 parágrafos, entregue 3 parágrafos: matéria curta e correta vale mais que longa e inventada. A contagem de palavras NUNCA justifica acrescentar fato.

Responda APENAS com JSON válido neste formato:
{"title":"título forte em PT-BR, máx 80 chars","seoTitle":"versão curta do título, máx 58 chars","subtitle":"uma frase que expande o título","excerpt":"resumo de até 165 chars","tags":["4 a 6 tags em pt"],"contentHtml":"corpo em HTML usando apenas <p> <h2> <ul> <li> <strong> <em>"}`

  const pt = await askJson(ptPrompt, { maxTokens: 6144, onLog: log })
  const proibido = [
    [/fundad[oa] em d{4}/i, 'ano de fundação inventado'],
    [/(centro-esquerda|centro-direita|extrema-(esquerda|direita))/i, 'classificação ideológica inventada'],
    [/(nas redes sociais|analistas apontam|observadores avaliam|especialistas divergem|gerou reações)/i, 'repercussão fabricada'],
    [/(pela primeira vez|nunca antes)/i, 'ineditismo inventado'],
    [/<blockquote/i, 'citação em bloco'],
  ]
  for (const [re, motivo] of proibido) {
    if (re.test(pt.contentHtml)) throw new Error('reprovada pelo filtro factual: ' + motivo)
  }

  const slugBase = slugCurto(pt.title)
  let slug = slugBase
  let n = 2
  while (fs.existsSync(path.join(CONTENT, 'articles', slug + '.json'))) slug = `${slugBase}-${n++}`

  const now = new Date()
  const base = {
    slug,
    title: pt.title,
    seoTitle: cortar(pt.seoTitle || pt.title, 58),
    subtitle: pt.subtitle,
    category: CAT_NAMES[catSlug],
    categorySlug: catSlug,
    excerpt: cortar(pt.excerpt || '', 168),
    author: 'Daniele Morais',
    publishedAt: now.toISOString(),
    readingMinutes: Math.max(3, Math.round(stripHtml(pt.contentHtml).split(/\s+/).length / 200)),
    tags: (pt.tags || []).slice(0, 6),
    sourceName: item.source,
    sourceUrl: item.link,
    contentHtml: sanitize(pt.contentHtml) + ATTRIBUTION.pt(item.source),
  }
  fs.writeFileSync(path.join(CONTENT, 'articles', slug + '.json'), JSON.stringify(base, null, 2))

  for (const lang of ['en', 'es']) {
    const langName = lang === 'en' ? 'inglês' : 'espanhol'
    try {
      const trPrompt = `Traduza esta matéria jornalística do português para ${langName}, com fluência de publicação nativa. Preserve as tags HTML. Responda APENAS com JSON válido:
{"title":"...","seoTitle":"máx 58 chars","subtitle":"...","excerpt":"máx 165 chars","tags":[...],"contentHtml":"..."}

MATÉRIA:
${JSON.stringify({ title: base.title, seoTitle: base.seoTitle, subtitle: base.subtitle, excerpt: base.excerpt, tags: base.tags, contentHtml: pt.contentHtml })}`
      const tr = await askJson(trPrompt, { maxTokens: 6144, onLog: log })
      const author = lang === 'en' ? 'Daniele Morais' : 'Daniele Morais'
      fs.writeFileSync(
        path.join(CONTENT, lang, 'articles', slug + '.json'),
        JSON.stringify({ ...base, ...tr, slug, author, contentHtml: sanitize(tr.contentHtml) + ATTRIBUTION[lang](item.source) }, null, 2)
      )
    } catch (e) {
      log(`tradução ${lang} falhou pra ${slug}: ${e.message}`)
    }
  }
  return slug
}

async function pingIndexNow(slugs) {
  try {
    const urls = slugs.flatMap((s) => [
      `https://explosaosolar.com/noticia/${s}`,
      `https://explosaosolar.com/en/noticia/${s}`,
      `https://explosaosolar.com/es/noticia/${s}`,
    ])
    urls.push('https://explosaosolar.com/')
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'explosaosolar.com',
        key: 'a7f3e9c14b2d4868a1c5f0e6d9b3a2c7',
        keyLocation: 'https://explosaosolar.com/a7f3e9c14b2d4868a1c5f0e6d9b3a2c7.txt',
        urlList: urls,
      }),
    })
    log(`IndexNow HTTP ${r.status} (${urls.length} URLs)`)
  } catch (e) {
    log('IndexNow falhou: ' + e.message)
  }
  try {
    const r = await fetch('https://pubsubhubbub.appspot.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'hub.mode': 'publish', 'hub.url': 'https://explosaosolar.com/feed.xml' }),
    })
    log(`WebSub HTTP ${r.status}`)
  } catch (e) {
    log('WebSub falhou: ' + e.message)
  }
}

async function main() {
  if (!adquirir('robo', log)) return
  const args = process.argv.slice(2)
  const maxArg = args.includes('--max') ? parseInt(args[args.indexOf('--max') + 1], 10) : 5
  const dry = args.includes('--dry')

  const state = loadState()
  const counts = countByCategory()
  const ramping = Object.values(counts).some((c) => c < TARGET_PER_CAT)
  const dailyCap = ramping ? RAMP_DAILY : CRUISE_DAILY
  const usedToday = state.days[today()] || 0
  const budget = Math.min(maxArg, dailyCap - usedToday)

  log(`início: max=${maxArg} cap-diário=${dailyCap} usado-hoje=${usedToday} orçamento=${budget} contagem=${JSON.stringify(counts)}`)
  if (budget <= 0) {
    log('cota diária atingida, nada a fazer')
    return
  }

  const catOrder = Object.keys(FEEDS).sort((a, b) => counts[a] - counts[b])
  const published = []

  for (const cat of [...catOrder, ...catOrder]) {
    if (published.length >= budget) break
    const feeds = FEEDS[cat]
    let items = []
    for (const f of feeds) {
      items = items.concat(await fetchFeed(f))
      if (items.length >= 8) break
    }
    const fresh = items.find((i) => !state.seen.includes(i.link))
    if (!fresh) continue
    state.seen.push(fresh.link)
    try {
      const slug = await writeArticle(fresh, cat)
      published.push(slug)
      counts[cat]++
      log(`publicado [${cat}] ${slug} (fonte: ${fresh.source})`)
    } catch (e) {
      log(`falha ao gerar [${cat}] "${fresh.title.slice(0, 60)}": ${e.message}`)
    }
  }

  state.days[today()] = usedToday + published.length
  saveState(state)

  if (!published.length) {
    log('nenhuma matéria nova nesta rodada')
    return
  }

  if (dry) {
    log(`dry-run: ${published.length} matérias geradas, sem deploy`)
    return
  }

  try {
    execSync('git add -A && git commit -q -m "Robô: novas matérias do dia"', { cwd: ROOT, stdio: 'pipe', shell: 'cmd.exe' })
  } catch (e) {
    log('git commit falhou (seguindo mesmo assim): ' + e.message)
  }
  try {
    execSync('vercel deploy --prod --yes', { cwd: ROOT, stdio: 'pipe', shell: 'cmd.exe', timeout: 600000 })
    log(`deploy ok com ${published.length} matérias novas`)
  } catch (e) {
    log('DEPLOY FALHOU: ' + e.message)
    return
  }
  await pingIndexNow(published)
  log('rodada concluída: ' + published.join(', '))
}

main().catch((e) => {
  log('ERRO FATAL: ' + (e.stack || e.message))
  process.exit(1)
})
