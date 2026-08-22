import LegalDocView, { legalMeta } from '@/components/views/LegalDocView'

export const metadata = legalMeta('pt', 'termos-de-uso')

export default function Page() {
  return <LegalDocView lang="pt" doc="termos-de-uso" />
}
