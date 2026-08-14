import { SITE } from '@/lib/content'
import { respostaXml } from '@/lib/sitemap-xml'

export const revalidate = 3600

export function GET() {
  const now = new Date().toISOString()
  const maps = ['sitemap-conteudo.xml', 'news-sitemap.xml', 'sitemap-clima.xml']
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${maps.map((m) => `  <sitemap><loc>${SITE.url}/${m}</loc><lastmod>${now}</lastmod></sitemap>`).join('\n')}
</sitemapindex>`
  return respostaXml(xml)
}
