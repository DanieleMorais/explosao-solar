import LegalDocView, { legalMeta } from '@/components/views/LegalDocView'

export const metadata = legalMeta('pt', 'politica-de-cookies')

export default function Page() {
  return <LegalDocView lang="pt" doc="politica-de-cookies" />
}
