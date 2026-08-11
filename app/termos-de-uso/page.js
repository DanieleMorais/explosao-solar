import PageShell from '@/components/PageShell'
import { getInstitutional } from '@/lib/content'

export const metadata = {
  title: 'Termos de Uso',
  description: 'Condições de uso do portal Explosão Solar: direitos autorais, responsabilidades e regras de utilização do conteúdo.',
  alternates: { canonical: '/termos-de-uso' },
}

export default function TermsPage() {
  const { termsHtml } = getInstitutional()
  return (
    <PageShell kicker="Institucional" title="Termos de Uso" intro="As regras que valem para todo mundo que navega no Explosão Solar.">
      <div className="prose prose-legal" dangerouslySetInnerHTML={{ __html: termsHtml }} />
    </PageShell>
  )
}
