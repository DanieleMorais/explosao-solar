import PageShell from '@/components/PageShell'
import { getInstitutional } from '@/lib/content'

export const metadata = {
  title: 'Sobre nós',
  description: 'Conheça o Explosão Solar: nossa missão editorial, valores e compromisso com o jornalismo explicativo de profundidade.',
  alternates: { canonical: '/sobre' },
}

export default function AboutPage() {
  const { aboutHtml } = getInstitutional()
  return (
    <PageShell kicker="Institucional" title="Sobre o Explosão Solar" intro="Jornalismo que escolhe a profundidade em vez da pressa.">
      <div className="prose" dangerouslySetInnerHTML={{ __html: aboutHtml }} />
    </PageShell>
  )
}
