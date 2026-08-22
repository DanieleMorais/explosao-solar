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

export function getRelated(article, n = 3, lang = 'pt') {
  const all = getAllArticles(lang).filter((a) => a.slug !== article.slug)
  const same = all.filter((a) => a.categorySlug === article.categorySlug)
  const rest = all.filter((a) => a.categorySlug !== article.categorySlug)
  return [...same, ...rest].slice(0, n)
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
