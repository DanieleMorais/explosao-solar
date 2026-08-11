import { SITE } from '@/lib/content'

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: [`${SITE.url}/sitemap.xml`, `${SITE.url}/news-sitemap.xml`],
  }
}
