import { getAllArticles, SITE } from '@/lib/content'

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function GET() {
  const articles = getAllArticles().slice(0, 50)
  const items = articles
    .map(
      (a) => `    <item>
      <title>${esc(a.title)}</title>
      <link>${SITE.url}/noticia/${a.slug}</link>
      <guid isPermaLink="true">${SITE.url}/noticia/${a.slug}</guid>
      <description>${esc(a.excerpt)}</description>
      <category>${esc(a.category)}</category>${
        a.imagem
          ? `\n      <enclosure url="${esc(a.imagem)}" type="image/jpeg"/>\n      <media:content url="${esc(a.imagem)}" medium="image"/>\n      <media:thumbnail url="${esc(a.imagem)}"/>`
          : ''
      }
      <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>
    </item>`
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${esc(SITE.name)} — ${esc(SITE.tagline)}</title>
    <link>${SITE.url}</link>
    <description>${esc(SITE.description)}</description>
    <language>pt-BR</language>
    <atom:link href="${SITE.url}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  })
}
