import ArticleView from '@/components/views/ArticleView'
import { getAllArticles, getArticle } from '@/lib/content'
import { alternates, OG_LOCALE } from '@/lib/seo'

export const dynamicParams = false

export function generateStaticParams() {
  return getAllArticles('es').map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const a = getArticle(slug, 'es')
  if (!a) return {}
  return {
    title: a.seoTitle || a.title,
    description: a.excerpt,
    keywords: a.tags,
    authors: [{ name: a.author }],
    other: { news_keywords: (a.tags || []).join(', ') },
    alternates: alternates('es', `/noticia/${a.slug}`),
    openGraph: {
      type: 'article',
      locale: OG_LOCALE.es,
      title: a.title,
      description: a.excerpt,
      publishedTime: a.publishedAt,
      section: a.category,
      tags: a.tags,
    },
    twitter: { card: 'summary_large_image', title: a.title, description: a.excerpt },
  }
}

export default async function Page({ params }) {
  const { slug } = await params
  return <ArticleView lang="es" slug={slug} />
}
