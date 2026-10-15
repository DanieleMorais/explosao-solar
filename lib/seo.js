import { SITE, withLang } from './site'

const HREF_LANG = { pt: 'pt-BR', en: 'en', es: 'es' }

// Freio de 14/10/2026: EN/ES (tradução automática) saíram do Google; só o CLIMA segue trilíngue
// e indexado nos 3 idiomas (é o que trazia busca). Fora do clima, sem hreflang para páginas noindex.
const TRILINGUE = (p) => p === '/clima' || p.startsWith('/clima/')

export const ROBOTS_INDEX = { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } }
export const ROBOTS_NOINDEX = { index: false, follow: true, googleBot: { index: false, follow: true } }

export function alternates(lang, pathWithoutPrefix) {
  if (!TRILINGUE(pathWithoutPrefix)) return { canonical: `${SITE.url}${withLang(lang, pathWithoutPrefix)}` || SITE.url }
  const languages = {}
  for (const l of ['pt', 'en', 'es']) {
    languages[HREF_LANG[l]] = `${SITE.url}${withLang(l, pathWithoutPrefix)}` || SITE.url
  }
  languages['x-default'] = `${SITE.url}${pathWithoutPrefix}` || SITE.url
  return {
    canonical: `${SITE.url}${withLang(lang, pathWithoutPrefix)}` || SITE.url,
    languages,
  }
}

export const OG_LOCALE = { pt: 'pt_BR', en: 'en_US', es: 'es_ES' }
