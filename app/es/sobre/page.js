import LegalDocView, { legalMeta } from '@/components/views/LegalDocView'

export const metadata = legalMeta('es', 'sobre')

export default function Page() {
  return <LegalDocView lang="es" doc="sobre" />
}
