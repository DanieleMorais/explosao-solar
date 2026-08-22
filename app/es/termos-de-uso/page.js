import LegalDocView, { legalMeta } from '@/components/views/LegalDocView'

export const metadata = legalMeta('es', 'termos-de-uso')

export default function Page() {
  return <LegalDocView lang="es" doc="termos-de-uso" />
}
