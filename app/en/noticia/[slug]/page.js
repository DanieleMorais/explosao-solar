import { permanentRedirect } from 'next/navigation'
import ArticleView from '@/components/views/ArticleView'
import TraducaoView from '@/components/views/TraducaoView'
import { getAllArticles, getArticle } from '@/lib/content'
import { alternates, OG_LOCALE } from '@/lib/seo'
import { slugDoParametro } from '@/lib/blogSlug'
import { paramsDoIdioma, resolverRota } from '@/lib/traducoes'
import { metadataTraducao, metadataRedirecionamento } from '@/lib/paginasIdioma'

export const dynamicParams = false

// Duas gerações de matéria em inglês no mesmo endereço-base: a tradução antiga (slug PT, noindex desde o freio de 14/10)
// e a do blog em 12 idiomas (slug em inglês, indexável). Quando a matéria ganha a tradução nova, o endereço antigo
// /en/noticia/<slug-pt> vira redirecionamento permanente (308) para ela.
export function generateStaticParams() {
  const slugs = new Set(getAllArticles('en').map((a) => a.slug))
  for (const s of paramsDoIdioma('en')) slugs.add(s)
  return [...slugs].map((slug) => ({ slug }))
}

export async function generateMetadata({ params }) {
  const slug = slugDoParametro((await params).slug)
  const r = resolverRota('en', slug)
  if (r?.tipo === 'traducao') return metadataTraducao('en', r)
  if (r?.tipo === 'redirecionar') return metadataRedirecionamento()
  const a = getArticle(slug, 'en')
  if (!a) return {}
  return {
    title: a.seoTitle || a.title,
    description: a.excerpt,
    keywords: a.tags,
    authors: [{ name: a.author }],
    other: { news_keywords: (a.tags || []).join(', ') },
    alternates: alternates('en', `/noticia/${a.slug}`),
    openGraph: {
      type: 'article',
      locale: OG_LOCALE.en,
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
  const slug = slugDoParametro((await params).slug)
  const r = resolverRota('en', slug)
  if (r?.tipo === 'redirecionar') permanentRedirect(r.para)
  if (r?.tipo === 'traducao') return <TraducaoView lang="en" doc={r.doc} pt={r.pt} versoes={r.versoes} />
  return <ArticleView lang="en" slug={slug} />
}
