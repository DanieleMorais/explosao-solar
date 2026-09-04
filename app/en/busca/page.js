import { Suspense } from 'react'
import SearchView from '@/components/views/SearchView'
import { buscar } from '@/lib/busca'
import { alternates } from '@/lib/seo'

export const metadata = {
  title: 'Search news',
  description: 'Find articles by keyword, section or topic on Explosão Solar.',
  alternates: alternates('en', '/busca'),
}

export default function Page() {
  // Só as recentes vão no HTML; o resto do acervo é consultado em /api/busca.
  const { total, resultados } = buscar('', 'en', 24)
  return (
    <Suspense>
      <SearchView iniciais={resultados} totalAcervo={total} lang="en" />
    </Suspense>
  )
}
