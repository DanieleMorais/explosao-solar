import { ESTADOS } from '@/lib/brasil'
import { TOP_CIDADES } from '@/lib/cidades-br'
import { urlTrilingue, urlset, respostaXml, LANGS } from '@/lib/sitemap-xml'

export const revalidate = 86400

// Sitemap das páginas de clima (estados + cidades, 3 idiomas). Prioridade BAIXA
// pra não roubar orçamento de rastreamento das matérias num domínio novo.
export function GET() {
  const now = new Date()
  const itens = []

  for (const lang of LANGS) {
    itens.push(urlTrilingue('/clima', lang, { lastModified: now, changeFrequency: 'daily', priority: 0.4 }))
    itens.push(urlTrilingue('/clima/brasil', lang, { lastModified: now, changeFrequency: 'weekly', priority: 0.4 }))
    for (const e of ESTADOS) {
      itens.push(urlTrilingue(`/clima/brasil/${e.uf.toLowerCase()}`, lang, { lastModified: now, changeFrequency: 'weekly', priority: 0.3 }))
    }
    for (const c of TOP_CIDADES) {
      itens.push(urlTrilingue(`/clima/brasil/${c.uf.toLowerCase()}/${c.slug}`, lang, { lastModified: now, changeFrequency: 'weekly', priority: 0.3 }))
    }
  }

  return respostaXml(urlset(itens))
}
