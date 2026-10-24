import { getAllArticles } from '@/lib/content'
import { renderArticleOg, ogSize } from '@/components/OgArticleImage'
import { slugDoParametro } from '@/lib/blogSlug'
import { traducoesPublicadas } from '@/lib/traducoes'

export const size = ogSize
export const contentType = 'image/png'
export const alt = 'Explosão Solar'

// a tradução antiga (slug PT) e a do blog em 12 idiomas (slug em inglês): as duas têm imagem com o título em inglês
export function generateStaticParams() {
  const slugs = new Set(getAllArticles('en').map((a) => a.slug))
  for (const d of traducoesPublicadas('en')) slugs.add(d.slugIdioma)
  return [...slugs].map((slug) => ({ slug }))
}

export default async function Image({ params }) {
  const { slug } = await params
  return renderArticleOg(slugDoParametro(slug), 'en')
}
