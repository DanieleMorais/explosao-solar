export const SITE = {
  name: 'Explosão Solar',
  url: 'https://explosaosolar.com',
  tagline: 'Profundidade antes da pressa',
  description:
    'Jornalismo explicativo com profundidade: cobertura de Brasil, Mundo, Política, Economia, Tecnologia e Ciência. Entenda o contexto por trás de cada manchete.',
  email: 'contato@explosaosolar.com',
}

export const SITE_DESCRIPTIONS = {
  pt: SITE.description,
  en: 'In-depth explanatory journalism covering Brazil, World, Politics, Economy, Technology and Science. Understand the context behind every headline.',
  es: 'Periodismo explicativo en profundidad: Brasil, Mundo, Política, Economía, Tecnología y Ciencia. Entiende el contexto detrás de cada titular.',
}

export const SITE_TITLES = {
  pt: 'Explosão Solar — Jornalismo Explicativo do Brasil e do Mundo',
  en: 'Explosão Solar — In-Depth News from Brazil and the World',
  es: 'Explosão Solar — Periodismo Explicativo de Brasil y el Mundo',
}

export const CATEGORIES = [
  { name: 'Mundo', slug: 'mundo', description: 'Geopolítica e relações internacionais analisadas em profundidade. O que acontece além das fronteiras — com contexto, causas e consequências.' },
  { name: 'Brasil', slug: 'brasil', description: 'Sociedade, economia e política: cobertura em profundidade dos temas que moldam o Brasil real, além do que as manchetes contam.' },
  { name: 'Política', slug: 'politica', description: 'Eleições, Congresso e os mecanismos do poder explicados com clareza e sem partidarismo. Jornalismo político com rigor e profundidade.' },
  { name: 'Economia', slug: 'economia', description: 'Juros, inflação, investimentos e mercado de trabalho explicados sem jargão. A economia brasileira e global que afeta a sua vida.' },
  { name: 'Tecnologia', slug: 'tecnologia', description: 'Inteligência artificial, privacidade digital e inovação analisadas em profundidade. Como as novas tecnologias estão redesenhando o trabalho e a sociedade.' },
  { name: 'Ciência', slug: 'ciencia', description: 'Astronomia, clima, saúde e descobertas científicas explicadas com rigor e clareza. A ciência que importa para entender o presente e o futuro.' },
  { name: 'Esportes', slug: 'esportes', description: 'Análise tática, bastidores e a ciência por trás do esporte. Cobertura que vai além do resultado e explica o que move o esporte brasileiro e mundial.' },
  { name: 'Cultura', slug: 'cultura', description: 'Música, cinema, literatura e streaming com olhar crítico. A cultura brasileira e global que molda comportamentos, mercados e identidades.' },
]

export const INSTITUTIONAL_LINKS = {
  pt: [
    { name: 'Sobre nós', href: '/sobre' },
    { name: 'Perguntas frequentes', href: '/faq' },
    { name: 'Fale conosco', href: '/contato' },
    { name: 'Política de Privacidade', href: '/politica-de-privacidade' },
    { name: 'Política de Cookies', href: '/politica-de-cookies' },
    { name: 'Termos de Uso', href: '/termos-de-uso' },
  ],
  en: [
    { name: 'About us', href: '/sobre' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact', href: '/contato' },
    { name: 'Privacy Policy', href: '/politica-de-privacidade' },
    { name: 'Cookie Policy', href: '/politica-de-cookies' },
    { name: 'Terms of Use', href: '/termos-de-uso' },
  ],
  es: [
    { name: 'Sobre nosotros', href: '/sobre' },
    { name: 'Preguntas frecuentes', href: '/faq' },
    { name: 'Contacto', href: '/contato' },
    { name: 'Política de Privacidad', href: '/politica-de-privacidade' },
    { name: 'Política de Cookies', href: '/politica-de-cookies' },
    { name: 'Términos de Uso', href: '/termos-de-uso' },
  ],
}

export function langFromPath(pathname) {
  if (pathname === '/en' || pathname.startsWith('/en/')) return 'en'
  if (pathname === '/es' || pathname.startsWith('/es/')) return 'es'
  return 'pt'
}

export function withLang(lang, href) {
  const prefix = lang === 'pt' ? '' : `/${lang}`
  return `${prefix}${href}` || '/'
}
