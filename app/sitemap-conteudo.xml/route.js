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
  itens.push(urlSimples(`${SITE.url}/terremotos`, { lastModified: now, changeFrequency: 'hourly', priority: 0.8 }))
  itens.push(urlSimples(`${SITE.url}/cotacoes`, { lastModified: now, changeFrequency: 'hourly', priority: 0.8 }))
  itens.push(urlSimples(`${SITE.url}/loterias`, { lastModified: now, changeFrequency: 'hourly', priority: 0.8 }))
  itens.push(urlSimples(`${SITE.url}/feriados`, { lastModified: now, changeFrequency: 'daily', priority: 0.6 }))
  {
    const y = now.getFullYear()
    itens.push(urlSimples(`${SITE.url}/feriados/${y + 1}`, { lastModified: now, changeFrequency: 'monthly', priority: 0.6 }))
    itens.push(urlSimples(`${SITE.url}/feriados/${y + 2}`, { lastModified: now, changeFrequency: 'monthly', priority: 0.5 }))
  }
  itens.push(urlSimples(`${SITE.url}/horoscopo`, { lastModified: now, changeFrequency: 'daily', priority: 0.7 }))
  for (const s of ['aries', 'touro', 'gemeos', 'cancer', 'leao', 'virgem', 'libra', 'escorpiao', 'sagitario', 'capricornio', 'aquario', 'peixes']) {
    itens.push(urlSimples(`${SITE.url}/horoscopo/${s}`, { lastModified: now, changeFrequency: 'daily', priority: 0.6 }))
  }

  for (const p of ['/sobre', '/faq', '/contato', '/politica-de-privacidade', '/politica-de-cookies', '/termos-de-uso']) {
    for (const prefixo of ['', '/en', '/es']) {
      itens.push(urlSimples(`${SITE.url}${prefixo}${p}`, { lastModified: now, changeFrequency: 'monthly', priority: 0.5 }))
    }
  }

  return respostaXml(urlset(itens))
}
