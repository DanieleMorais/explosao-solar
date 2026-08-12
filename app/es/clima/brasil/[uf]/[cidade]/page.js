import CidadeClimaView from '@/components/views/CidadeClimaView'
import { estado } from '@/lib/brasil'
import { alternates } from '@/lib/seo'

export const revalidate = 1800

function titulo(slug) {
  return String(slug).split('-').map((p) => (p.length <= 2 ? p : p.charAt(0).toUpperCase() + p.slice(1))).join(' ')
}

export async function generateMetadata({ params }) {
  const { uf, cidade } = await params
  const e = estado(uf)
  if (!e) return {}
  const nome = titulo(cidade)
  return {
    title: `Clima en ${nome} (${e.uf}), Brasil`,
    description: `Pronóstico del tiempo en ${nome}, ${e.nome}: temperatura actual, 5 días y clima por barrio. Actualizado en tiempo real.`,
    alternates: alternates('es', `/clima/brasil/${e.uf.toLowerCase()}/${cidade}`),
  }
}

export default async function Page({ params }) {
  const { uf, cidade } = await params
  return <CidadeClimaView lang="es" uf={uf} cidade={cidade} />
}
