import PageShell from '@/components/PageShell'
import { getInstitutional } from '@/lib/content'
import { alternates } from '@/lib/seo'

const DOCS = {
  sobre: {
    campo: 'aboutHtml',
    prose: 'prose',
    href: '/sobre',
    pt: {
      kicker: 'Institucional',
      title: 'Sobre o Explosão Solar',
      intro: 'Jornalismo que escolhe a profundidade em vez da pressa.',
      metaTitle: 'Sobre nós',
      metaDescription: 'Conheça o Explosão Solar: nossa missão editorial, valores e compromisso com o jornalismo explicativo de profundidade.',
    },
    en: {
      kicker: 'About',
      title: 'About Explosão Solar',
      intro: 'Journalism that chooses depth over speed.',
      metaTitle: 'About us',
      metaDescription: 'Meet Explosão Solar: our editorial mission, values and commitment to in-depth explanatory journalism.',
    },
    es: {
      kicker: 'Institucional',
      title: 'Sobre Explosão Solar',
      intro: 'Periodismo que elige la profundidad antes que la prisa.',
      metaTitle: 'Sobre nosotros',
      metaDescription: 'Conozca Explosão Solar: nuestra misión editorial, valores y compromiso con el periodismo explicativo en profundidad.',
    },
  },
  'politica-de-privacidade': {
    campo: 'privacyHtml',
    prose: 'prose prose-legal',
    href: '/politica-de-privacidade',
    pt: {
      kicker: 'Institucional',
      title: 'Política de Privacidade',
      intro: 'Transparência total sobre como tratamos seus dados, em conformidade com a LGPD.',
      metaTitle: 'Política de Privacidade',
      metaDescription: 'Saiba como o Explosão Solar coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.',
    },
    en: {
      kicker: 'Legal',
      title: 'Privacy Policy',
      intro: "Full transparency about how we handle your data, in compliance with Brazil's LGPD.",
      metaTitle: 'Privacy Policy',
      metaDescription: "Learn how Explosão Solar collects, uses and protects your personal data, in compliance with Brazil's LGPD.",
    },
    es: {
      kicker: 'Legal',
      title: 'Política de Privacidad',
      intro: 'Transparencia total sobre cómo tratamos sus datos, conforme a la LGPD de Brasil.',
      metaTitle: 'Política de Privacidad',
      metaDescription: 'Sepa cómo Explosão Solar recopila, usa y protege sus datos personales, conforme a la LGPD de Brasil.',
    },
  },
  'politica-de-cookies': {
    campo: 'cookiesHtml',
    prose: 'prose prose-legal',
    href: '/politica-de-cookies',
    pt: {
      kicker: 'Institucional',
      title: 'Política de Cookies',
      intro: 'O que são, como usamos e como você controla os cookies deste site.',
      metaTitle: 'Política de Cookies',
      metaDescription: 'Entenda quais cookies o Explosão Solar utiliza, para que servem e como gerenciá-los no seu navegador.',
    },
    en: {
      kicker: 'Legal',
      title: 'Cookie Policy',
      intro: 'What cookies are, how we use them and how you control them on this site.',
      metaTitle: 'Cookie Policy',
      metaDescription: 'Understand which cookies Explosão Solar uses, what they are for and how to manage them in your browser.',
    },
    es: {
      kicker: 'Legal',
      title: 'Política de Cookies',
      intro: 'Qué son, cómo los usamos y cómo usted controla las cookies de este sitio.',
      metaTitle: 'Política de Cookies',
      metaDescription: 'Entienda qué cookies utiliza Explosão Solar, para qué sirven y cómo gestionarlas en su navegador.',
    },
  },
  'termos-de-uso': {
    campo: 'termsHtml',
    prose: 'prose prose-legal',
    href: '/termos-de-uso',
    pt: {
      kicker: 'Institucional',
      title: 'Termos de Uso',
      intro: 'As regras que valem para todo mundo que navega no Explosão Solar.',
      metaTitle: 'Termos de Uso',
      metaDescription: 'Condições de uso do portal Explosão Solar: direitos autorais, responsabilidades e regras de utilização do conteúdo.',
    },
    en: {
      kicker: 'Legal',
      title: 'Terms of Use',
      intro: 'The rules that apply to everyone browsing Explosão Solar.',
      metaTitle: 'Terms of Use',
      metaDescription: 'Terms of use of the Explosão Solar portal: copyright, responsibilities and content usage rules.',
    },
    es: {
      kicker: 'Legal',
      title: 'Términos de Uso',
      intro: 'Las reglas que valen para todos los que navegan en Explosão Solar.',
      metaTitle: 'Términos de Uso',
      metaDescription: 'Condiciones de uso del portal Explosão Solar: derechos de autor, responsabilidades y reglas de uso del contenido.',
    },
  },
}

export function legalMeta(lang, doc) {
  const d = DOCS[doc][lang]
  return { title: d.metaTitle, description: d.metaDescription, alternates: alternates(lang, DOCS[doc].href) }
}

export default function LegalDocView({ lang = 'pt', doc }) {
  const cfg = DOCS[doc]
  const d = cfg[lang]
  const html = getInstitutional(lang)[cfg.campo]
  return (
    <PageShell kicker={d.kicker} title={d.title} intro={d.intro}>
      <div className={cfg.prose} dangerouslySetInnerHTML={{ __html: html }} />
    </PageShell>
  )
}
