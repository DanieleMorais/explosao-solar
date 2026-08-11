import { SITE, withLang } from './site'

const HREF_LANG = { pt: 'pt-BR', en: 'en', es: 'es' }

export function alternates(lang, pathWithoutPrefix) {
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
