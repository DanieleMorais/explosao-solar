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
