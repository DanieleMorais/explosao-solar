import { Suspense } from 'react'
import { getAllArticles } from '@/lib/content'
import SearchView from '@/components/views/SearchView'
import { alternates } from '@/lib/seo'

export const metadata = {
  title: 'Buscar noticias',
  description: 'Encuentra artículos por palabra clave, sección o tema en Explosão Solar.',
  alternates: alternates('es', '/busca'),
}

function slim(a) {
  return {
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    category: a.category,
    categorySlug: a.categorySlug,
    publishedAt: a.publishedAt,
    readingMinutes: a.readingMinutes,
    tags: a.tags,
  }
}

export default function Page() {
  return (
    <Suspense>
      <SearchView articles={getAllArticles('es').map(slim)} lang="es" />
    </Suspense>
  )
}
