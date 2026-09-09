// Combinação de signos — fórmula determinística e helpers de slug/rótulo.
// Client-safe: só dados e aritmética. O conteúdo em texto vive em content/combinacoes/<par>.json.
import { SIGNOS } from './signos.js'

export const ORDEM = SIGNOS.map((s) => s.slug)

export const MODALIDADE = {
  aries: 'cardinal', cancer: 'cardinal', libra: 'cardinal', capricornio: 'cardinal',
  touro: 'fixo', leao: 'fixo', escorpiao: 'fixo', aquario: 'fixo',
  gemeos: 'mutavel', virgem: 'mutavel', sagitario: 'mutavel', peixes: 'mutavel',
}

export const OPOSTOS = {
  aries: 'libra', libra: 'aries',
  touro: 'escorpiao', escorpiao: 'touro',
  gemeos: 'sagitario', sagitario: 'gemeos',
  cancer: 'capricornio', capricornio: 'cancer',
  leao: 'aquario', aquario: 'leao',
  virgem: 'peixes', peixes: 'virgem',
}

export const NOMES = {
  pt: Object.fromEntries(SIGNOS.map((s) => [s.slug, s.nome])),
  en: { aries: 'Aries', touro: 'Taurus', gemeos: 'Gemini', cancer: 'Cancer', leao: 'Leo', virgem: 'Virgo', libra: 'Libra', escorpiao: 'Scorpio', sagitario: 'Sagittarius', capricornio: 'Capricorn', aquario: 'Aquarius', peixes: 'Pisces' },
  es: { aries: 'Aries', touro: 'Tauro', gemeos: 'Géminis', cancer: 'Cáncer', leao: 'Leo', virgem: 'Virgo', libra: 'Libra', escorpiao: 'Escorpio', sagitario: 'Sagitario', capricornio: 'Capricornio', aquario: 'Acuario', peixes: 'Piscis' },
}

const CONECTIVO = { pt: 'e', en: 'and', es: 'y' }

const idx = (slug) => ORDEM.indexOf(slug)
const signo = (slug) => SIGNOS[idx(slug)]

function ordenar(a, b) {
  return idx(a) <= idx(b) ? [a, b] : [b, a]
}

export function slugPar(a, b) {
  if (idx(a) === -1 || idx(b) === -1) return null
  const [x, y] = ordenar(a, b)
  return `${x}-e-${y}`
}

// Só aceita a forma canônica (ordem zodiacal) — fora dela devolve null pra página redirecionar.
export function parDoSlug(slug) {
  const m = /^([a-z]+)-e-([a-z]+)$/.exec(String(slug || ''))
  if (!m) return null
  const [, a, b] = m
  if (idx(a) === -1 || idx(b) === -1 || idx(a) > idx(b)) return null
  return { a, b }
}

// Devolve {a,b} de qualquer combinação válida, mesmo fora de ordem — pra saber pra onde redirecionar.
export function parQualquerOrdem(slug) {
  const m = /^([a-z]+)-e-([a-z]+)$/.exec(String(slug || ''))
  if (!m || idx(m[1]) === -1 || idx(m[2]) === -1) return null
  const [a, b] = ordenar(m[1], m[2])
  return { a, b }
}

export function saoOpostos(a, b) {
  return OPOSTOS[a] === b
}

export function estaoNaListaCombina(a, b) {
  return signo(a).combina.includes(b) || signo(b).combina.includes(a)
}

const clamp = (n) => Math.max(40, Math.min(98, Math.round(n)))

const BASE_ELEMENTOS = {
  Fogo: { Ar: 82, Terra: 62, Água: 54 },
  Terra: { Água: 82, Fogo: 62, Ar: 54 },
  Ar: { Fogo: 82, Água: 62, Terra: 54 },
  Água: { Terra: 82, Ar: 62, Fogo: 54 },
}

export function pontuar(a, b) {
  const [x, y] = ordenar(a, b)
  const sx = signo(x)
  const sy = signo(y)
  const mesmoSigno = x === y
  const mesmoElemento = sx.elemento === sy.elemento
  const mesmaModalidade = MODALIDADE[x] === MODALIDADE[y]
  const opostos = saoOpostos(x, y)
  const elementos = [sx.elemento, sy.elemento]
  const envolve = (el) => elementos.includes(el)

  let base
  if (mesmoSigno) base = 76
  else if (mesmoElemento) base = 86
  else base = BASE_ELEMENTOS[sx.elemento][sy.elemento]

  if (opostos) base += 6
  if (mesmaModalidade && !mesmoSigno) base -= 4
  if (estaoNaListaCombina(x, y)) base += 8

  const amor = clamp(base + (opostos ? 4 : 0))
  const amizade = clamp(base + (mesmoElemento ? 4 : mesmaModalidade ? -2 : 2))
  const trabalho = clamp(base + (envolve('Terra') ? 6 : sx.elemento === 'Fogo' && sy.elemento === 'Fogo' ? -5 : 0) + (mesmaModalidade ? 0 : 3))
  const intimidade = clamp(base + (envolve('Fogo') || envolve('Água') ? 5 : -2) + (opostos ? 5 : 0))
  const geral = clamp((amor + amizade + trabalho + intimidade) / 4)

  return { geral, amor, amizade, trabalho, intimidade }
}

export function todosOsPares() {
  const pares = []
  for (let i = 0; i < ORDEM.length; i++) {
    for (let j = i; j < ORDEM.length; j++) pares.push(`${ORDEM[i]}-e-${ORDEM[j]}`)
  }
  return pares
}

export function nomeSigno(slug, lang = 'pt') {
  return (NOMES[lang] || NOMES.pt)[slug]
}

export function rotulo(a, b, lang = 'pt') {
  const [x, y] = ordenar(a, b)
  return `${nomeSigno(x, lang)} ${CONECTIVO[lang] || CONECTIVO.pt} ${nomeSigno(y, lang)}`
}
