import PageShell from '@/components/PageShell'
import { getInstitutional } from '@/lib/content'
import { t } from '@/lib/tokens'

export const metadata = {
  title: 'Perguntas frequentes',
  description: 'Tire suas dúvidas sobre o portal Explosão Solar: linha editorial, contato, publicidade, privacidade e mais.',
  alternates: { canonical: '/faq' },
}

export default function FaqPage() {
  const { faqItems } = getInstitutional()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }

  return (
    <PageShell
      kicker="Central de ajuda"
      title="Perguntas frequentes"
      intro="Tudo o que você precisa saber sobre o Explosão Solar — como trabalhamos, como falar com a gente e como cuidamos dos seus dados."
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {faqItems.map((f, i) => (
          <details
            key={i}
            style={{
              background: t.card,
              border: `1px solid ${t.line}`,
              borderRadius: t.radiusSm,
              padding: '16px 20px',
              boxShadow: t.shadow,
            }}
          >
            <summary style={{ fontWeight: 800, fontSize: 15.5, cursor: 'pointer', color: t.ink, lineHeight: 1.4 }}>{f.question}</summary>
            <p style={{ marginTop: 12, fontSize: 14.5, lineHeight: 1.7, color: t.inkSoft }}>{f.answer}</p>
          </details>
        ))}
      </div>
    </PageShell>
  )
}
