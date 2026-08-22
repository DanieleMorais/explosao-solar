import ContactView, { contactMeta } from '@/components/views/ContactView'

export const metadata = contactMeta('es')

export default function Page() {
  return <ContactView lang="es" />
}
