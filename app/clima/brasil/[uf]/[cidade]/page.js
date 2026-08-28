import CidadeClimaView from '@/components/views/CidadeClimaView'
import { estado } from '@/lib/brasil'
import { alternates } from '@/lib/seo'

export const dynamic = 'force-dynamic' // clima em tempo real: busca a previsão a cada acesso

function titulo(slug) {
  return String(slug).split('-').map((p) => (p.length <= 2 ? p : p.charAt(0).toUpperCase() + p.slice(1))).join(' ')
}

export async function generateMetadata({ params }) {
  const { uf, cidade } = await params
  const e = estado(uf)
  if (!e) return {}
  const nome = titulo(cidade)
  return {
    title: `Previsão do tempo em ${nome}, ${e.uf} — hoje, amanhã e 5 dias`,
    description: `Previsão do tempo em ${nome} hoje e para os próximos dias: temperatura, chuva, clima por bairro e como é o tempo em ${nome} ao longo do ano. Atualizado em tempo real.`,
    alternates: alternates('pt', `/clima/brasil/${e.uf.toLowerCase()}/${cidade}`),
  }
}

export default async function Page({ params }) {
  const { uf, cidade } = await params
  return <CidadeClimaView lang="pt" uf={uf} cidade={cidade} />
}
