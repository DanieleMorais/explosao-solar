// Gera o resumo diário do Explosão Solar (bom dia + clima + últimas notícias)
// formatado para WhatsApp. Uso: node scripts/digest.js [--dry]

const fs = require('fs')
const path = require('path')

const PT_DIR = path.join(__dirname, '..', 'content', 'articles')

const CIDADES_DIGEST = [
  { nome: 'São Paulo', lat: -23.55, lon: -46.63 },
  { nome: 'Rio de Janeiro', lat: -22.91, lon: -43.17 },
  { nome: 'Brasília', lat: -15.79, lon: -47.88 },
  { nome: 'Belo Horizonte', lat: -19.92, lon: -43.94 },
  { nome: 'Salvador', lat: -12.97, lon: -38.51 },
  { nome: 'Porto Alegre', lat: -30.03, lon: -51.23 },
]

const WMO = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌦️', 63: '🌧️', 65: '🌧️', 71: '🌨️', 73: '🌨️', 75: '❄️', 80: '🌦️', 81: '🌧️', 82: '⛈️', 95: '⛈️', 96: '⛈️', 99: '⛈️',
}

async function clima() {
  const lat = CIDADES_DIGEST.map((c) => c.lat).join(',')
  const lon = CIDADES_DIGEST.map((c) => c.lon).join(',')
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=1`,
      { signal: AbortSignal.timeout(15000) }
    )
    const arr = await r.json()
    return CIDADES_DIGEST.map((c, i) => {
      const d = Array.isArray(arr) ? arr[i] : arr
      if (!d?.current) return null
      return {
        nome: c.nome,
        emoji: WMO[d.current.weather_code] || '🌡️',
        temp: Math.round(d.current.temperature_2m),
        max: Math.round(d.daily.temperature_2m_max[0]),
        min: Math.round(d.daily.temperature_2m_min[0]),
        chuva: d.daily.precipitation_probability_max[0],
      }
    }).filter(Boolean)
  } catch {
    return []
  }
}

function ultimasNoticias(n = 5) {
  const arts = fs
    .readdirSync(PT_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(PT_DIR, f), 'utf8'))
      } catch {
        return null
      }
    })
    .filter((a) => a && a.title && a.slug)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, n)
  return arts
}

async function gerarDigest() {
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo' })
  const cap = hoje.charAt(0).toUpperCase() + hoje.slice(1)

  const [c, noticias] = [await clima(), ultimasNoticias(5)]

  let msg = `☀️ *EXPLOSÃO SOLAR* — Bom dia!\n_${cap}_\n\n`

  if (c.length) {
    msg += `🌤️ *O tempo hoje*\n`
    for (const x of c) {
      msg += `${x.emoji} ${x.nome}: ${x.temp}° (${x.min}°–${x.max}°)${x.chuva >= 50 ? ` · 💧${x.chuva}% chuva` : ''}\n`
    }
    msg += `\n_Veja seu bairro:_ explosaosolar.com/clima/brasil\n\n`
  }

  if (noticias.length) {
    msg += `📰 *As últimas notícias*\n`
    noticias.forEach((a, i) => {
      msg += `${i + 1}. ${a.title}\n   explosaosolar.com/noticia/${a.slug}\n`
    })
    msg += `\n`
  }

  msg += `Tenha um ótimo dia! 💛\n_explosaosolar.com — para sair, responda SAIR._`
  return msg
}

async function coletar() {
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo' })
  return {
    dataFmt: hoje.charAt(0).toUpperCase() + hoje.slice(1),
    clima: await clima(),
    noticias: ultimasNoticias(5),
  }
}

if (require.main === module) {
  gerarDigest().then((m) => {
    console.log('\n----- PRÉVIA DA MENSAGEM DIÁRIA -----\n')
    console.log(m)
    console.log('\n----- fim (' + m.length + ' caracteres) -----')
  })
}

module.exports = { gerarDigest, coletar }
