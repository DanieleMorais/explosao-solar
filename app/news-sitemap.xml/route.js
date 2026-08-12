import { getAllArticles, SITE } from '@/lib/content'
import { withLang } from '@/lib/site'

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const LANGS = { pt: 'pt', en: 'en', es: 'es' }
const CUTOFF_HOURS = 48

export async function GET() {
  const limit = Date.now() - CUTOFF_HOURS * 3600 * 1000
  const urls = []

  for (const lang of Object.keys(LANGS)) {
    for (const a of getAllArticles(lang)) {
      if (new Date(a.publishedAt).getTime() < limit) continue
      urls.push(`  <url>
    <loc>${SITE.url}${withLang(lang, `/noticia/${a.slug}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>${esc(SITE.name)}</news:name>
        <news:language>${LANGS[lang]}</news:language>
      </news:publication>
      <news:publication_date>${new Date(a.publishedAt).toISOString()}</news:publication_date>
      <news:title>${esc(a.title)}</news:title>
    </news:news>${a.imagem ? `\n    <image:image><image:loc>${esc(a.imagem)}</image:loc></image:image>` : ''}
  </url>`)
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 's-maxage=600, stale-while-revalidate' },
  })
}
