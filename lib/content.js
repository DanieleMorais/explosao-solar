import fs from 'fs'
import path from 'path'
import { CAT_DESCRIPTIONS, CAT_LABELS } from './i18n'
import { SITE, SITE_DESCRIPTIONS, SITE_TITLES, CATEGORIES } from './site'

export { SITE, SITE_DESCRIPTIONS, SITE_TITLES, CATEGORIES }

function articlesDir(lang = 'pt') {
  return lang === 'pt'
    ? path.join(process.cwd(), 'content', 'articles')
    : path.join(process.cwd(), 'content', lang, 'articles')
}

const cache = {}

export function getAllArticles(lang = 'pt') {
  if (cache[lang]) return cache[lang]
  const dir = articlesDir(lang)
  if (!fs.existsSync(dir)) return []
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
  cache[lang] = files
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
  return cache[lang]
}

export function getArticle(slug, lang = 'pt') {
  return getAllArticles(lang).find((a) => a.slug === slug) || null
}

export function getByCategory(categorySlug, lang = 'pt') {
  return getAllArticles(lang).filter((a) => a.categorySlug === categorySlug)
}

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()

// Palavras curtas e conectivos não dizem nada sobre o assunto da matéria.
const VAZIAS = new Set(
  ('de da do das dos e ou a o as os um uma para por com sem sobre entre apos ate que quem qual quais no na nos nas ao aos ' +
    'the of and to in for on with from at as is are be this that new news how why what when where')
    .split(' ')
)

const palavrasTitulo = (t) =>
  norm(t)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((p) => p.length > 3 && !VAZIAS.has(p))

// Índice invertido tag -> matérias, montado uma vez por idioma: sem ele o scoring
// varreria as 1.000+ matérias em cada uma das ~3.000 páginas do build.
const indices = {}
function indicePorTag(lang) {
  if (indices[lang]) return indices[lang]
  const mapa = new Map()
  for (const a of getAllArticles(lang)) {
    for (const tag of a.tags || []) {
      const k = norm(tag)
      if (!k) continue
      if (!mapa.has(k)) mapa.set(k, [])
      mapa.get(k).push(a)
    }
  }
  indices[lang] = mapa
  return mapa
}

// Peso da tag pela raridade (IDF): "tecnologia" está em 98 matérias e não diz nada
// sobre o assunto; "8 de janeiro" está em 3 e casa de verdade. Sem isso, duas tags
// genéricas em comum bastavam pra ligar terremoto com blockchain.
function pesoTag(tag, lang) {
  const total = getAllArticles(lang).length || 1
  const quantas = (indicePorTag(lang).get(tag) || []).length || 1
  return Math.log(total / quantas)
}

export function getRelated(article, n = 3, lang = 'pt') {
  const idx = indicePorTag(lang)
  const minhasTags = new Set((article.tags || []).map(norm).filter(Boolean))
  const minhasPalavras = new Set(palavrasTitulo(article.seoTitle || article.title))

  const pontos = new Map()
  const somar = (a, p) => {
    if (a.slug === article.slug) return
    pontos.set(a, (pontos.get(a) || 0) + p)
  }

  for (const tag of minhasTags) {
    const peso = pesoTag(tag, lang)
    for (const a of idx.get(tag) || []) somar(a, peso)
  }

  for (const [a] of pontos) {
    if (a.categorySlug === article.categorySlug) somar(a, 1)
    if (article.tema && a.tema === article.tema) somar(a, 2)
    const titulo = palavrasTitulo(a.seoTitle || a.title)
    somar(a, titulo.filter((p) => minhasPalavras.has(p)).length * 1.5)
  }

  const ordenadas = [...pontos.entries()]
    .sort((x, y) => y[1] - x[1] || new Date(y[0].publishedAt) - new Date(x[0].publishedAt))
    .map(([a]) => a)

  if (ordenadas.length >= n) return ordenadas.slice(0, n)

  // Sem tags em comum suficientes: completa com as mais recentes da mesma editoria.
  const escolhidos = new Set(ordenadas.map((a) => a.slug))
  const resto = getAllArticles(lang).filter((a) => a.slug !== article.slug && !escolhidos.has(a.slug))
  const mesmaCat = resto.filter((a) => a.categorySlug === article.categorySlug)
  const outras = resto.filter((a) => a.categorySlug !== article.categorySlug)
  return [...ordenadas, ...mesmaCat, ...outras].slice(0, n)
}

// Matérias de FUNDO (evergreen, sem fonte externa) que explicam o assunto de uma
// notícia. Exige 2+ tags em comum: link fraco atrapalha mais do que ajuda, então
// quando não há casamento forte o bloco simplesmente não aparece.
export function getContexto(article, n = 3, lang = 'pt') {
  const idx = indicePorTag(lang)
  const minhasTags = new Set((article.tags || []).map(norm).filter(Boolean))
  const pontos = new Map()

  for (const tag of minhasTags) {
    const peso = pesoTag(tag, lang)
    for (const a of idx.get(tag) || []) {
      if (a.slug === article.slug || a.sourceUrl) continue
      pontos.set(a, (pontos.get(a) || 0) + peso)
    }
  }

  // 6 ≈ uma tag bem específica ou duas de especificidade média. Abaixo disso o
  // link vira ruído, e aí é melhor não mostrar bloco nenhum.
  return [...pontos.entries()]
    .filter(([, p]) => p >= 6)
    .sort((x, y) => y[1] - x[1] || new Date(y[0].publishedAt) - new Date(x[0].publishedAt))
    .slice(0, n)
    .map(([a]) => a)
}

export function getCategory(slug, lang = 'pt') {
  const base = CATEGORIES.find((c) => c.slug === slug)
  if (!base) return null
  if (lang === 'pt') return base
  return {
    ...base,
    name: CAT_LABELS[lang]?.[slug] || base.name,
    description: CAT_DESCRIPTIONS[lang]?.[slug] || base.description,
  }
}

export function articleLangs(slug) {
  return ['pt', 'en', 'es'].filter((lang) => fs.existsSync(path.join(articlesDir(lang), slug + '.json')))
}

export function getInstitutional(lang = 'pt') {
  const sufixo = lang === 'pt' ? '' : `.${lang}`
  const p = path.join(process.cwd(), 'content', `institutional${sufixo}.json`)
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

export { formatDate, formatDateShort } from './format'
