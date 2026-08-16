// Estados do Brasil (com capitais e coordenadas) + acesso às cidades via IBGE.
// Bairros e cidades fora da lista são resolvidos por geocodificação sob demanda.

export const ESTADOS = [
  { uf: 'AC', nome: 'Acre', capital: 'Rio Branco', lat: -9.97, lon: -67.81, regiao: 'Norte' },
  { uf: 'AL', nome: 'Alagoas', capital: 'Maceió', lat: -9.67, lon: -35.74, regiao: 'Nordeste' },
  { uf: 'AP', nome: 'Amapá', capital: 'Macapá', lat: 0.03, lon: -51.07, regiao: 'Norte' },
  { uf: 'AM', nome: 'Amazonas', capital: 'Manaus', lat: -3.12, lon: -60.02, regiao: 'Norte' },
  { uf: 'BA', nome: 'Bahia', capital: 'Salvador', lat: -12.97, lon: -38.51, regiao: 'Nordeste' },
  { uf: 'CE', nome: 'Ceará', capital: 'Fortaleza', lat: -3.72, lon: -38.54, regiao: 'Nordeste' },
  { uf: 'DF', nome: 'Distrito Federal', capital: 'Brasília', lat: -15.79, lon: -47.88, regiao: 'Centro-Oeste' },
  { uf: 'ES', nome: 'Espírito Santo', capital: 'Vitória', lat: -20.32, lon: -40.34, regiao: 'Sudeste' },
  { uf: 'GO', nome: 'Goiás', capital: 'Goiânia', lat: -16.69, lon: -49.26, regiao: 'Centro-Oeste' },
  { uf: 'MA', nome: 'Maranhão', capital: 'São Luís', lat: -2.53, lon: -44.3, regiao: 'Nordeste' },
  { uf: 'MT', nome: 'Mato Grosso', capital: 'Cuiabá', lat: -15.6, lon: -56.1, regiao: 'Centro-Oeste' },
  { uf: 'MS', nome: 'Mato Grosso do Sul', capital: 'Campo Grande', lat: -20.44, lon: -54.65, regiao: 'Centro-Oeste' },
  { uf: 'MG', nome: 'Minas Gerais', capital: 'Belo Horizonte', lat: -19.92, lon: -43.94, regiao: 'Sudeste' },
  { uf: 'PA', nome: 'Pará', capital: 'Belém', lat: -1.46, lon: -48.5, regiao: 'Norte' },
  { uf: 'PB', nome: 'Paraíba', capital: 'João Pessoa', lat: -7.12, lon: -34.86, regiao: 'Nordeste' },
  { uf: 'PR', nome: 'Paraná', capital: 'Curitiba', lat: -25.43, lon: -49.27, regiao: 'Sul' },
  { uf: 'PE', nome: 'Pernambuco', capital: 'Recife', lat: -8.05, lon: -34.9, regiao: 'Nordeste' },
  { uf: 'PI', nome: 'Piauí', capital: 'Teresina', lat: -5.09, lon: -42.8, regiao: 'Nordeste' },
  { uf: 'RJ', nome: 'Rio de Janeiro', capital: 'Rio de Janeiro', lat: -22.91, lon: -43.17, regiao: 'Sudeste' },
  { uf: 'RN', nome: 'Rio Grande do Norte', capital: 'Natal', lat: -5.79, lon: -35.21, regiao: 'Nordeste' },
  { uf: 'RS', nome: 'Rio Grande do Sul', capital: 'Porto Alegre', lat: -30.03, lon: -51.23, regiao: 'Sul' },
  { uf: 'RO', nome: 'Rondônia', capital: 'Porto Velho', lat: -8.76, lon: -63.9, regiao: 'Norte' },
  { uf: 'RR', nome: 'Roraima', capital: 'Boa Vista', lat: 2.82, lon: -60.67, regiao: 'Norte' },
  { uf: 'SC', nome: 'Santa Catarina', capital: 'Florianópolis', lat: -27.59, lon: -48.55, regiao: 'Sul' },
  { uf: 'SP', nome: 'São Paulo', capital: 'São Paulo', lat: -23.55, lon: -46.63, regiao: 'Sudeste' },
  { uf: 'SE', nome: 'Sergipe', capital: 'Aracaju', lat: -10.91, lon: -37.07, regiao: 'Nordeste' },
  { uf: 'TO', nome: 'Tocantins', capital: 'Palmas', lat: -10.18, lon: -48.33, regiao: 'Norte' },
]

export function estado(uf) {
  return ESTADOS.find((e) => e.uf.toLowerCase() === String(uf).toLowerCase()) || null
}

const UA = { 'User-Agent': 'ExplosaoSolarBot/1.0 (+https://explosaosolar.com)' }

export function slugCidade(nome) {
  return String(nome)
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

// Lista de municípios de um estado (IBGE). Cacheada 24h.
export async function municipios(uf) {
  try {
    const r = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`, {
      headers: UA,
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(15000),
    })
    if (!r.ok) return []
    const j = await r.json()
    return j.map((m) => ({ nome: m.nome, slug: slugCidade(m.nome) }))
  } catch {
    return []
  }
}

// Geocodifica cidade ou bairro. Nominatim (bairros) com fallback Open-Meteo (cidades).
const semAcento = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// só aceita lugares (cidade, bairro, distrito) — nunca empresa/rua/POI
const CLASSES_OK = new Set(['place', 'boundary', 'landuse'])

async function nominatim(termo) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(termo)}&format=json&limit=3&addressdetails=1&countrycodes=br&accept-language=pt-BR`,
      { headers: UA, next: { revalidate: 86400 }, signal: AbortSignal.timeout(15000) }
    )
    if (!r.ok) return null
    const arr = await r.json()
    const item = (arr || []).find((x) => CLASSES_OK.has(x.class))
    if (!item) return null
    const a = item.address || {}
    const rotulo = [a.suburb || a.neighbourhood || a.city_district, a.city || a.town || a.municipality, a.state].filter(Boolean).join(', ')
    return {
      lat: Number(item.lat),
      lon: Number(item.lon),
      rotulo: rotulo || item.display_name.split(',').slice(0, 3).join(', '),
      display: item.display_name || '',
    }
  } catch {
    return null
  }
}

export async function geocodificar(q, uf = '') {
  const alvo = semAcento(q).split(/[\s,]+/)[0] // 1ª palavra da busca
  // o nome do lugar (1º pedaço do rótulo) deve COMEÇAR com a busca — evita casar
  // "itajai" com "Parque Itajai" (bairro que só contém a palavra)
  const combina = (res) => res && semAcento(res.rotulo.split(',')[0]).split(/\s+/)[0] === alvo

  // 1) com o estado (bom p/ bairro dentro do estado) — só aceita se o resultado bate com a busca
  if (uf) {
    const comUf = await nominatim(`${q}, ${uf}, Brasil`)
    if (combina(comUf)) return comUf
  }
  // 2) busca nacional (cidade de outro estado, etc.)
  const nac = await nominatim(`${q}, Brasil`)
  if (nac) return nac

  // 3) fallback Open-Meteo por nome
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&country=BR&language=pt`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(12000),
    })
    if (r.ok) {
      const j = await r.json()
      const res = (j.results || [])[0]
      if (res) return { lat: res.latitude, lon: res.longitude, rotulo: [res.name, res.admin1].filter(Boolean).join(', ') }
    }
  } catch {}
  return null
}
