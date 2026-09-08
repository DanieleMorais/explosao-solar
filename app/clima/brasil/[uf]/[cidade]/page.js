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
    title: `Clima em ${nome} amanhã e hoje — previsão de 14 dias`,
    description: `Vai chover amanhã em ${nome}? Veja a previsão do tempo hora a hora, a máxima e a mínima de hoje, de amanhã e dos próximos 14 dias em ${nome}, ${e.uf} — com clima por bairro. Atualizado em tempo real.`,
    alternates: alternates('pt', `/clima/brasil/${e.uf.toLowerCase()}/${cidade}`),
  }
}

export default async function Page({ params }) {
  const { uf, cidade } = await params
  return <CidadeClimaView lang="pt" uf={uf} cidade={cidade} />
}
