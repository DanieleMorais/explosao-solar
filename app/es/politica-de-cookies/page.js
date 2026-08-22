import LegalDocView, { legalMeta } from '@/components/views/LegalDocView'

export const metadata = legalMeta('es', 'politica-de-cookies')

export default function Page() {
  return <LegalDocView lang="es" doc="politica-de-cookies" />
}
