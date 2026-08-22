import PageShell from '@/components/PageShell'
import ContactForm from '@/app/contato/ContactForm'
import { SITE } from '@/lib/content'
import { alternates } from '@/lib/seo'
import { t } from '@/lib/tokens'

const STRINGS = {
  pt: {
    kicker: 'Fale conosco',
    title: 'Contato',
    intro: 'Canal aberto com a redação. Respondemos em até 2 dias úteis.',
    metaTitle: 'Fale conosco',
    metaDescription: 'Entre em contato com a redação do Explosão Solar: sugestões de pauta, correções, publicidade e parcerias.',
    channels: [
      { title: 'Redação', desc: 'Sugestões de pauta, correções e direito de resposta.' },
      { title: 'Publicidade', desc: 'Anuncie no portal e alcance leitores engajados.' },
      { title: 'Leitores', desc: 'Dúvidas, elogios e críticas — a gente lê tudo.' },
    ],
    form: {
      heading: 'Envie uma mensagem',
      name: 'Seu nome',
      subject: 'Assunto',
      message: 'Escreva sua mensagem…',
      send: 'Enviar mensagem',
      hint: 'O envio abre o seu aplicativo de e-mail com a mensagem pronta.',
      bodyName: 'Nome',
    },
  },
  en: {
    kicker: 'Contact us',
    title: 'Contact',
    intro: 'An open channel with the newsroom. We reply within 2 business days.',
    metaTitle: 'Contact us',
    metaDescription: 'Get in touch with the Explosão Solar newsroom: story suggestions, corrections, advertising and partnerships.',
    channels: [
      { title: 'Newsroom', desc: 'Story suggestions, corrections and right of reply.' },
      { title: 'Advertising', desc: 'Advertise on the portal and reach engaged readers.' },
      { title: 'Readers', desc: 'Questions, praise and criticism — we read everything.' },
    ],
    form: {
      heading: 'Send a message',
      name: 'Your name',
      subject: 'Subject',
      message: 'Write your message…',
      send: 'Send message',
      hint: 'Sending opens your e-mail app with the message ready to go.',
      bodyName: 'Name',
    },
  },
  es: {
    kicker: 'Contáctenos',
    title: 'Contacto',
    intro: 'Un canal abierto con la redacción. Respondemos en hasta 2 días hábiles.',
    metaTitle: 'Contáctenos',
    metaDescription: 'Póngase en contacto con la redacción de Explosão Solar: sugerencias de temas, correcciones, publicidad y alianzas.',
    channels: [
      { title: 'Redacción', desc: 'Sugerencias de temas, correcciones y derecho de réplica.' },
      { title: 'Publicidad', desc: 'Anuncie en el portal y llegue a lectores comprometidos.' },
      { title: 'Lectores', desc: 'Dudas, elogios y críticas: lo leemos todo.' },
    ],
    form: {
      heading: 'Envíe un mensaje',
      name: 'Su nombre',
      subject: 'Asunto',
      message: 'Escriba su mensaje…',
      send: 'Enviar mensaje',
      hint: 'El envío abre su aplicación de correo con el mensaje listo.',
      bodyName: 'Nombre',
    },
  },
}

export function contactMeta(lang) {
  const s = STRINGS[lang]
  return { title: s.metaTitle, description: s.metaDescription, alternates: alternates(lang, '/contato') }
}

export default function ContactView({ lang = 'pt' }) {
  const s = STRINGS[lang]
  return (
    <PageShell kicker={s.kicker} title={s.title} intro={s.intro}>
      <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 }}>
        {s.channels.map((c) => (
          <div
            key={c.title}
            style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, padding: '20px 22px', boxShadow: t.shadow }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{c.title}</h2>
            <p style={{ fontSize: 13.5, color: t.inkSoft, lineHeight: 1.6, marginBottom: 12 }}>{c.desc}</p>
            <a href={`mailto:${SITE.email}`} className="hoverlink" style={{ fontSize: 13.5, fontWeight: 700, color: t.sun }}>
              {SITE.email}
            </a>
          </div>
        ))}
      </div>
      <ContactForm email={SITE.email} labels={s.form} />
    </PageShell>
  )
}
