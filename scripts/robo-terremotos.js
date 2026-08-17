// Robô de terremotos: lê a atividade sísmica do USGS (dados oficiais, tempo real),
// pega os abalos relevantes (fortes, com tsunami ou alerta de impacto), cruza com o
// que a imprensa está publicando e escreve a matéria — sempre a partir dos fatos do
// USGS e do texto real das fontes, nunca inventando número, vítima ou local.
//
// Uso: node scripts/robo-terremotos.js [--max 3] [--dry]

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { askJson } = require('./ia-pool')
const { adquirir } = require('./trava')
const { extrair } = require('./extrator')
const { REGRAS_DE_FORMA, TAGS_PERMITIDAS, sanitize, contaPalavras, cortar, slugify } = require('./regras-editoriais')

const ROOT = path.join(__dirname, '..')
const CONTENT = path.join(ROOT, 'content')
const PT_DIR = path.join(CONTENT, 'articles')
const STATE_FILE = path.join(CONTENT, 'terremotos-state.json')
const LOG = path.join(__dirname, 'terremotos.log')
const USGS = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary'
const LANGS = { en: 'inglês', es: 'espanhol' }

const PAISES = {
  Indonesia: 'Indonésia', Colombia: 'Colômbia', Spain: 'Espanha', Russia: 'Rússia', Japan: 'Japão',
  Chile: 'Chile', Mexico: 'México', Peru: 'Peru', Turkey: 'Turquia', Greece: 'Grécia', Italy: 'Itália',
  Philippines: 'Filipinas', 'Papua New Guinea': 'Papua-Nova Guiné', 'New Zealand': 'Nova Zelândia',
  Iran: 'Irã', Afghanistan: 'Afeganistão', Pakistan: 'Paquistão', India: 'Índia', China: 'China',
  'United States': 'Estados Unidos', Alaska: 'Alasca', California: 'Califórnia', Argentina: 'Argentina',
  Ecuador: 'Equador', Bolivia: 'Bolívia', Panama: 'Panamá', Nicaragua: 'Nicarágua', Vanuatu: 'Vanuatu',
  Fiji: 'Fiji', Tonga: 'Tonga', Taiwan: 'Taiwan', Morocco: 'Marrocos', Nepal: 'Nepal', Myanmar: 'Mianmar',
}
const DIRS = {
  N: 'norte', S: 'sul', E: 'leste', W: 'oeste', NE: 'nordeste', NW: 'noroeste', SE: 'sudeste', SW: 'sudoeste',
  NNE: 'norte-nordeste', ENE: 'leste-nordeste', ESE: 'leste-sudeste', SSE: 'sul-sudeste',
  SSW: 'sul-sudoeste', WSW: 'oeste-sudoeste', WNW: 'oeste-noroeste', NNW: 'norte-noroeste',
}
const ALERTAS = {
  green: 'verde (impacto pequeno estimado)', yellow: 'amarelo (impacto local estimado)',
  orange: 'laranja (impacto alto estimado)', red: 'vermelho (impacto severo estimado)',
}

const log = (m) => { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); try { fs.appendFileSync(LOG, l + '\n') } catch {} }

function carregarEnv() {
  const f = path.join(ROOT, '.env.robo')
  if (!fs.existsSync(f)) return
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/^([A-Z_0-9]+)=(.+)$/gm)) process.env[m[1]] = process.env[m[1]] || m[2].trim()
}
const loadState = () => (fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : { vistos: [] })
const saveState = (v) => fs.writeFileSync(STATE_FILE, JSON.stringify({ vistos: v.slice(-500) }, null, 2))

function traduzirLocal(place) {
  if (!place) return ''
  let s = String(place)
  const m = s.match(/^(\d+)\s*km\s+([NSEW]{1,3})\s+of\s+(.+)$/i)
  if (m) s = `${m[1]} km a ${DIRS[m[2].toUpperCase()] || m[2]} de ${m[3]}`
  const i = s.lastIndexOf(', ')
  if (i > -1) { const p = s.slice(i + 2).trim(); if (PAISES[p]) s = s.slice(0, i + 2) + PAISES[p] }
  return s
}

// palavra de busca pra imprensa: cidade/região do epicentro + país
function chaveBusca(place) {
  let s = String(place || '').replace(/^\d+\s*km\s+[NSEW]{1,3}\s+of\s+/i, '').replace(/^\d+\s*km\s+of\s+/i, '')
  return s.trim()
}

const idDeUrl = (u) => (String(u || '').match(/eventpage\/([a-z0-9]+)/i) || [])[1] || null

// mapeia eventos do USGS já cobertos (pelo robô de alertas ou por este) -> slug,
// pra ENRIQUECER a matéria existente em vez de criar duplicata.
function mapaCobertos() {
  const m = new Map()
  for (const f of fs.readdirSync(PT_DIR)) {
    if (!f.endsWith('.json')) continue
    try {
      const a = JSON.parse(fs.readFileSync(path.join(PT_DIR, f), 'utf8'))
      const id = idDeUrl(a.sourceUrl)
      if (id) m.set(id, a.slug)
    } catch {}
  }
  return m
}

async function feedUSGS(nome) {
  const r = await fetch(`${USGS}/${nome}.geojson`, { headers: { 'User-Agent': 'ExplosaoSolarBot/1.0' }, signal: AbortSignal.timeout(20000) })
  if (!r.ok) throw new Error('USGS HTTP ' + r.status)
  return (await r.json()).features || []
}

function decod(s) {
  return String(s).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
}

async function noticiasReais(chave) {
  try {
    const q = encodeURIComponent(`terremoto ${chave}`)
    const r = await fetch(`https://news.google.com/rss/search?q=${q}&hl=pt-BR&gl=BR&ceid=BR:pt-419`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ExplosaoSolarBot/1.0; +https://explosaosolar.com)' },
      signal: AbortSignal.timeout(20000),
    })
    if (!r.ok) return []
    const xml = await r.text()
    const fontes = []
    for (const bloco of (xml.match(/<item>[\s\S]*?<\/item>/g) || []).slice(0, 6)) {
      if (fontes.length >= 3) break
      const link = decod((bloco.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '').trim()
      const titulo = decod((bloco.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').replace(/<[^>]+>/g, '').trim()
      const fonte = decod((bloco.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || 'imprensa').trim()
      if (!link) continue
      try {
        const f = await extrair(link, { minPalavras: 150 })
        fontes.push({ titulo: titulo || f.titulo, fonte, texto: f.texto, url: f.url })
      } catch {}
    }
    return fontes
  } catch {
    return []
  }
}

function dadosDoAbalo(q) {
  const p = q.properties, c = q.geometry.coordinates
  const dataFmt = new Date(p.time).toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
  return {
    id: q.id,
    mag: Number(p.mag).toFixed(1),
    local: traduzirLocal(p.place),
    chave: chaveBusca(p.place),
    prof: Math.round(c[2]),
    data: dataFmt,
    tsunami: p.tsunami === 1,
    felt: p.felt || 0,
    alerta: p.alert ? ALERTAS[p.alert] : null,
    url: p.url,
  }
}

async function escrever(d, fontes) {
  const material = fontes.map((f, i) => `--- FONTE ${i + 1} (${f.fonte}) ---\nTÍTULO: ${f.titulo}\n${f.texto}`).join('\n\n').slice(0, 13000)

  const dadosUSGS = `DADOS OFICIAIS DO USGS (fonte primária, pode usar como fato):
- Magnitude: ${d.mag}
- Local do epicentro: ${d.local}
- Profundidade: ${d.prof} km
- Data e hora (horário de Brasília): ${d.data}
- Alerta de impacto do USGS: ${d.alerta || 'não emitido'}
- Alerta de tsunami: ${d.tsunami ? 'SIM' : 'não'}
- Relatos de pessoas que sentiram o tremor: ${d.felt}`

  const prompt = `Você é repórter de ciência do portal brasileiro "Explosão Solar", editoria Ciência. Escreva uma matéria factual em português brasileiro sobre um terremoto, com 320 a 520 palavras.

REGRA DE OURO: você só pode afirmar o que está nos DADOS DO USGS e no MATERIAL DAS FONTES abaixo. O que não está ali não existe. PROIBIDO, sem exceção:
(a) número de mortos, feridos, desaparecidos ou desabrigados que NÃO esteja nas fontes;
(b) repercussão inventada ("nas redes sociais", "especialistas apontam", "gerou comoção");
(c) comparação histórica, ineditismo ou superlativo ("o maior já registrado", "pela primeira vez") que não esteja nas fontes;
(d) nome de autoridade, órgão, cidade ou declaração entre aspas que não esteja nas fontes;
(e) causa científica específica (nome de falha, placa) que não esteja nas fontes.
Se as fontes divergirem nos números, use o mais recente e cite que o balanço é parcial. Se faltar informação, escreva menos — nunca preencha com suposição.

Abra o primeiro parágrafo com o fato principal: magnitude, local e quando. Use os dados do USGS para a ficha técnica do abalo (magnitude, profundidade, epicentro) e as fontes de imprensa para consequências (vítimas, danos, resgate, resposta oficial). Se não houver fontes de imprensa, escreva uma matéria mais curta apenas com os dados sísmicos do USGS, deixando claro que os efeitos ainda estão sendo apurados.
${REGRAS_DE_FORMA}

Responda APENAS com JSON válido:
{"title":"máx 72 caracteres, caixa de frase, com a magnitude e o país","seoTitle":"entre 45 e 58 caracteres","subtitle":"uma frase que acrescente informação ao título","excerpt":"entre 120 e 160 caracteres, terminado em ponto","tags":["4 a 6 tags"],"contentHtml":"corpo usando apenas ${TAGS_PERMITIDAS.map((x) => '<' + x + '>').join(' ')}"}

${dadosUSGS}

MATERIAL DAS FONTES:
${material || '(sem fontes de imprensa disponíveis — use apenas os dados do USGS)'}`

  const a = await askJson(prompt, { maxTokens: 5600, onLog: log })
  if (!a.title || !a.contentHtml) throw new Error('resposta incompleta')

  a.contentHtml = sanitize(a.contentHtml).replace(/[‑‐]/g, '-').replace(/[     ]/g, ' ')
  a.title = cortar(String(a.title).replace(/[‑‐]/g, '-'), 76)
  a.excerpt = cortar(String(a.excerpt || ''), 166)
  if (a.excerpt && !/[.!?]$/.test(a.excerpt)) a.excerpt = a.excerpt.replace(/[,;:\-–—]+$/, '') + '.'

  const proibido = [
    [/(nas redes sociais|especialistas apontam|analistas avaliam|gerou como[çc][ãa]o|gerou rea[çc][õo]es)/i, 'repercussão fabricada'],
    [/(pela primeira vez|nunca antes|o maior j[áa])/i, 'ineditismo inventado'],
    [/buscad[oa]s? no google/i, 'meta-referência ao Google'],
  ]
  for (const [re, motivo] of proibido) if (re.test(a.contentHtml)) throw new Error('filtro factual: ' + motivo)
  if (contaPalavras(a.contentHtml) < 190) throw new Error(`curta demais (${contaPalavras(a.contentHtml)}p)`)
  if (!/^\s*<p[\s>]/i.test(a.contentHtml)) throw new Error('não abre com lide')
  return a
}

async function traduzir(base, lang) {
  const prompt = `Traduza esta matéria jornalística do português brasileiro para ${LANGS[lang]}, com fluência nativa. Preserve as tags HTML. NÃO adicione nem remova informação.

Responda APENAS com JSON válido:
{"title":"...","seoTitle":"máx 58 caracteres","subtitle":"...","excerpt":"máx 160 caracteres","tags":[...],"contentHtml":"..."}

MATÉRIA:
${JSON.stringify({ title: base.title, subtitle: base.subtitle, excerpt: base.excerpt, tags: base.tags, contentHtml: base.contentHtml })}`
  const tr = await askJson(prompt, { maxTokens: 5600, onLog: log })
  if (!tr.title || !tr.contentHtml) throw new Error('tradução incompleta')
  return {
    ...base, lang,
    title: tr.title, seoTitle: cortar(tr.seoTitle || tr.title, 58), subtitle: tr.subtitle || base.subtitle,
    excerpt: cortar(tr.excerpt || base.excerpt, 168),
    tags: Array.isArray(tr.tags) && tr.tags.length ? tr.tags.slice(0, 6) : base.tags,
    contentHtml: sanitize(tr.contentHtml),
  }
}

async function main() {
  carregarEnv()
  if (!adquirir('terremotos', log)) return
  const args = process.argv.slice(2)
  const MAX = parseInt(args.includes('--max') ? args[args.indexOf('--max') + 1] : '3', 10)
  const dry = args.includes('--dry')

  let feats = []
  try {
    const [a, b] = await Promise.all([feedUSGS('significant_week'), feedUSGS('4.5_week')])
    const seen = new Set()
    for (const f of [...a, ...b]) if (!seen.has(f.id)) { seen.add(f.id); feats.push(f) }
  } catch (e) { log('USGS falhou: ' + e.message); return }

  // relevantes: forte, com tsunami, ou com alerta de impacto do USGS
  const rel = feats.filter((f) => {
    const p = f.properties
    return p.mag >= 6 || p.tsunami === 1 || ['orange', 'red'].includes(p.alert) || p.sig >= 650
  }).sort((x, y) => y.properties.mag - x.properties.mag)

  const state = loadState()
  const vistos = new Set(state.vistos)
  const novos = rel.filter((f) => !vistos.has(f.id))
  const cobertos = mapaCobertos()
  log(`${rel.length} abalos relevantes, ${novos.length} novos${dry ? ' [DRY]' : ''}`)

  let pub = 0
  for (const q of novos) {
    if (pub >= MAX) break
    vistos.add(q.id)
    const d = dadosDoAbalo(q)
    try {
      const fontes = await noticiasReais(d.chave)
      log(`[M${d.mag} ${d.chave}] ${fontes.length} fontes de imprensa`)
      const a = await escrever(d, fontes)

      // se o abalo já tem matéria (stub do robô de alertas), enriquece o mesmo slug
      let slug = cobertos.get(q.id)
      let antigo = null
      if (slug) {
        try { antigo = JSON.parse(fs.readFileSync(path.join(PT_DIR, slug + '.json'), 'utf8')) } catch {}
        log(`enriquecendo matéria existente: ${slug}`)
      } else {
        slug = slugify(a.title); let n = 2
        while (fs.existsSync(path.join(PT_DIR, slug + '.json'))) slug = `${slugify(a.title)}-${n++}`
      }

      const nomesFontes = fontes.map((f) => f.fonte).filter((v, i, arr) => arr.indexOf(v) === i)
      const credito = nomesFontes.length ? `USGS, ${nomesFontes.join(', ')}` : 'USGS (United States Geological Survey)'
      const imagens = antigo && antigo.imagem ? { imagem: antigo.imagem, imagemCredito: antigo.imagemCredito, imagemCreditoUrl: antigo.imagemCreditoUrl } : {}
      const base = {
        slug, title: a.title, seoTitle: cortar(a.seoTitle || a.title, 58), subtitle: a.subtitle,
        category: 'Ciência', categorySlug: 'ciencia', excerpt: a.excerpt, author: 'Daniele Morais',
        publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        eventDate: antigo?.eventDate || new Date(q.properties.time).toISOString(),
        readingMinutes: Math.max(2, Math.round(contaPalavras(a.contentHtml) / 200)),
        tags: (a.tags || []).slice(0, 6), sourceName: credito, sourceUrl: q.properties.url || antigo?.sourceUrl,
        ...imagens,
        contentHtml: a.contentHtml + `<p><em>Dados sísmicos: USGS. ${nomesFontes.length ? 'Com informações de ' + nomesFontes.join(', ') + '.' : ''}</em></p>`,
      }

      if (!dry) {
        fs.writeFileSync(path.join(PT_DIR, slug + '.json'), JSON.stringify(base, null, 2))
        for (const lang of Object.keys(LANGS)) {
          try {
            const dir = path.join(CONTENT, lang, 'articles'); fs.mkdirSync(dir, { recursive: true })
            fs.writeFileSync(path.join(dir, slug + '.json'), JSON.stringify(await traduzir(base, lang), null, 2))
          } catch (e) { log(`tradução ${lang} falhou [${slug}]: ${e.message}`) }
        }
      }
      pub++
      log(`[${pub}/${MAX}] ${slug} (${contaPalavras(a.contentHtml)}p)`)
      saveState([...vistos])
    } catch (e) {
      log(`reprovada M${d.mag} ${d.chave}: ${String(e.message).slice(0, 90)}`)
    }
  }

  saveState([...vistos])
  log(`fim: ${pub} publicadas`)

  if (pub > 0 && !dry && !process.env.SKIP_DEPLOY) {
    try {
      execSync('git add -A && git commit -q -m "Robo de terremotos: atividade sismica [skip ci]"', { cwd: ROOT, stdio: 'pipe', shell: 'cmd.exe' })
      execSync('git pull --no-rebase -q origin main', { cwd: ROOT, stdio: 'pipe', shell: 'cmd.exe' })
      execSync('git push', { cwd: ROOT, stdio: 'pipe', shell: 'cmd.exe' })
      log('publicado (git push)')
    } catch (e) { log('PUSH FALHOU: ' + String(e.message).slice(0, 160)) }
  }
}

main().catch((e) => { log('ERRO FATAL: ' + (e.stack || e.message)); process.exit(1) })
