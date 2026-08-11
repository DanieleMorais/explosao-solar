import PageShell from '@/components/PageShell'
import { getInstitutional } from '@/lib/content'

export const metadata = {
  title: 'Política de Cookies',
  description: 'Entenda quais cookies o Explosão Solar utiliza, para que servem e como gerenciá-los no seu navegador.',
  alternates: { canonical: '/politica-de-cookies' },
}

export default function CookiesPage() {
  const { cookiesHtml } = getInstitutional()
  return (
    <PageShell kicker="Institucional" title="Política de Cookies" intro="O que são, como usamos e como você controla os cookies deste site.">
      <div className="prose prose-legal" dangerouslySetInnerHTML={{ __html: cookiesHtml }} />
    </PageShell>
  )
}
