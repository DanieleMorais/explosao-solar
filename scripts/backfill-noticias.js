// Backfill de notícias dos últimos meses.
// Busca pautas no arquivo do Google News, baixa o TEXTO INTEGRAL de cada matéria
// original e só então reescreve. Sem texto real, pula — matéria sem fonte é ficção.
//
// Uso: node scripts/backfill-noticias.js [--meta 100] [--dias 90] [--dry]

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { askJson } = require('./ia-pool')
const { adquirir } = require('./trava')
const { extrair } = require('./extrator')
const { REGRAS_DE_FORMA, TAGS_PERMITIDAS, sanitize, contaPalavras, cortar, slugify, validar } = require('./regras-editoriais')

const ROOT = path.join(__dirname, '..')
const CONTENT = path.join(ROOT, 'content')
const PT_DIR = path.join(CONTENT, 'articles')
const STATE_FILE = path.join(CONTENT, 'backfill-state.json')
const LOG = path.join(__dirname, 'backfill.log')

// RSS direto dos veículos: entrega URL real (o Google News criptografa as dele)
// e texto extraível, que é o que impede a IA de inventar.
const CATS = {
  mundo: {
    nome: 'Mundo',
    feeds: [
      { n: 'BBC News', u: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
      { n: 'Al Jazeera', u: 'https://www.aljazeera.com/xml/rss/all.xml' },
      { n: 'DW', u: 'https://rss.dw.com/rdf/rss-en-world' },
      { n: 'The Guardian', u: 'https://www.theguardian.com/world/rss' },
      { n: 'France 24', u: 'https://www.france24.com/en/rss' },
    ],
  },
  brasil: {
    nome: 'Brasil',
    feeds: [
      { n: 'Agência Brasil', u: 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml' },
      { n: 'Agência Brasil', u: 'https://agenciabrasil.ebc.com.br/rss/geral/feed.xml' },
      { n: 'Agência Gov', u: 'https://agenciagov.ebc.com.br/rss.xml' },
      { n: 'Brasil de Fato', u: 'https://www.brasildefato.com.br/rss2.xml' },
    ],
  },
  politica: {
    nome: 'Política',
    feeds: [
      { n: 'Agência Brasil', u: 'https://agenciabrasil.ebc.com.br/rss/politica/feed.xml' },
      { n: 'Agência Câmara', u: 'https://www.camara.leg.br/noticias/rss/dia' },
      { n: 'Agência Senado', u: 'https://www12.senado.leg.br/noticias/rss/ultimasnoticias.xml' },
      { n: 'The Guardian', u: 'https://www.theguardian.com/politics/rss' },
    ],
  },
  economia: {
    nome: 'Economia',
    feeds: [
      { n: 'Agência Brasil', u: 'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml' },
      { n: 'BBC News', u: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
      { n: 'The Guardian', u: 'https://www.theguardian.com/business/rss' },
    ],
  },
  tecnologia: {
    nome: 'Tecnologia',
    feeds: [
      { n: 'BBC News', u: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
      { n: 'The Verge', u: 'https://www.theverge.com/rss/index.xml' },
      { n: 'Ars Technica', u: 'https://feeds.arstechnica.com/arstechnica/index' },
      { n: 'The Guardian', u: 'https://www.theguardian.com/technology/rss' },
    ],
  },
  ciencia: {
    nome: 'Ciência',
    feeds: [
      { n: 'ScienceDaily', u: 'https://www.sciencedaily.com/rss/all.xml' },
      { n: 'BBC News', u: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml' },
      { n: 'Phys.org', u: 'https://phys.org/rss-feed/' },
      { n: 'The Guardian', u: 'https://www.theguardian.com/science/rss' },
    ],
  },
  esportes: {
    nome: 'Esportes',
    feeds: [
      { n: 'BBC Sport', u: 'https://feeds.bbci.co.uk/sport/rss.xml' },
      { n: 'ESPN', u: 'https://www.espn.com/espn/rss/news' },
      { n: 'The Guardian', u: 'https://www.theguardian.com/sport/rss' },
      { n: 'Agência Brasil', u: 'https://agenciabrasil.ebc.com.br/rss/esportes/feed.xml' },
    ],
  },
  cultura: {
    nome: 'Cultura',
    feeds: [
      { n: 'The Guardian', u: 'https://www.theguardian.com/culture/rss' },
      { n: 'BBC News', u: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml' },
      { n: 'Agência Brasil', u: 'https://agenciabrasil.ebc.com.br/rss/cultura/feed.xml' },
      { n: 'NPR', u: 'https://feeds.npr.org/1008/rss.xml' },
    ],
  },
}

// Temas sob demanda: cobertura concentrada em um assunto, com veículos locais
// que os feeds genéricos não alcançam. Todos entram na editoria Mundo.
const TEMAS = {
  colombia: {
    nome: 'Colômbia e América Latina',
    categoria: 'mundo',
    // filtra o que é realmente sobre o tema — feeds de portada trazem de tudo
    filtro: /col[oô]mbia|colombian[oa]|bogot[áa]|medell[íi]n|cali\b|barranquilla|cartagena|petro\b|santos\b|uribe|farc|eln\b|catatumbo|antioquia|cúcuta|cucuta|venezuela|equador|ecuador|per[úu]\b|am[ée]rica latina|latinoamerica/i,
    feeds: [
      { n: 'El Tiempo', u: 'https://www.eltiempo.com/rss/colombia.xml' },
      { n: 'El Tiempo', u: 'https://www.eltiempo.com/rss/politica.xml' },
      { n: 'El Tiempo', u: 'https://www.eltiempo.com/rss/economia.xml' },
      { n: 'El Colombiano', u: 'https://www.elcolombiano.com/rss/portada.xml' },
      { n: 'Semana', u: 'https://www.semana.com/arc/outboundfeeds/rss/?outputType=xml' },
      { n: 'BBC Mundo', u: 'https://feeds.bbci.co.uk/mundo/rss.xml' },
      { n: 'DW', u: 'https://rss.dw.com/rdf/rss-sp-all' },
      { n: 'France 24', u: 'https://www.france24.com/es/rss' },
      { n: 'Al Jazeera', u: 'https://www.aljazeera.com/xml/rss/all.xml' },
      { n: 'The Guardian', u: 'https://www.theguardian.com/world/rss' },
    ],
  },
  terremoto: {
    nome: 'Terremotos e desastres',
    categoria: 'ciencia',
    // busca/resgate/solidariedade em torno de tremores no mundo todo
    filtro: /terremoto|sismo\b|s[íi]smic|tremor|earthquake|seismic|magnitud|tsunami|r[ée]plica|aftershock|abalo s[íi]smico|escombros|damnificad/i,
    feeds: [
      { n: 'BBC News', u: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
      { n: 'Al Jazeera', u: 'https://www.aljazeera.com/xml/rss/all.xml' },
      { n: 'The Guardian', u: 'https://www.theguardian.com/world/rss' },
      { n: 'DW', u: 'https://rss.dw.com/rdf/rss-en-world' },
      { n: 'France 24', u: 'https://www.france24.com/en/rss' },
      { n: 'BBC Mundo', u: 'https://feeds.bbci.co.uk/mundo/rss.xml' },
      { n: 'DW', u: 'https://rss.dw.com/rdf/rss-sp-all' },
      { n: 'El Tiempo', u: 'https://www.eltiempo.com/rss/colombia.xml' },
      { n: 'El Colombiano', u: 'https://www.elcolombiano.com/rss/portada.xml' },
      { n: 'Antara', u: 'https://en.antaranews.com/rss/news.xml' },
    ],
  },
}

const LANGS = { en: 'inglês', es: 'espanhol' }

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`
  console.log(line)
  fs.appendFileSync(LOG, line + '\n')
}

const loadState = () => (fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : { vistos: [] })
const saveState = (s) => fs.writeFileSync(STATE_FILE, JSON.stringify({ vistos: s.vistos.slice(-4000) }, null, 2))

function decod(s) {
  return String(s).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

function itensDoXml(xml, nomeFonte) {
  const itens = []
  const blocos = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || []
  for (const b of blocos) {
    const g = (tag) => {
      const m = b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
      return m ? decod(m[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim()) : ''
    }
    let link = g('link')
    if (!link || !/^https?:/.test(link)) {
      const m = b.match(/<link[^>]+href=["'](https?:\/\/[^"']+)["']/i)
      link = m ? m[1] : ''
    }
    const titulo = g('title')
    const pubDate = g('pubDate') || g('updated') || g('published')
    if (titulo && /^https?:\/\//.test(link)) itens.push({ titulo, link, fonte: nomeFonte, pubDate })
  }
  return itens
}

async function buscarPautas(cat, feedsCustom = null) {
  const itens = []
  for (const f of feedsCustom || CATS[cat].feeds) {
    try {
      const r = await fetch(f.u, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ExplosaoSolarBot/1.0; +https://explosaosolar.com)' },
        signal: AbortSignal.timeout(25000),
      })
      if (!r.ok) throw new Error('HTTP ' + r.status)
      const novos = itensDoXml(await r.text(), f.n)
      itens.push(...novos)
      log(`  feed ${f.n}: ${novos.length} itens`)
    } catch (e) {
      log(`  feed ${f.n} falhou: ${e.message}`)
    }
  }
  return itens
}

async function escrever(item, fonte, catSlug, dataFato) {
  const alvo = fonte.palavras > 700 ? '500 a 700' : fonte.palavras > 400 ? '350 a 500' : '250 a 380'
  const prompt = `Você é repórter do portal brasileiro "Explosão Solar", editoria ${CATS[catSlug].nome}. Reescreva a reportagem abaixo com suas próprias palavras, em português brasileiro, com ${alvo} palavras.

REGRA DE OURO: você só pode afirmar o que está no TEXTO DA FONTE abaixo. O que não está ali não existe. PROIBIDO, sem exceção:
(a) perfil, biografia, ficha técnica, ano de fundação, ideologia, porte ou classificação de qualquer pessoa, partido, empresa ou instituição que não esteja no texto;
(b) repercussão inventada ("nas redes sociais", "analistas apontam", "especialistas divergem", "gerou reações");
(c) ineditismo ou superlativo ("pela primeira vez", "nunca antes", "o maior");
(d) número, data, local ou nome próprio que não esteja no texto;
(e) declarações entre aspas que não estejam literalmente no texto.
Se faltar informação, escreva menos. Matéria curta e correta vale mais que longa e inventada.

DATA DO FATO: ${dataFato}. Deixe claro no texto quando o fato aconteceu (ex.: "em ${dataFato}") — o leitor precisa saber que não é de hoje.
${REGRAS_DE_FORMA}

Responda APENAS com JSON válido:
{"title":"máx 72 caracteres, caixa de frase","seoTitle":"entre 45 e 58 caracteres","subtitle":"uma frase que acrescente informação ao título","excerpt":"entre 120 e 160 caracteres, terminado em ponto","tags":["4 a 6 tags"],"contentHtml":"corpo usando apenas ${TAGS_PERMITIDAS.map((t) => '<' + t + '>').join(' ')}"}

TÍTULO ORIGINAL: ${item.titulo}
VEÍCULO: ${item.fonte}

TEXTO DA FONTE:
${fonte.texto}`

  const a = await askJson(prompt, { maxTokens: 6144, onLog: log })
  if (!a.title || !a.contentHtml) throw new Error('resposta incompleta')

  // Problemas mecânicos se consertam; só o que é factual justifica descartar a matéria.
  a.contentHtml = sanitize(a.contentHtml)
    .replace(new RegExp('[\\u2011\\u2010]', 'g'), '-')
    .replace(new RegExp('\\u00ad', 'g'), '')
    .replace(new RegExp('[\\u00a0\\u2002\\u2003\\u2009\\u202f]', 'g'), ' ')
  a.title = cortar(String(a.title || '').replace(new RegExp('[\\u2011\\u2010]', 'g'), '-'), 76)
  a.excerpt = cortar(String(a.excerpt || '').replace(new RegExp('[\\u2011\\u2010]', 'g'), '-'), 166)
  if (a.excerpt && !/[.!?]$/.test(a.excerpt)) a.excerpt = a.excerpt.replace(/[,;:\-–—]+$/, '') + '.'

  const proibido = [
    [/fundad[oa] em \d{4}/i, 'ano de fundação inventado'],
    [/(centro-esquerda|centro-direita|extrema-(esquerda|direita))/i, 'classificação ideológica'],
    [/(nas redes sociais|analistas apontam|observadores avaliam|especialistas divergem|gerou reações)/i, 'repercussão fabricada'],
    [/(pela primeira vez|nunca antes)/i, 'ineditismo inventado'],
    [/segundo estudos|de acordo com especialistas/i, 'atribuição vaga'],
  ]
  for (const [re, motivo] of proibido) if (re.test(a.contentHtml)) throw new Error('filtro factual: ' + motivo)
  const erros = validar(a, { minPalavras: 220, maxTitulo: 76 })
  if (erros.length) throw new Error('reprovada: ' + erros.join('; '))
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
  if (!adquirir('backfill', log)) return

  const args = process.argv.slice(2)
  const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d)
  const META = parseInt(arg('--meta', '100'), 10)
  const DIAS = parseInt(arg('--dias', '90'), 10)
  const dry = args.includes('--dry')

  const tema = arg('--tema', null)
  if (tema && !TEMAS[tema]) {
    log(`tema desconhecido: ${tema} (disponíveis: ${Object.keys(TEMAS).join(', ')})`)
    return
  }

  const state = loadState()
  const vistos = new Set(state.vistos)
  const cats = tema ? [TEMAS[tema].categoria] : Object.keys(CATS)
  const porCat = tema ? META : Math.ceil(META / cats.length)

  log(
    tema
      ? `backfill temático "${TEMAS[tema].nome}": meta=${META} na editoria ${TEMAS[tema].categoria}${dry ? ' [DRY]' : ''}`
      : `backfill: meta=${META} (${porCat}/editoria) janela=${DIAS} dias${dry ? ' [DRY]' : ''}`
  )

  let jaDoTema = 0
  if (tema) {
    for (const f of fs.readdirSync(PT_DIR)) {
      if (!f.endsWith('.json')) continue
      try { if (JSON.parse(fs.readFileSync(path.join(PT_DIR, f), 'utf8')).tema === tema) jaDoTema++ } catch {}
    }
    if (jaDoTema >= META) { log(`tema ${tema} já tem ${jaDoTema} matérias (meta ${META}) — nada a fazer`); return }
    log(`tema ${tema}: ${jaDoTema}/${META} já publicadas, faltam ${META - jaDoTema}`)
  }

  let publicadas = tema ? jaDoTema : 0
  const stats = { semUrl: 0, semTexto: 0, reprovadas: 0 }

  for (const cat of cats) {
    if (publicadas >= META) break
    let pautas = []
    try {
      pautas = await buscarPautas(cat, tema ? TEMAS[tema].feeds : null)
      if (tema) {
        const antes = pautas.length
        pautas = pautas.filter((p) => TEMAS[tema].filtro.test(p.titulo))
        log(`[${tema}] ${pautas.length} pautas do tema (de ${antes} nos feeds)`)
      } else {
        log(`[${cat}] ${pautas.length} pautas nos feeds`)
      }
    } catch (e) {
      log(`[${cat}] busca falhou: ${e.message}`)
      continue
    }

    let feitasNaCat = 0
    for (const item of pautas) {
      if (feitasNaCat >= porCat || publicadas >= META) break
      if (vistos.has(item.link)) continue
      vistos.add(item.link)

      const real = item.link

      let fonte
      try {
        fonte = await extrair(real, { minPalavras: 200 })
      } catch (e) {
        stats.semTexto++
        continue
      }

      const dataFato = item.pubDate
        ? new Date(item.pubDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })
        : 'data não informada'

      try {
        const a = await escrever(item, fonte, cat, dataFato)
        const slug = (() => {
          let s = slugify(a.title)
          let n = 2
          while (fs.existsSync(path.join(PT_DIR, s + '.json'))) s = `${slugify(a.title)}-${n++}`
          return s
        })()

        const base = {
          slug,
          title: a.title,
          seoTitle: cortar(a.seoTitle || a.title, 58),
          subtitle: a.subtitle,
          category: CATS[cat].nome,
          categorySlug: cat,
          excerpt: cortar(a.excerpt || '', 168),
          author: 'Daniele Morais',
          tema: tema || undefined,
          publishedAt: new Date().toISOString(),
          eventDate: item.pubDate ? new Date(item.pubDate).toISOString() : null,
          readingMinutes: Math.max(2, Math.round(contaPalavras(a.contentHtml) / 200)),
          tags: (a.tags || []).slice(0, 6),
          sourceName: item.fonte,
          sourceUrl: fonte.url,
          contentHtml: a.contentHtml + `<p><em>Com informações de ${item.fonte}.</em></p>`,
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
        feitasNaCat++
        log(`[${cat} ${publicadas}/${META}] ${slug} (${contaPalavras(a.contentHtml)}p, fonte ${fonte.palavras}p — ${item.fonte})`)
        saveState({ vistos: [...vistos] })
      } catch (e) {
        stats.reprovadas++
        log(`reprovada [${cat}] "${item.titulo.slice(0, 50)}": ${e.message}`)
      }
    }
  }

  saveState({ vistos: [...vistos] })
  log(`fim: ${publicadas} publicadas | descartes: ${stats.semUrl} sem URL, ${stats.semTexto} sem texto extraível, ${stats.reprovadas} reprovadas no filtro`)

  if (publicadas > 0 && !dry) {
    try {
      execSync('git add -A && git commit -q -m "Backfill de noticias com texto integral da fonte"', { cwd: ROOT, stdio: 'pipe', shell: 'cmd.exe' })
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
