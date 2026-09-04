import { Suspense } from 'react'
import SearchView from '@/components/views/SearchView'
import { buscar } from '@/lib/busca'
import { alternates } from '@/lib/seo'

export const metadata = {
  title: 'Buscar notícias',
  description: 'Encontre matérias por palavra-chave, editoria ou tema no Explosão Solar.',
  alternates: alternates('pt', '/busca'),
}

export default function Page() {
  // Só as recentes vão no HTML; o resto do acervo é consultado em /api/busca.
  const { total, resultados } = buscar('', 'pt', 24)
  return (
    <Suspense>
      <SearchView iniciais={resultados} totalAcervo={total} lang="pt" />
    </Suspense>
  )
}
