import PageShell from '@/components/PageShell'
import { getInstitutional } from '@/lib/content'

export const metadata = {
  title: 'Política de Privacidade',
  description: 'Saiba como o Explosão Solar coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.',
  alternates: { canonical: '/politica-de-privacidade' },
}

export default function PrivacyPage() {
  const { privacyHtml } = getInstitutional()
  return (
    <PageShell kicker="Institucional" title="Política de Privacidade" intro="Transparência total sobre como tratamos seus dados, em conformidade com a LGPD.">
      <div className="prose prose-legal" dangerouslySetInnerHTML={{ __html: privacyHtml }} />
    </PageShell>
  )
}
