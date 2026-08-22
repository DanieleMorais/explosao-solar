import PageShell from '@/components/PageShell'
import { getInstitutional } from '@/lib/content'
import { alternates } from '@/lib/seo'
import { t } from '@/lib/tokens'

const STRINGS = {
  pt: {
    kicker: 'Central de ajuda',
    title: 'Perguntas frequentes',
    intro: 'Tudo o que você precisa saber sobre o Explosão Solar — como trabalhamos, como falar com a gente e como cuidamos dos seus dados.',
    metaTitle: 'Perguntas frequentes',
    metaDescription: 'Tire suas dúvidas sobre o portal Explosão Solar: linha editorial, contato, publicidade, privacidade e mais.',
  },
  en: {
    kicker: 'Help center',
    title: 'Frequently asked questions',
    intro: 'Everything you need to know about Explosão Solar — how we work, how to reach us and how we handle your data.',
    metaTitle: 'FAQ',
    metaDescription: 'Get answers about the Explosão Solar portal: editorial standards, contact, advertising, privacy and more.',
  },
  es: {
    kicker: 'Centro de ayuda',
    title: 'Preguntas frecuentes',
    intro: 'Todo lo que necesita saber sobre Explosão Solar: cómo trabajamos, cómo contactarnos y cómo cuidamos sus datos.',
    metaTitle: 'Preguntas frecuentes',
    metaDescription: 'Resuelva sus dudas sobre el portal Explosão Solar: línea editorial, contacto, publicidad, privacidad y más.',
  },
}

export function faqMeta(lang) {
  const s = STRINGS[lang]
  return { title: s.metaTitle, description: s.metaDescription, alternates: alternates(lang, '/faq') }
}

export default function FaqView({ lang = 'pt' }) {
  const s = STRINGS[lang]
  const { faqItems } = getInstitutional(lang)

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
    <PageShell kicker={s.kicker} title={s.title} intro={s.intro}>
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
