import EstadoClimaView from '@/components/views/EstadoClimaView'
import { ESTADOS, estado } from '@/lib/brasil'
import { alternates } from '@/lib/seo'

export const revalidate = 1800

export function generateStaticParams() {
  return ESTADOS.map((e) => ({ uf: e.uf.toLowerCase() }))
}

export async function generateMetadata({ params }) {
  const { uf } = await params
  const e = estado(uf)
  if (!e) return {}
  return {
    title: `Clima en ${e.nome}, Brasil — capital y ciudades`,
    description: `Pronóstico del tiempo en ${e.nome}: capital ${e.capital}, todas las ciudades y búsqueda por barrio. Actualizado en tiempo real.`,
    alternates: alternates('es', `/clima/brasil/${e.uf.toLowerCase()}`),
  }
}

export default async function Page({ params }) {
  const { uf } = await params
  return <EstadoClimaView lang="es" uf={uf} />
}
