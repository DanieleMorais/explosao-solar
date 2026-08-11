import { getAllArticles } from '@/lib/content'
import { renderArticleOg, ogSize } from '@/components/OgArticleImage'

export const size = ogSize
export const contentType = 'image/png'
export const alt = 'Explosão Solar'

export function generateStaticParams() {
  return getAllArticles('en').map((a) => ({ slug: a.slug }))
}

export default async function Image({ params }) {
  const { slug } = await params
  return renderArticleOg(slug, 'en')
}
