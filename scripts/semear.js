// Semeia o portal até atingir a meta de matérias por editoria (padrão: 100).
// Gera pauta evergreen com IA, escreve a matéria em PT-BR e traduz para EN/ES.
// Retomável: guarda o estado em content/semear-state.json.
//
// Uso: node scripts/semear.js [--meta 100] [--lote 40] [--cat economia] [--sem-traducao]

const fs = require('fs')
const path = require('path')
const { askJson } = require('./ia-pool')
const { adquirir } = require('./trava')

const ROOT = path.join(__dirname, '..')
const CONTENT = path.join(ROOT, 'content')
const PT_DIR = path.join(CONTENT, 'articles')
const STATE_FILE = path.join(CONTENT, 'semear-state.json')
const LOG = path.join(__dirname, 'semear.log')

const CATS = {
  mundo: { nome: 'Mundo', escopo: 'geopolítica, organismos internacionais, conflitos históricos, blocos econômicos, diplomacia, países e regiões do mundo, migrações, direitos humanos' },
  brasil: { nome: 'Brasil', escopo: 'serviços públicos brasileiros, educação, saúde, segurança, infraestrutura, regiões e biomas do Brasil, sociedade, história recente do país, direitos do cidadão' },
  politica: { nome: 'Política', escopo: 'instituições brasileiras, Constituição, poderes, processo legislativo, sistema eleitoral, federalismo, órgãos de controle, história política, cidadania' },
  economia: { nome: 'Economia', escopo: 'finanças pessoais, investimentos, juros, inflação, tributos, mercado de trabalho, empreendedorismo, comércio exterior, conceitos econômicos explicados' },
  tecnologia: { nome: 'Tecnologia', escopo: 'inteligência artificial, segurança digital, privacidade, internet, redes sociais, hardware, software, criptografia, futuro do trabalho, tecnologia no dia a dia' },
  ciencia: { nome: 'Ciência', escopo: 'astronomia e espaço, clima e meio ambiente, biologia, corpo humano, física, química, saúde baseada em evidências, história da ciência, método científico' },
  esportes: { nome: 'Esportes', escopo: 'futebol brasileiro e mundial, olimpíadas, ciência do esporte, economia do esporte, modalidades, história esportiva, saúde e desempenho, regras explicadas' },
  cultura: { nome: 'Cultura', escopo: 'música, cinema, streaming, literatura, artes visuais, gastronomia, patrimônio cultural brasileiro, indústria criativa, história cultural, festivais' },
}

const LANGS = { en: { nome: 'inglês', author: 'Daniele Morais' }, es: { nome: 'espanhol', author: 'Daniele Morais' } }

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`
  console.log(line)
  fs.appendFileSync(LOG, line + '\n')
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
  return { pautas: {}, usadas: {} }
}

const saveState = (s) => fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2))

function countByCategory() {
  const counts = {}
  for (const c of Object.keys(CATS)) counts[c] = 0
  for (const f of fs.readdirSync(PT_DIR)) {
    if (!f.endsWith('.json')) continue
    try {
      const a = JSON.parse(fs.readFileSync(path.join(PT_DIR, f), 'utf8'))
      if (counts[a.categorySlug] !== undefined) counts[a.categorySlug]++
    } catch {}
  }
  return counts
}

// Títulos já publicados na editoria — sem isso a IA repete temas que já existem
// e o site canibaliza o próprio SEO.
function titulosExistentes(catSlug) {
  const titulos = []
  for (const f of fs.readdirSync(PT_DIR)) {
    if (!f.endsWith('.json')) continue
    try {
      const a = JSON.parse(fs.readFileSync(path.join(PT_DIR, f), 'utf8'))
      if (a.categorySlug === catSlug) titulos.push(a.title)
    } catch {}
  }
  return titulos
}

const { REGRAS_DE_FATO, REGRAS_DE_FORMA, TAGS_PERMITIDAS, sanitize, contaPalavras, cortar, slugify, validar } = require('./regras-editoriais')

async function gerarPautas(catSlug, quantas, jaUsadas) {
  const { nome, escopo } = CATS[catSlug]
  const prompt = `Você é editor-chefe de um portal de notícias brasileiro. Liste ${quantas} PAUTAS evergreen (atemporais, sempre relevantes) para a editoria "${nome}".

Escopo da editoria: ${escopo}.

REGRAS:
- Cada pauta é um tema explicativo que rende uma matéria de 700+ palavras: "como funciona X", "por que Y importa", "o guia de Z", "a história de W", "o que muda com V".
- Cada pauta tem no MÁXIMO 8 palavras. PROIBIDO o padrão "Como funciona X e seu papel em Y" e qualquer pauta que precise de dois-pontos.
- PROIBIDAS pautas cujo miolo seja a composição, a estrutura formal, o organograma, o regimento ou a história institucional de um órgão, tratado ou entidade — esse tipo de pauta força a redação a inventar membros, artigos e datas. Prefira o efeito prático na vida do leitor ("O que o Ministério Público pode fazer pelo cidadão" em vez de "Estrutura e atuação do MPU").
- PROIBIDO pautas amarradas a eventos recentes, datas específicas ou notícias do dia. Só temas de fundo, que valem em qualquer momento.
- PROIBIDO repetir ou sobrepor qualquer assunto já publicado. Estas matérias JÁ EXISTEM nesta editoria — nenhuma pauta nova pode tratar do mesmo tema, nem por outro ângulo:
${jaUsadas.slice(0, 120).map((p) => `  • ${p}`).join('\n') || '  (nenhuma ainda)'}
- Todas diferentes entre si.
- Português brasileiro, foco no leitor do Brasil.

Responda APENAS com JSON válido: {"pautas":["pauta 1","pauta 2","..."]}`

  const r = await askJson(prompt, { maxTokens: 4096, onLog: log })
  return (r.pautas || []).filter((p) => typeof p === 'string' && p.length > 12)
}

async function escreverMateria(pauta, catSlug) {
  const { nome } = CATS[catSlug]
  const prompt = `Você é repórter sênior do portal brasileiro "Explosão Solar", editoria ${nome}. Escreva uma matéria jornalística EVERGREEN sobre: "${pauta}".

REGRAS INEGOCIÁVEIS:
- 2.000 a 2.400 palavras (leitura de 10+ minutos) — reportagem de fôlego, padrão de revista premium. Estruture em 6 a 9 seções <h2> que esgotem o tema: o que é e como funciona, origem e contexto histórico, como funciona na prática (passo a passo ou mecanismo), números e ordens de grandeza notórias, mitos e erros comuns, o que muda na vida do leitor, perguntas que o leitor faria (e as respostas), fechamento que amarra.
- Conteúdo raso ou encheção é inaceitável: cada parágrafo precisa informar algo novo. PROIBIDO repetir a mesma ideia com outras palavras para esticar o texto.
${REGRAS_DE_FATO}
${REGRAS_DE_FORMA}
- Português brasileiro impecável, tom de jornal premium, sem clickbait.

Responda APENAS com JSON válido, sem texto antes ou depois:
{"title":"máx 72 caracteres, caixa de frase; PROIBIDO sufixo de enchimento (': entenda seu papel', ': guia completo')","seoTitle":"entre 45 e 58 caracteres — aproveite o espaço da SERP","subtitle":"uma frase que ACRESCENTE informação ao título, nunca parafraseie","excerpt":"entre 120 e 160 caracteres, frase completa terminada em ponto final","tags":["4 a 6 tags"],"contentHtml":"<p>lide...</p> usando apenas ${TAGS_PERMITIDAS.map((t) => '<' + t + '>').join(' ')}"}`

  const a = await askJson(prompt, { maxTokens: 16000, onLog: log })
  if (!a.title || !a.contentHtml) throw new Error('matéria incompleta')
  a.contentHtml = sanitize(a.contentHtml)
  const erros = validar(a, { minPalavras: 1700, maxTitulo: 78 })
  if (erros.length) throw new Error('reprovada: ' + erros.join('; '))
  return { ...a, palavras: contaPalavras(a.contentHtml) }
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
  if (!adquirir('semear', log)) return
  const args = process.argv.slice(2)
  const arg = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d)
  const META = parseInt(arg('--meta', '100'), 10)
  const LOTE = parseInt(arg('--lote', '40'), 10)
  const soCat = arg('--cat', null)
  const semTraducao = args.includes('--sem-traducao')

  const state = loadState()
  const counts = countByCategory()
  const cats = soCat ? [soCat] : Object.keys(CATS)
  log(`semeadura: meta=${META}/editoria lote=${LOTE} atual=${JSON.stringify(counts)}`)

  let feitas = 0

  while (feitas < LOTE) {
    const pendentes = cats.filter((c) => counts[c] < META).sort((a, b) => counts[a] - counts[b])
    if (!pendentes.length) { log('meta atingida em todas as editorias'); break }
    const cat = pendentes[0]

    state.pautas[cat] = state.pautas[cat] || []
    state.usadas[cat] = state.usadas[cat] || []
    if (!state.pautas[cat].length) {
      try {
        const jaCobertos = [...new Set([...titulosExistentes(cat), ...state.usadas[cat]])]
        const novas = await gerarPautas(cat, 30, jaCobertos)
        state.pautas[cat] = novas.filter((p) => !state.usadas[cat].includes(p))
        saveState(state)
        log(`pautas geradas [${cat}]: ${state.pautas[cat].length}`)
      } catch (e) {
        log(`falha ao gerar pautas [${cat}]: ${e.message}`)
        counts[cat] = META
        continue
      }
      if (!state.pautas[cat].length) { counts[cat] = META; continue }
    }

    const pauta = state.pautas[cat].shift()
    state.usadas[cat].push(pauta)
    saveState(state)

    try {
      const t0 = Date.now()
      const art = await escreverMateria(pauta, cat)
      let slug = slugify(art.title)
      let n = 2
      while (fs.existsSync(path.join(PT_DIR, slug + '.json'))) slug = `${slugify(art.title)}-${n++}`

      const base = {
        slug,
        title: art.title,
        seoTitle: cortar(art.seoTitle || art.title, 58),
        subtitle: art.subtitle,
        category: CATS[cat].nome,
        categorySlug: cat,
        excerpt: cortar(art.excerpt || '', 168),
        author: 'Daniele Morais',
        publishedAt: new Date().toISOString(),
        readingMinutes: Math.max(3, Math.round(art.palavras / 200)),
        tags: (art.tags || []).slice(0, 6),
        contentHtml: sanitize(art.contentHtml),
      }
      fs.writeFileSync(path.join(PT_DIR, slug + '.json'), JSON.stringify(base, null, 2))
      counts[cat]++
      feitas++
      log(`[${cat} ${counts[cat]}/${META}] ${slug} (${art.palavras}p, ${Math.round((Date.now() - t0) / 1000)}s)`)

      if (!semTraducao) {
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
    } catch (e) {
      log(`falha [${cat}] "${pauta.slice(0, 50)}": ${e.message}`)
      if (/todos os motores falharam/.test(e.message)) { log('sem IA disponível, encerrando lote'); break }
    }
  }

  const totais = countByCategory()
  log(`lote encerrado: ${feitas} matérias novas | total agora: ${JSON.stringify(totais)}`)

  if (feitas > 0 && !args.includes('--sem-deploy')) {
    const { execSync } = require('child_process')
    try {
      execSync('git add -A && git commit -q -m "Semeadura: novas materias evergreen"', { cwd: ROOT, stdio: 'pipe', shell: 'cmd.exe' })
    } catch (e) {
      log('git commit: ' + String(e.message).slice(0, 120))
    }

    const deployStamp = path.join(CONTENT, '.ultimo-deploy')
    const ultimo = fs.existsSync(deployStamp) ? Number(fs.readFileSync(deployStamp, 'utf8')) : 0
    const MIN_INTERVALO = 55 * 60 * 1000
    if (Date.now() - ultimo < MIN_INTERVALO) {
      log(`deploy adiado (último há ${Math.round((Date.now() - ultimo) / 60000)} min) — matérias ficam prontas para a próxima publicação`)
      return
    }
    fs.writeFileSync(deployStamp, String(Date.now()))

    try {
      execSync('vercel deploy --prod --yes', { cwd: ROOT, stdio: 'pipe', shell: 'cmd.exe', timeout: 900000 })
      log(`deploy publicado com ${feitas} matérias novas`)
    } catch (e) {
      log('DEPLOY FALHOU: ' + String(e.message).slice(0, 200))
    }
  }
}

main().catch((e) => {
  log('ERRO FATAL: ' + (e.stack || e.message))
  process.exit(1)
})
