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
    title: `Weather in ${nome}, ${e.uf} — today, tomorrow and 5-day forecast`,
    description: `Weather forecast for ${nome}, Brazil today and for the coming days: temperature, rain, neighborhood weather and what the climate in ${nome} is like through the year. Updated in real time.`,
    alternates: alternates('en', `/clima/brasil/${e.uf.toLowerCase()}/${cidade}`),
  }
}

export default async function Page({ params }) {
  const { uf, cidade } = await params
  return <CidadeClimaView lang="en" uf={uf} cidade={cidade} />
}
