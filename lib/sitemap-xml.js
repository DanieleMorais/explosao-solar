import { SITE } from './content'
import { withLang } from './site'

const LANGS = ['pt', 'en', 'es']
const HREF = { pt: 'pt-BR', en: 'en', es: 'es' }

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// <url> com alternâncias hreflang (trilíngue)
export function urlTrilingue(pathSemPrefixo, lang, { lastModified, changeFrequency, priority }) {
  const links = LANGS.map(
    (l) => `    <xhtml:link rel="alternate" hreflang="${HREF[l]}" href="${esc(`${SITE.url}${withLang(l, pathSemPrefixo)}` || SITE.url)}"/>`
  ).join('\n')
  const loc = esc(`${SITE.url}${withLang(lang, pathSemPrefixo)}` || SITE.url)
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${new Date(lastModified).toISOString()}</lastmod>
    <changefreq>${changeFrequency}</changefreq>
    <priority>${priority}</priority>
${links}
  </url>`
}

export function urlSimples(url, { lastModified, changeFrequency, priority }) {
  return `  <url><loc>${esc(url)}</loc><lastmod>${new Date(lastModified).toISOString()}</lastmod><changefreq>${changeFrequency}</changefreq><priority>${priority}</priority></url>`
}

export function urlset(itens) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${itens.join('\n')}
</urlset>`
}

export function respostaXml(xml, maxage = 3600) {
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': `s-maxage=${maxage}, stale-while-revalidate` },
  })
}

export { LANGS }
