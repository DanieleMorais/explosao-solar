// Slug da matéria traduzida NO IDIOMA dela (a URL leva o título traduzido, não o slug em português) — regra da Dani,
// 15/10/2026, mesma função do Cristal Leads (cristal-leads/src/lib/blogSlug.js). ESM puro, sem import de Next: o
// scripts/blog-idiomas.mjs e o worker importam este mesmo arquivo para calcular igual.

const SEM_ACENTO = /[̀-ͯ]/g
const NAO_LATINO = new Set(['ru', 'ar', 'zh', 'ja', 'ko'])
// ru e ar cortam no último hífen (palavra inteira); zh, ja e ko quase não têm separador, cortam no limite.
const LIMITE = { ru: 60, ar: 60, zh: 40, ja: 40, ko: 40 }
const CORTA_NO_HIFEN = new Set(['ru', 'ar'])
const LIMITE_LATINO = 90

export const SLUG_IDIOMA_OK = /^[\p{L}\p{M}\p{N}-]{1,200}$/u

const aparar = (s) => s.replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '')

// Máximo em pontos de código; `noHifen` corta no último '-' antes do limite, sem partir palavra.
function cortar(s, max, noHifen) {
  const pontos = [...s]
  if (pontos.length <= max) return s
  const corte = pontos.slice(0, max).join('')
  if (!noHifen || pontos[max] === '-') return aparar(corte)
  const i = corte.lastIndexOf('-')
  return aparar(i > 0 ? corte.slice(0, i) : corte)
}

export function slugNoIdioma(titulo, idioma, slugPt) {
  const base = String(titulo ?? '')
  let s
  let max
  let noHifen
  if (NAO_LATINO.has(idioma)) {
    s = base.normalize('NFC').toLocaleLowerCase(idioma).replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    max = LIMITE[idioma]
    noHifen = CORTA_NO_HIFEN.has(idioma)
  } else {
    s = base
      .toLowerCase()
      .normalize('NFD').replace(SEM_ACENTO, '')
      .replace(/ß/g, 'ss').replace(/æ/g, 'ae').replace(/œ/g, 'oe').replace(/ø/g, 'o').replace(/đ/g, 'd').replace(/ł/g, 'l')
      .replace(/[^a-z0-9]+/g, '-')
    max = LIMITE_LATINO
    noHifen = true
  }
  const final = cortar(aparar(s), max, noHifen).normalize('NFC')
  return final && final.replace(/-/g, '') ? final : slugPt
}

// Caminho percent-encoded: para hreflang, sitemap, IndexNow, canonical e redirecionamento. pt = a matéria original.
export function caminhoArtigo(idioma, slug) {
  return idioma === 'pt' ? `/noticia/${slug}` : `/${idioma}/noticia/${encodeURI(slug)}`
}

// O Next pode entregar o parâmetro ainda codificado (%D0%BA...). Slug válido nunca tem '%', então decodificar é seguro.
export function slugDoParametro(valor) {
  let s = String(valor ?? '')
  if (s.includes('%')) {
    try {
      s = decodeURIComponent(s)
    } catch {
      return ''
    }
  }
  return s.normalize('NFC')
}
