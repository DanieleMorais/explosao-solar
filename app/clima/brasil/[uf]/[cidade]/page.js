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
    title: `Clima em ${nome} (${e.uf}) — previsão do tempo`,
    description: `Previsão do tempo em ${nome}, ${e.nome}: temperatura agora, 5 dias e clima por bairro. Atualizado em tempo real.`,
    alternates: alternates('pt', `/clima/brasil/${e.uf.toLowerCase()}/${cidade}`),
  }
}

export default async function Page({ params }) {
  const { uf, cidade } = await params
  return <CidadeClimaView lang="pt" uf={uf} cidade={cidade} />
}
