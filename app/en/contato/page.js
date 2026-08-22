import ContactView, { contactMeta } from '@/components/views/ContactView'

export const metadata = contactMeta('en')

export default function Page() {
  return <ContactView lang="en" />
}
