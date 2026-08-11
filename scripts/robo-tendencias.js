// Robô de tendências: lê o que está sendo buscado no Google agora e publica
// matéria sobre o assunto — sempre a partir do texto integral das notícias que o
// próprio Trends aponta, nunca do nome do assunto sozinho.
//
// Uso: node scripts/robo-tendencias.js [--max 6] [--regioes BR,US] [--dry]

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
const STATE_FILE = path.join(CONTENT, 'tendencias-state.json')
const LOG = path.join(__dirname, 'tendencias.log')

const LANGS = { en: 'inglês', es: 'espanhol' }

// Onde cada tipo de assunto deve ser publicado. Sem palavra-chave, vai para Mundo.
const ROTEAMENTO = [
  { cat: 'esportes', re: /futebol|f[úu]tbol|copa|libertadores|brasileir[ãa]o|flamengo|corinthians|palmeiras|s[ãa]o paulo fc|nba|nfl|uefa|champions|olimp|atleta|jogo|partida|campeonato|basketball|soccer|tennis|f1|f[óo]rmula 1/i },
  { cat: 'tecnologia', re: /iphone|samsung|galaxy|android|google|apple|microsoft|openai|chatgpt|intelig[êe]ncia artificial|\bia\b|\bai\b|app|aplicativo|celular|smartphone|tesla|spacex|starlink|nvidia|chip|software|hacker|cyber/i },
  { cat: 'economia', re: /d[óo]lar|euro|bolsa|ibovespa|infla[çc][ãa]o|juros|selic|pib|imposto|sal[áa]rio|emprego|banco|investiment|criptomoeda|bitcoin|mercado|economia|petr[óo]leo|combust[íi]vel/i },
  { cat: 'politica', re: /presidente|congresso|senado|c[âa]mara|stf|elei[çc][ãa]o|governo|ministro|deputado|senador|parlament|pol[íi]tic|lei\b|projeto de lei/i },
  { cat: 'cultura', re: /filme|s[ée]rie|netflix|show|turn[êe]|[áa]lbum|m[úu]sica|cantor|banda|ator|atriz|oscar|grammy|bbb|novela|livro|festival|cinema|k-pop|entertainment/i },
  { cat: 'ciencia', re: /clima|terremoto|vulc[ãa]o|furac[ãa]o|tempestade|nasa|espa[çc]o|planeta|vacina|doen[çc]a|sa[úu]de|pesquisa|cientist|descoberta|c[âa]ncer|v[íi]rus/i },
  { cat: 'brasil', re: /brasil|brasileir|s[ãa]o paulo|rio de janeiro|minas gerais|bahia|paran[áa]|nordeste|amaz[ôo]nia|ibge|sus\b/i },
]

const CAT_NOMES = {
  mundo: 'Mundo', brasil: 'Brasil', politica: 'Política', economia: 'Economia',
  tecnologia: 'Tecnologia', ciencia: 'Ciência', esportes: 'Esportes', cultura: 'Cultura',
}

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`
  console.log(line)
  fs.appendFileSync(LOG, line + '\n')
}

const loadState = () => (fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : { vistos: [] })
const saveState = (v) => fs.writeFileSync(STATE_FILE, JSON.stringify({ vistos: v.slice(-2000) }, null, 2))

function decod(s) {
  return String(s)
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
}

function classificar(assunto, titulos) {
  const texto = `${assunto} ${titulos.join(' ')}`
  for (const { cat, re } of ROTEAMENTO) if (re.test(texto)) return cat
  return 'mundo'
}

async function buscarTendencias(geo) {
  const r = await fetch(`https://trends.google.com/trending/rss?geo=${geo}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ExplosaoSolarBot/1.0; +https://explosaosolar.com)' },
    signal: AbortSignal.timeout(30000),
  })
  if (!r.ok) throw new Error('trends HTTP ' + r.status)
  const xml = await r.text()

  const assuntos = []
  for (const bloco of xml.match(/<item>[\s\S]*?<\/item>/g) || []) {
    const titulo = decod((bloco.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').trim()
    if (!titulo) continue
    const noticias = []
    const urls = [...bloco.matchAll(/<ht:news_item_url>([\s\S]*?)<\/ht:news_item_url>/g)].map((m) => decod(m[1]).trim())
    const nomes = [...bloco.matchAll(/<ht:news_item_title>([\s\S]*?)<\/ht:news_item_title>/g)].map((m) => decod(m[1]).replace(/<[^>]+>/g, '').trim())
    const fontes = [...bloco.matchAll(/<ht:news_item_source>([\s\S]*?)<\/ht:news_item_source>/g)].map((m) => decod(m[1]).trim())
    urls.forEach((u, i) => noticias.push({ url: u, titulo: nomes[i] || titulo, fonte: fontes[i] || 'fonte externa' }))
    if (noticias.length) assuntos.push({ assunto: titulo, geo, noticias })
  }
  return assuntos
}

async function escrever(assunto, fontes, catSlug) {
  const material = fontes
    .map((f, i) => `--- FONTE ${i + 1} (${f.fonte}) ---\nTÍTULO: ${f.titulo}\n${f.texto}`)
    .join('\n\n')
    .slice(0, 14000)

  const prompt = `Você é repórter do portal brasileiro "Explosão Solar", editoria ${CAT_NOMES[catSlug]}. O assunto "${assunto}" está entre os mais buscados no Google agora. Escreva uma matéria em português brasileiro explicando o que está acontecendo, com 350 a 600 palavras.

REGRA DE OURO: você só pode afirmar o que está no MATERIAL DAS FONTES abaixo. O que não está ali não existe. PROIBIDO, sem exceção:
(a) perfil, biografia, ficha técnica, ano de fundação, ideologia ou classificação de pessoa, partido, empresa ou instituição que não esteja nas fontes;
(b) repercussão inventada ("nas redes sociais", "analistas apontam", "especialistas divergem", "gerou reações");
(c) ineditismo ou superlativo ("pela primeira vez", "nunca antes", "o maior");
(d) número, data, local ou nome próprio que não esteja nas fontes;
(e) declarações entre aspas que não estejam literalmente nas fontes.
Se as fontes divergirem, escreva o que é comum a elas. Se faltar informação, escreva menos.

Comece explicando ao leitor POR QUE o assunto está em alta agora. Não escreva que ele "está sendo buscado no Google" — conte o fato que gerou a busca.
${REGRAS_DE_FORMA}

Responda APENAS com JSON válido:
{"title":"máx 72 caracteres, caixa de frase","seoTitle":"entre 45 e 58 caracteres","subtitle":"uma frase que acrescente informação ao título","excerpt":"entre 120 e 160 caracteres, terminado em ponto","tags":["4 a 6 tags"],"contentHtml":"corpo usando apenas ${TAGS_PERMITIDAS.map((t) => '<' + t + '>').join(' ')}"}

MATERIAL DAS FONTES:
${material}`

  const a = await askJson(prompt, { maxTokens: 6144, onLog: log })
  if (!a.title || !a.contentHtml) throw new Error('resposta incompleta')

  a.contentHtml = sanitize(a.contentHtml)
    .replace(new RegExp('[\\u2011\\u2010]', 'g'), '-')
    .replace(new RegExp('[\\u00a0\\u2002\\u2003\\u2009\\u202f]', 'g'), ' ')
  a.title = cortar(String(a.title).replace(new RegExp('[\\u2011\\u2010]', 'g'), '-'), 76)
  a.excerpt = cortar(String(a.excerpt || ''), 166)
  if (a.excerpt && !/[.!?]$/.test(a.excerpt)) a.excerpt = a.excerpt.replace(/[,;:\-–—]+$/, '') + '.'

  const proibido = [
    [/fundad[oa] em \d{4}/i, 'ano de fundação inventado'],
    [/(centro-esquerda|centro-direita|extrema-(esquerda|direita))/i, 'classificação ideológica'],
    [/(nas redes sociais|analistas apontam|observadores avaliam|especialistas divergem|gerou reações)/i, 'repercussão fabricada'],
    [/(pela primeira vez|nunca antes)/i, 'ineditismo inventado'],
    [/segundo estudos|de acordo com especialistas/i, 'atribuição vaga'],
    [/buscad[oa]s? no google|tend[êe]ncia de busca/i, 'meta-referência ao Google'],
  ]
  for (const [re, motivo] of proibido) if (re.test(a.contentHtml)) throw new Error('filtro factual: ' + motivo)
  if (contaPalavras(a.contentHtml) < 260) throw new Error(`curta demais (${contaPalavras(a.contentHtml)} palavras)`)
  if (!/^\s*<p[\s>]/i.test(a.contentHtml)) throw new Error('não abre com lide')
  return a
}

async function traduzir(base, lang) {
  const prompt = `Traduza esta matéria jornalística do português brasileiro para ${LANGS[lang]}, com fluência nativa. Preserve as tags HTML. NÃO adicione nem remova informação.

Responda APENAS com JSON válido:
{"title":"...","seoTitle":"máx 58 caracteres","subtitle":"...","excerpt":"máx 160 caracteres","tags":[...],"contentHtml":"..."}

MATÉRIA:
${JSON.stringify({ title: base.title, subtitle: base.subtitle, excerpt: base.excerpt, tags: base.tags, contentHtml: base.contentHtml })}`

  const tr = await askJson(prompt, { maxTokens: 6144, onLog: log })
  if (!tr.title || !tr.contentHtml) throw new Error('tradução incompleta')
  return {
    ...base,
    title: tr.title,
    seoTitle: cortar(tr.seoTitle || tr.title, 58),
    subtitle: tr.subtitle || base.subtitle,
    excerpt: cortar(tr.excerpt || base.excerpt, 168),
    tags: Array.isArray(tr.tags) && tr.tags.length ? tr.tags.slice(0, 6) : base.tags,
    contentHtml: sanitize(tr.contentHtml),
    lang,
  }
}

async function main() {
  if (!adquirir('tendencias', log)) return

  const args = process.argv.slice(2)
  const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d)
  const MAX = parseInt(arg('--max', '6'), 10)
  const regioes = arg('--regioes', 'BR,US').split(',').map((s) => s.trim()).filter(Boolean)
  const dry = args.includes('--dry')

  const state = loadState()
  const vistos = new Set(state.vistos)

  let assuntos = []
  for (const geo of regioes) {
    try {
      const t = await buscarTendencias(geo)
      assuntos.push(...t)
      log(`[${geo}] ${t.length} assuntos em alta`)
    } catch (e) {
      log(`[${geo}] falhou: ${e.message}`)
    }
  }

  assuntos = assuntos.filter((a) => !vistos.has(a.assunto.toLowerCase()))
  log(`${assuntos.length} assuntos novos${dry ? ' [DRY]' : ''}`)

  let publicadas = 0
  const stats = { semTexto: 0, reprovadas: 0 }

  for (const item of assuntos) {
    if (publicadas >= MAX) break
    vistos.add(item.assunto.toLowerCase())

    // baixa o texto real de até 3 notícias que o Trends aponta
    const fontes = []
    for (const n of item.noticias.slice(0, 4)) {
      if (fontes.length >= 3) break
      try {
        const f = await extrair(n.url, { minPalavras: 180 })
        fontes.push({ ...n, texto: f.texto, url: f.url })
      } catch {}
    }
    if (fontes.length < 1) {
      stats.semTexto++
      log(`sem texto extraível: "${item.assunto}"`)
      continue
    }

    const cat = classificar(item.assunto, fontes.map((f) => f.titulo))
    try {
      const a = await escrever(item.assunto, fontes, cat)
      let slug = slugify(a.title)
      let n = 2
      while (fs.existsSync(path.join(PT_DIR, slug + '.json'))) slug = `${slugify(a.title)}-${n++}`

      const base = {
        slug,
        title: a.title,
        seoTitle: cortar(a.seoTitle || a.title, 58),
        subtitle: a.subtitle,
        category: CAT_NOMES[cat],
        categorySlug: cat,
        excerpt: a.excerpt,
        author: 'Daniele Morais',
        publishedAt: new Date().toISOString(),
        readingMinutes: Math.max(2, Math.round(contaPalavras(a.contentHtml) / 200)),
        tags: (a.tags || []).slice(0, 6),
        sourceName: fontes.map((f) => f.fonte).filter((v, i, arr) => arr.indexOf(v) === i).join(', '),
        sourceUrl: fontes[0].url,
        trending: item.assunto,
        contentHtml: a.contentHtml + `<p><em>Com informações de ${fontes.map((f) => f.fonte).filter((v, i, arr) => arr.indexOf(v) === i).join(', ')}.</em></p>`,
      }

      if (!dry) {
        fs.writeFileSync(path.join(PT_DIR, slug + '.json'), JSON.stringify(base, null, 2))
        for (const lang of Object.keys(LANGS)) {
          try {
            const dir = path.join(CONTENT, lang, 'articles')
            fs.mkdirSync(dir, { recursive: true })
            fs.writeFileSync(path.join(dir, slug + '.json'), JSON.stringify(await traduzir(base, lang), null, 2))
          } catch (e) {
            log(`tradução ${lang} falhou [${slug}]: ${e.message}`)
          }
        }
      }
      publicadas++
      log(`[${cat} ${publicadas}/${MAX}] ${slug} — assunto "${item.assunto}" (${fontes.length} fontes, ${contaPalavras(a.contentHtml)}p)`)
      saveState([...vistos])
    } catch (e) {
      stats.reprovadas++
      log(`reprovada "${item.assunto}": ${e.message.slice(0, 90)}`)
    }
  }

  saveState([...vistos])
  log(`fim: ${publicadas} publicadas | ${stats.semTexto} sem texto, ${stats.reprovadas} reprovadas`)

  if (publicadas > 0 && !dry) {
    try {
      execSync('git add -A && git commit -q -m "Robo de tendencias: assuntos em alta no Google"', { cwd: ROOT, stdio: 'pipe', shell: 'cmd.exe' })
    } catch {}
    try {
      execSync('vercel deploy --prod --yes', { cwd: ROOT, stdio: 'pipe', shell: 'cmd.exe', timeout: 900000 })
      log('deploy publicado')
    } catch (e) {
      log('DEPLOY FALHOU: ' + String(e.message).slice(0, 160))
    }
  }
}

main().catch((e) => {
  log('ERRO FATAL: ' + (e.stack || e.message))
  process.exit(1)
})
