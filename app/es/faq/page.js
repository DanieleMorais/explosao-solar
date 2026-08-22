import FaqView, { faqMeta } from '@/components/views/FaqView'

export const metadata = faqMeta('es')

export default function Page() {
  return <FaqView lang="es" />
}
