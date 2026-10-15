import ArticleView from '@/components/views/ArticleView'
import { getAllArticles, getArticle, indexavel } from '@/lib/content'
import { alternates, OG_LOCALE, ROBOTS_NOINDEX } from '@/lib/seo'

export const dynamicParams = false

export function generateStaticParams() {
  return getAllArticles('pt').map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const a = getArticle(slug, 'pt')
  if (!a) return {}
  return {
    title: a.seoTitle || a.title,
    description: a.excerpt,
    keywords: a.tags,
    authors: [{ name: a.author }],
    other: { news_keywords: (a.tags || []).join(', ') },
    alternates: alternates('pt', `/noticia/${a.slug}`),
    ...(indexavel(a) ? {} : { robots: ROBOTS_NOINDEX }),
    openGraph: {
      type: 'article',
      locale: OG_LOCALE.pt,
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
  return <ArticleView lang="pt" slug={slug} />
}
