import LegalDocView, { legalMeta } from '@/components/views/LegalDocView'

export const metadata = legalMeta('en', 'termos-de-uso')

export default function Page() {
  return <LegalDocView lang="en" doc="termos-de-uso" />
}
