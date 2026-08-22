import LegalDocView, { legalMeta } from '@/components/views/LegalDocView'

export const metadata = legalMeta('es', 'politica-de-privacidade')

export default function Page() {
  return <LegalDocView lang="es" doc="politica-de-privacidade" />
}
