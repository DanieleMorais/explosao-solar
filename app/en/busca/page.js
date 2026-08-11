import { Suspense } from 'react'
import { getAllArticles } from '@/lib/content'
import SearchView from '@/components/views/SearchView'
import { alternates } from '@/lib/seo'

export const metadata = {
  title: 'Search news',
  description: 'Find articles by keyword, section or topic on Explosão Solar.',
  alternates: alternates('en', '/busca'),
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
      <SearchView articles={getAllArticles('en').map(slim)} lang="en" />
    </Suspense>
  )
}
