import LegalDocView, { legalMeta } from '@/components/views/LegalDocView'

export const metadata = legalMeta('en', 'politica-de-cookies')

export default function Page() {
  return <LegalDocView lang="en" doc="politica-de-cookies" />
}
