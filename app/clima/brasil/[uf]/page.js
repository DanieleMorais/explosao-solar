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
    title: `Clima em ${e.nome} — capital e cidades`,
    description: `Previsão do tempo em ${e.nome}: capital ${e.capital}, todas as cidades e busca por bairro. Atualizado em tempo real.`,
    alternates: alternates('pt', `/clima/brasil/${e.uf.toLowerCase()}`),
  }
}

export default async function Page({ params }) {
  const { uf } = await params
  return <EstadoClimaView lang="pt" uf={uf} />
}
