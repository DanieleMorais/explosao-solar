import { getAllArticles, CATEGORIES, SITE } from '@/lib/content'
import { withLang } from '@/lib/site'

const LANGS = ['pt', 'en', 'es']
const HREF = { pt: 'pt-BR', en: 'en', es: 'es' }

function entry(pathWithoutPrefix, lang, { lastModified, changeFrequency, priority }) {
  const languages = {}
  for (const l of LANGS) languages[HREF[l]] = `${SITE.url}${withLang(l, pathWithoutPrefix)}` || SITE.url
  return {
    url: `${SITE.url}${withLang(lang, pathWithoutPrefix)}` || SITE.url,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }
}

export default function sitemap() {
  const out = []
  const now = new Date()

  for (const lang of LANGS) {
    out.push(entry('', lang, { lastModified: now, changeFrequency: 'hourly', priority: 1 }))
    out.push(entry('/clima', lang, { lastModified: now, changeFrequency: 'hourly', priority: 0.6 }))
    out.push(entry('/busca', lang, { lastModified: now, changeFrequency: 'monthly', priority: 0.4 }))
    for (const c of CATEGORIES) {
      out.push(entry(`/${c.slug}`, lang, { lastModified: now, changeFrequency: 'daily', priority: 0.8 }))
    }
    for (const a of getAllArticles(lang)) {
      out.push(
        entry(`/noticia/${a.slug}`, lang, {
          lastModified: new Date(a.updatedAt || a.publishedAt),
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      )
    }
  }

  for (const p of ['/sobre', '/faq', '/contato', '/politica-de-privacidade', '/politica-de-cookies', '/termos-de-uso']) {
    out.push({ url: `${SITE.url}${p}`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 })
  }

  return out
}
