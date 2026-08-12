// Dados de clima ao vivo: previsão das grandes cidades (Open-Meteo, sem chave) +
// previsão de tempestade geomagnética (NOAA). Sem dependências.

export const CIDADES = [
  { nome: { pt: 'São Paulo', en: 'São Paulo', es: 'São Paulo' }, pais: { pt: 'Brasil', en: 'Brazil', es: 'Brasil' }, lat: -23.55, lon: -46.63 },
  { nome: { pt: 'Rio de Janeiro', en: 'Rio de Janeiro', es: 'Río de Janeiro' }, pais: { pt: 'Brasil', en: 'Brazil', es: 'Brasil' }, lat: -22.91, lon: -43.17 },
  { nome: { pt: 'Brasília', en: 'Brasília', es: 'Brasilia' }, pais: { pt: 'Brasil', en: 'Brazil', es: 'Brasil' }, lat: -15.79, lon: -47.88 },
  { nome: { pt: 'Lisboa', en: 'Lisbon', es: 'Lisboa' }, pais: { pt: 'Portugal', en: 'Portugal', es: 'Portugal' }, lat: 38.72, lon: -9.14 },
  { nome: { pt: 'Nova York', en: 'New York', es: 'Nueva York' }, pais: { pt: 'EUA', en: 'USA', es: 'EE.UU.' }, lat: 40.71, lon: -74.01 },
  { nome: { pt: 'Londres', en: 'London', es: 'Londres' }, pais: { pt: 'Reino Unido', en: 'UK', es: 'Reino Unido' }, lat: 51.51, lon: -0.13 },
  { nome: { pt: 'Bogotá', en: 'Bogotá', es: 'Bogotá' }, pais: { pt: 'Colômbia', en: 'Colombia', es: 'Colombia' }, lat: 4.71, lon: -74.07 },
  { nome: { pt: 'Cidade do México', en: 'Mexico City', es: 'Ciudad de México' }, pais: { pt: 'México', en: 'Mexico', es: 'México' }, lat: 19.43, lon: -99.13 },
  { nome: { pt: 'Buenos Aires', en: 'Buenos Aires', es: 'Buenos Aires' }, pais: { pt: 'Argentina', en: 'Argentina', es: 'Argentina' }, lat: -34.61, lon: -58.38 },
  { nome: { pt: 'Tóquio', en: 'Tokyo', es: 'Tokio' }, pais: { pt: 'Japão', en: 'Japan', es: 'Japón' }, lat: 35.68, lon: 139.69 },
]

// Código WMO -> { emoji, texto pt/en/es }
const WMO = {
  0: { e: '☀️', pt: 'Céu limpo', en: 'Clear sky', es: 'Cielo despejado' },
  1: { e: '🌤️', pt: 'Predomínio de sol', en: 'Mainly clear', es: 'Mayormente despejado' },
  2: { e: '⛅', pt: 'Parcialmente nublado', en: 'Partly cloudy', es: 'Parcialmente nublado' },
  3: { e: '☁️', pt: 'Nublado', en: 'Overcast', es: 'Nublado' },
  45: { e: '🌫️', pt: 'Névoa', en: 'Fog', es: 'Niebla' },
  48: { e: '🌫️', pt: 'Névoa com geada', en: 'Rime fog', es: 'Niebla con escarcha' },
  51: { e: '🌦️', pt: 'Garoa fraca', en: 'Light drizzle', es: 'Llovizna ligera' },
  53: { e: '🌦️', pt: 'Garoa', en: 'Drizzle', es: 'Llovizna' },
  55: { e: '🌧️', pt: 'Garoa forte', en: 'Dense drizzle', es: 'Llovizna intensa' },
  61: { e: '🌦️', pt: 'Chuva fraca', en: 'Light rain', es: 'Lluvia ligera' },
  63: { e: '🌧️', pt: 'Chuva', en: 'Rain', es: 'Lluvia' },
  65: { e: '🌧️', pt: 'Chuva forte', en: 'Heavy rain', es: 'Lluvia intensa' },
  71: { e: '🌨️', pt: 'Neve fraca', en: 'Light snow', es: 'Nieve ligera' },
  73: { e: '🌨️', pt: 'Neve', en: 'Snow', es: 'Nieve' },
  75: { e: '❄️', pt: 'Neve forte', en: 'Heavy snow', es: 'Nieve intensa' },
  80: { e: '🌦️', pt: 'Pancadas de chuva', en: 'Rain showers', es: 'Chubascos' },
  81: { e: '🌧️', pt: 'Pancadas fortes', en: 'Heavy showers', es: 'Chubascos fuertes' },
  82: { e: '⛈️', pt: 'Temporais', en: 'Violent showers', es: 'Chubascos violentos' },
  95: { e: '⛈️', pt: 'Tempestade', en: 'Thunderstorm', es: 'Tormenta' },
  96: { e: '⛈️', pt: 'Tempestade com granizo', en: 'Thunderstorm, hail', es: 'Tormenta con granizo' },
  99: { e: '⛈️', pt: 'Tempestade forte', en: 'Severe thunderstorm', es: 'Tormenta severa' },
}

export function wmo(code, lang) {
  const w = WMO[code] || WMO[3]
  return { emoji: w.e, texto: w[lang] || w.pt }
}

async function jsonComTimeout(url, ms = 12000) {
  const r = await fetch(url, { signal: AbortSignal.timeout(ms), next: { revalidate: 1800 } })
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}

export async function previsaoCidades() {
  const lat = CIDADES.map((c) => c.lat).join(',')
  const lon = CIDADES.map((c) => c.lon).join(',')
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto&forecast_days=4`
  let dados
  try {
    dados = await jsonComTimeout(url)
  } catch {
    return CIDADES.map((c) => ({ cidade: c, erro: true }))
  }
  const arr = Array.isArray(dados) ? dados : [dados]
  return CIDADES.map((c, i) => {
    const d = arr[i]
    if (!d?.current) return { cidade: c, erro: true }
    return {
      cidade: c,
      agora: {
        temp: Math.round(d.current.temperature_2m),
        code: d.current.weather_code,
        umidade: d.current.relative_humidity_2m,
        vento: Math.round(d.current.wind_speed_10m),
      },
      dias: d.daily.time.map((t, j) => ({
        data: t,
        max: Math.round(d.daily.temperature_2m_max[j]),
        min: Math.round(d.daily.temperature_2m_min[j]),
        code: d.daily.weather_code[j],
        chuva: d.daily.precipitation_probability_max[j],
      })),
    }
  })
}

// Previsão de um ponto qualquer (lat/lon). Reusada por estados, cidades e busca.
export async function previsaoPonto(lat, lon) {
  try {
    const d = await jsonComTimeout(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto&forecast_days=5`
    )
    if (!d?.current) return null
    return {
      agora: {
        temp: Math.round(d.current.temperature_2m),
        sensacao: Math.round(d.current.apparent_temperature),
        code: d.current.weather_code,
        umidade: d.current.relative_humidity_2m,
        vento: Math.round(d.current.wind_speed_10m),
      },
      dias: d.daily.time.map((tt, j) => ({
        data: tt,
        max: Math.round(d.daily.temperature_2m_max[j]),
        min: Math.round(d.daily.temperature_2m_min[j]),
        code: d.daily.weather_code[j],
        chuva: d.daily.precipitation_probability_max[j],
      })),
    }
  } catch {
    return null
  }
}

// Previsão de vários pontos numa só chamada (para grades de estados/cidades).
export async function previsaoPontos(pontos) {
  const lat = pontos.map((p) => p.lat).join(',')
  const lon = pontos.map((p) => p.lon).join(',')
  try {
    const dados = await jsonComTimeout(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto&forecast_days=4`
    )
    const arr = Array.isArray(dados) ? dados : [dados]
    return pontos.map((p, i) => {
      const d = arr[i]
      if (!d?.current) return { ...p, erro: true }
      return {
        ...p,
        agora: { temp: Math.round(d.current.temperature_2m), code: d.current.weather_code },
        dias: d.daily.time.map((tt, j) => ({
          data: tt,
          max: Math.round(d.daily.temperature_2m_max[j]),
          min: Math.round(d.daily.temperature_2m_min[j]),
          code: d.daily.weather_code[j],
          chuva: d.daily.precipitation_probability_max[j],
        })),
      }
    })
  } catch {
    return pontos.map((p) => ({ ...p, erro: true }))
  }
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

// Clima típico ao longo do ano (médias históricas). Cacheado por 30 dias — clima
// não muda. Alimenta o texto único de SEO de cada cidade.
export async function climaAnual(lat, lon) {
  try {
    const j = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=2022-01-01&end_date=2024-12-31&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`,
      { signal: AbortSignal.timeout(20000), next: { revalidate: 2592000 } }
    ).then((r) => r.json())
    const t = j?.daily?.time
    if (!t?.length) return null

    const mes = Array.from({ length: 12 }, () => ({ max: 0, min: 0, chuva: 0, n: 0 }))
    for (let i = 0; i < t.length; i++) {
      const m = Number(t[i].slice(5, 7)) - 1
      const mx = j.daily.temperature_2m_max[i]
      const mn = j.daily.temperature_2m_min[i]
      const ch = j.daily.precipitation_sum[i]
      if (mx == null || mn == null) continue
      mes[m].max += mx
      mes[m].min += mn
      mes[m].chuva += ch || 0
      mes[m].n++
    }
    const medias = mes.map((x) => ({ max: x.n ? x.max / x.n : null, min: x.n ? x.min / x.n : null, chuva: x.chuva / 3 }))
    const validos = medias.filter((m) => m.max != null)
    if (!validos.length) return null

    const maisQuente = medias.reduce((a, b, i) => (b.max != null && (a.i < 0 || b.max > medias[a.i].max) ? { i } : a), { i: -1 }).i
    const maisFrio = medias.reduce((a, b, i) => (b.min != null && (a.i < 0 || b.min < medias[a.i].min) ? { i } : a), { i: -1 }).i
    const maisChuvoso = medias.reduce((a, b, i) => (b.max != null && (a.i < 0 || b.chuva > medias[a.i].chuva) ? { i } : a), { i: -1 }).i
    const maisSeco = medias.reduce((a, b, i) => (b.max != null && (a.i < 0 || b.chuva < medias[a.i].chuva) ? { i } : a), { i: -1 }).i

    const est = (meses) => {
      const ms = meses.map((m) => medias[m]).filter((m) => m.max != null)
      if (!ms.length) return null
      return { max: Math.round(ms.reduce((s, m) => s + m.max, 0) / ms.length), min: Math.round(ms.reduce((s, m) => s + m.min, 0) / ms.length) }
    }

    return {
      verao: est([11, 0, 1]),
      outono: est([2, 3, 4]),
      inverno: est([5, 6, 7]),
      primavera: est([8, 9, 10]),
      mesMaisQuente: { nome: MESES[maisQuente], temp: Math.round(medias[maisQuente].max) },
      mesMaisFrio: { nome: MESES[maisFrio], temp: Math.round(medias[maisFrio].min) },
      mesMaisChuvoso: MESES[maisChuvoso],
      mesMaisSeco: MESES[maisSeco],
      chuvaAnual: Math.round(medias.reduce((s, m) => s + m.chuva, 0)),
    }
  } catch {
    return null
  }
}

const KP_G = (kp) => (kp >= 8.67 ? 'G5' : kp >= 7.67 ? 'G4' : kp >= 6.67 ? 'G3' : kp >= 5.67 ? 'G2' : kp >= 4.67 ? 'G1' : null)

export async function climaEspacial() {
  try {
    const linhas = await jsonComTimeout('https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json')
    const previstos = linhas.filter((o) => o && o.observed === 'predicted')
    let picoKp = 0
    let quando = null
    for (const o of previstos) {
      const kp = Number(o.kp)
      if (kp > picoKp) {
        picoKp = kp
        quando = o.time_tag
      }
    }
    return { kp: Math.round(picoKp * 10) / 10, escala: KP_G(picoKp), quando, tempestade: picoKp >= 5.67 }
  } catch {
    return null
  }
}
