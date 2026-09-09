import { notFound, permanentRedirect } from 'next/navigation'
import CombinacaoView, { combinacaoMeta } from '@/components/views/CombinacaoView'
import { parDoSlug, parQualquerOrdem, slugPar, todosOsPares } from '@/lib/combinacoes'
import { withLang } from '@/lib/site'

export const revalidate = 86400

export function generateStaticParams() {
  return todosOsPares().map((par) => ({ par }))
}

export async function generateMetadata({ params }) {
  const { par } = await params
  if (!parDoSlug(par)) return {}
  return combinacaoMeta('en', par)
}

export default async function Page({ params }) {
  const { par } = await params
  if (!parDoSlug(par)) {
    const inverso = parQualquerOrdem(par)
    if (inverso) permanentRedirect(withLang('en', `/horoscopo/combinacao/${slugPar(inverso.a, inverso.b)}`))
    notFound()
  }
  return <CombinacaoView lang="en" slug={par} />
}
