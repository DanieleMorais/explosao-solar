import CidadeClimaView from '@/components/views/CidadeClimaView'
import { estado } from '@/lib/brasil'
import { cidadeBR } from '@/lib/cidades-br'
import { alternates } from '@/lib/seo'

export const dynamic = 'force-dynamic' // clima em tempo real: busca a previsão a cada acesso

function titulo(slug) {
  return String(slug).split('-').map((p) => (p.length <= 2 ? p : p.charAt(0).toUpperCase() + p.slice(1))).join(' ')
}

export async function generateMetadata({ params }) {
  const { uf, cidade } = await params
  const e = estado(uf)
  if (!e) return {}
  // o slug perde acento (jaragua-do-sul): o nome real vem da base de cidades
  const nome = cidadeBR(e.uf, cidade)?.nome || titulo(cidade)
  return {
    title: `Clima en ${nome} mañana y hoy — pronóstico de 14 días`,
    description: `Pronóstico del tiempo en ${nome}, Brasil hoy y para los próximos días: temperatura, lluvia, clima por barrio y cómo es el clima en ${nome} a lo largo del año. Actualizado en tiempo real.`,
    alternates: alternates('es', `/clima/brasil/${e.uf.toLowerCase()}/${cidade}`),
  }
}

export default async function Page({ params }) {
  const { uf, cidade } = await params
  return <CidadeClimaView lang="es" uf={uf} cidade={cidade} />
}
