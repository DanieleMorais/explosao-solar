import EstadoClimaView from '@/components/views/EstadoClimaView'
import { ESTADOS, estado } from '@/lib/brasil'
import { alternates } from '@/lib/seo'

export const dynamic = 'force-dynamic' // clima em tempo real: busca a previsão a cada acesso

export function generateStaticParams() {
  return ESTADOS.map((e) => ({ uf: e.uf.toLowerCase() }))
}

export async function generateMetadata({ params }) {
  const { uf } = await params
  const e = estado(uf)
  if (!e) return {}
  return {
    title: `Weather in ${e.nome}, Brazil — capital and cities`,
    description: `Weather forecast for ${e.nome}: capital ${e.capital}, all cities and neighborhood search. Updated in real time.`,
    alternates: alternates('en', `/clima/brasil/${e.uf.toLowerCase()}`),
  }
}

export default async function Page({ params }) {
  const { uf } = await params
  return <EstadoClimaView lang="en" uf={uf} />
}
