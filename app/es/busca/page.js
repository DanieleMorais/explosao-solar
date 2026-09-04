import { Suspense } from 'react'
import SearchView from '@/components/views/SearchView'
import { buscar } from '@/lib/busca'
import { alternates } from '@/lib/seo'

export const metadata = {
  title: 'Buscar noticias',
  description: 'Encuentra artículos por palabra clave, sección o tema en Explosão Solar.',
  alternates: alternates('es', '/busca'),
}

export default function Page() {
  // Só as recentes vão no HTML; o resto do acervo é consultado em /api/busca.
  const { total, resultados } = buscar('', 'es', 24)
  return (
    <Suspense>
      <SearchView iniciais={resultados} totalAcervo={total} lang="es" />
    </Suspense>
  )
}
