import { permanentRedirect } from 'next/navigation'
import ArticleView from '@/components/views/ArticleView'
import TraducaoView from '@/components/views/TraducaoView'
import { getAllArticles, getArticle } from '@/lib/content'
import { alternates, OG_LOCALE } from '@/lib/seo'
import { slugDoParametro } from '@/lib/blogSlug'
import { paramsDoIdioma, resolverRota } from '@/lib/traducoes'
import { metadataTraducao, metadataRedirecionamento } from '@/lib/paginasIdioma'

export const dynamicParams = false

// Duas gerações de matéria em espanhol no mesmo endereço-base: a tradução antiga (slug PT, noindex desde o freio de
// 14/10) e a do blog em 12 idiomas (slug em espanhol, indexável). Quando a matéria ganha a tradução nova, o endereço
// antigo /es/noticia/<slug-pt> vira redirecionamento permanente (308) para ela.
export function generateStaticParams() {
  const slugs = new Set(getAllArticles('es').map((a) => a.slug))
  for (const s of paramsDoIdioma('es')) slugs.add(s)
  return [...slugs].map((slug) => ({ slug }))
}

export async function generateMetadata({ params }) {
  const slug = slugDoParametro((await params).slug)
  const r = resolverRota('es', slug)
  if (r?.tipo === 'traducao') return metadataTraducao('es', r)
  if (r?.tipo === 'redirecionar') return metadataRedirecionamento()
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
  const slug = slugDoParametro((await params).slug)
  const r = resolverRota('es', slug)
  if (r?.tipo === 'redirecionar') permanentRedirect(r.para)
  if (r?.tipo === 'traducao') return <TraducaoView lang="es" doc={r.doc} pt={r.pt} versoes={r.versoes} />
  return <ArticleView lang="es" slug={slug} />
}
