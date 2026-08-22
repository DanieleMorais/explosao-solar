import FaqView, { faqMeta } from '@/components/views/FaqView'

export const metadata = faqMeta('en')

export default function Page() {
  return <FaqView lang="en" />
}
