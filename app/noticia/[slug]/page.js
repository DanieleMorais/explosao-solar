import ArticleView from '@/components/views/ArticleView'
import { getAllArticles, getArticle, indexavel } from '@/lib/content'
import { alternates, OG_LOCALE, ROBOTS_NOINDEX } from '@/lib/seo'
import { versoesPublicadas } from '@/lib/traducoes'
import { hreflangDoBlog } from '@/lib/blogDic'

export const dynamicParams = false

// Matéria com traduções do blog em 12 idiomas publicadas: hreflang para cada versão (com o slug do idioma) e x-default
// nesta. Sem tradução, só o canonical, como era.
function alternatesDaMateria(slug) {
  const base = alternates('pt', `/noticia/${slug}`)
  const languages = hreflangDoBlog(slug, versoesPublicadas(slug))
  return languages ? { ...base, languages } : base
}

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
    alternates: alternatesDaMateria(a.slug),
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
