import { getAllArticles, CATEGORIES, SITE } from '@/lib/content'
import { urlTrilingue, urlSimples, urlset, respostaXml, LANGS } from '@/lib/sitemap-xml'

export const revalidate = 3600

// Sitemap enxuto e de ALTA prioridade: home, editorias e matérias (3 idiomas) +
// páginas institucionais. É o que a gente quer que o Google rastreie primeiro.
export function GET() {
  const now = new Date()
  const itens = []

  for (const lang of LANGS) {
    itens.push(urlTrilingue('', lang, { lastModified: now, changeFrequency: 'hourly', priority: 1 }))
    for (const c of CATEGORIES) {
      itens.push(urlTrilingue(`/${c.slug}`, lang, { lastModified: now, changeFrequency: 'daily', priority: 0.8 }))
    }
    for (const a of getAllArticles(lang)) {
      itens.push(
        urlTrilingue(`/noticia/${a.slug}`, lang, {
          lastModified: new Date(a.updatedAt || a.publishedAt),
          changeFrequency: 'daily',
          priority: 0.9,
        })
      )
    }
  }

  // utilidades (alto volume de busca)
  itens.push(urlSimples(`${SITE.url}/cotacoes`, { lastModified: now, changeFrequency: 'hourly', priority: 0.8 }))

  for (const p of ['/sobre', '/faq', '/contato', '/politica-de-privacidade', '/politica-de-cookies', '/termos-de-uso']) {
    itens.push(urlSimples(`${SITE.url}${p}`, { lastModified: now, changeFrequency: 'monthly', priority: 0.5 }))
  }

  return respostaXml(urlset(itens))
}
