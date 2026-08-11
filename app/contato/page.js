import PageShell from '@/components/PageShell'
import ContactForm from './ContactForm'
import { SITE } from '@/lib/content'
import { t } from '@/lib/tokens'

export const metadata = {
  title: 'Fale conosco',
  description: 'Entre em contato com a redação do Explosão Solar: sugestões de pauta, correções, publicidade e parcerias.',
  alternates: { canonical: '/contato' },
}

const CHANNELS = [
  { title: 'Redação', desc: 'Sugestões de pauta, correções e direito de resposta.', email: SITE.email },
  { title: 'Publicidade', desc: 'Anuncie no portal e alcance leitores engajados.', email: SITE.email },
  { title: 'Leitores', desc: 'Dúvidas, elogios e críticas — a gente lê tudo.', email: SITE.email },
]

export default function ContactPage() {
  return (
    <PageShell kicker="Fale conosco" title="Contato" intro="Canal aberto com a redação. Respondemos em até 2 dias úteis.">
      <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 }}>
        {CHANNELS.map((c) => (
          <div
            key={c.title}
            style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, padding: '20px 22px', boxShadow: t.shadow }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{c.title}</h2>
            <p style={{ fontSize: 13.5, color: t.inkSoft, lineHeight: 1.6, marginBottom: 12 }}>{c.desc}</p>
            <a href={`mailto:${c.email}`} className="hoverlink" style={{ fontSize: 13.5, fontWeight: 700, color: t.sun }}>
              {c.email}
            </a>
          </div>
        ))}
      </div>
      <ContactForm email={SITE.email} />
    </PageShell>
  )
}
