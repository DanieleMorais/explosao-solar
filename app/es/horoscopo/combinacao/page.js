import CombinacaoIndexView, { combinacaoIndexMeta } from '@/components/views/CombinacaoIndexView'

export const revalidate = 86400

export const metadata = combinacaoIndexMeta('es')

export default function Page() {
  return <CombinacaoIndexView lang="es" />
}
