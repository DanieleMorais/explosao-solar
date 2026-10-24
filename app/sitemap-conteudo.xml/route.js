import { getAllArticles, CATEGORIES, SITE, indexavel } from '@/lib/content'
import { urlSimples, urlset, respostaXml } from '@/lib/sitemap-xml'
import { todosOsPares } from '@/lib/combinacoes'
import { entradasSitemap } from '@/lib/traducoes'

export const revalidate = 3600

// Sitemap enxuto e de ALTA prioridade: home, editorias e matérias + páginas institucionais.
// Freio de 14/10/2026: só português e só matéria com 400+ palavras — EN/ES (tradução automática)
// e matéria curta estão com noindex e não entram aqui.
export function GET() {
  const now = new Date()
  const itens = []

  itens.push(urlSimples(SITE.url, { lastModified: now, changeFrequency: 'hourly', priority: 1 }))
  for (const c of CATEGORIES) {
    itens.push(urlSimples(`${SITE.url}/${c.slug}`, { lastModified: now, changeFrequency: 'daily', priority: 0.8 }))
  }
  for (const a of getAllArticles('pt')) {
    if (!indexavel(a)) continue
    itens.push(
      urlSimples(`${SITE.url}/noticia/${a.slug}`, {
        lastModified: new Date(a.updatedAt || a.publishedAt),
        changeFrequency: 'daily',
        priority: 0.9,
      })
    )
  }

  // Blog em 12 idiomas (16/10/2026): a lista /<idioma>/noticia de cada idioma que já tem matéria publicada e cada
  // tradução publicada, com o slug no idioma percent-encoded. Rascunho nunca entra. As traduções antigas de /en e /es
  // (slug PT) seguem fora: noindex desde o freio de 14/10.
  for (const e of entradasSitemap()) {
    itens.push(urlSimples(`${SITE.url}${e.caminho}`, { lastModified: new Date(e.quando || now), changeFrequency: 'weekly', priority: 0.7 }))
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

  itens.push(urlSimples(`${SITE.url}/horoscopo/combinacao`, { lastModified: now, changeFrequency: 'monthly', priority: 0.6 }))
  for (const par of todosOsPares()) {
    itens.push(urlSimples(`${SITE.url}/horoscopo/combinacao/${par}`, { lastModified: now, changeFrequency: 'monthly', priority: 0.6 }))
  }

  for (const p of ['/sobre', '/faq', '/contato', '/politica-de-privacidade', '/politica-de-cookies', '/termos-de-uso']) {
    itens.push(urlSimples(`${SITE.url}${p}`, { lastModified: now, changeFrequency: 'monthly', priority: 0.5 }))
  }

  return respostaXml(urlset(itens))
}
