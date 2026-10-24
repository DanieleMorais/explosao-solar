// Os 12 idiomas do portal (regra da Dani, 15/10/2026): pt é o original; os 11 recebem tradução por CONJUNTO
// (as 11 línguas de uma matéria PT publicada saem juntas, no máximo 1 conjunto por dia — scripts/blog-idiomas.mjs).
// Módulo puro (sem fs, sem Next): vale no servidor, nos componentes de cliente, no worker e nos scripts.

export const IDIOMAS_TRADUCAO = ['en', 'es', 'fr', 'de', 'it', 'nl', 'ru', 'zh', 'ja', 'ko', 'ar']

// FREIO das traduções (o site saiu do Google em agosto por conteúdo em escala com tradução automática): 1 conjunto por
// dia (dia de Brasília), só matéria PT com 600+ palavras (= MIN_PALAVRAS de scripts/freio.js) e no máximo 7 conjuntos
// esperando em rascunho (com a fila cheia a esteira não recebe matéria nova). Sem backfill em massa.
export const FREIO_TRADUCAO = { porDia: 1, minPalavras: 600, filaMax: 7 }

// en/es já têm o site inteiro (home, editorias, clima, busca...). Os 9 novos têm só a lista e as matérias traduzidas.
export const IDIOMAS_NOVOS = ['fr', 'de', 'it', 'nl', 'ru', 'zh', 'ja', 'ko', 'ar']

export const HREFLANG = { pt: 'pt-BR', en: 'en', es: 'es', fr: 'fr', de: 'de', it: 'it', nl: 'nl', ru: 'ru', zh: 'zh', ja: 'ja', ko: 'ko', ar: 'ar' }

// inLanguage do schema.org (o chinês do site é o simplificado)
export const LANG_SCHEMA = { ...HREFLANG, zh: 'zh-CN' }

// país/variante para formatar datas (toLocaleDateString)
export const LOCALE_DATA = { pt: 'pt-BR', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', it: 'it-IT', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR', ar: 'ar' }

export const OG_LOCALE_IDIOMA = { pt: 'pt_BR', en: 'en_US', es: 'es_ES', fr: 'fr_FR', de: 'de_DE', it: 'it_IT', nl: 'nl_NL', ru: 'ru_RU', zh: 'zh_CN', ja: 'ja_JP', ko: 'ko_KR', ar: 'ar_AR' }

// nome de cada idioma escrito NELE (é o que o leitor procura no seletor)
export const NOME_IDIOMA = { pt: 'Português', en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch', it: 'Italiano', nl: 'Nederlands', ru: 'Русский', zh: '中文', ja: '日本語', ko: '한국어', ar: 'العربية' }

export const SIGLA_IDIOMA = { pt: 'PT', en: 'EN', es: 'ES', fr: 'FR', de: 'DE', it: 'IT', nl: 'NL', ru: 'RU', zh: 'ZH', ja: 'JA', ko: 'KO', ar: 'AR' }

export const ehIdiomaNovo = (lang) => IDIOMAS_NOVOS.includes(lang)

// só o árabe é da direita para a esquerda
export const direcao = (lang) => (lang === 'ar' ? 'rtl' : 'ltr')

// Idioma de qualquer rota, nos 12 (o langFromPath de lib/site.js continua só pt/en/es, que é o que o resto do site
// sabe desenhar). A barra depois do prefixo evita pegar /entretenimento, /esportes e parecidos.
const IDIOMA_DA_ROTA = /^\/(en|es|fr|de|it|nl|ru|zh|ja|ko|ar)(\/|$)/
export const idiomaDaRota = (pathname) => String(pathname || '').match(IDIOMA_DA_ROTA)?.[1] || 'pt'

// lista de matérias de um idioma (/en/noticia, /ru/noticia...)
export const caminhoLista = (lang) => `/${lang}/noticia`

// Páginas fixas (política de cookies, sobre, contato...) só existem em pt/en/es: nos 9 idiomas novos a referência
// é a versão em inglês, nunca um 404.
export const rotaInstitucional = (lang, href) => (IDIOMAS_NOVOS.includes(lang) ? `/en${href}` : lang === 'pt' ? href : `/${lang}${href}`)
