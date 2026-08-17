// Terremotos ao vivo — dados do USGS (United States Geological Survey), públicos e
// em tempo real, sem chave. Feeds GeoJSON atualizados a cada minuto pela rede sísmica.

const USGS = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary'
const UA = 'Mozilla/5.0 (compatible; ExplosaoSolarBot/1.0; +https://explosaosolar.com)'

const PAISES = {
  Indonesia: 'Indonésia', Colombia: 'Colômbia', Spain: 'Espanha', Russia: 'Rússia',
  Japan: 'Japão', Chile: 'Chile', Mexico: 'México', Peru: 'Peru', Turkey: 'Turquia',
  Greece: 'Grécia', Italy: 'Itália', Philippines: 'Filipinas', 'Papua New Guinea': 'Papua-Nova Guiné',
  'New Zealand': 'Nova Zelândia', Iran: 'Irã', Afghanistan: 'Afeganistão', Pakistan: 'Paquistão',
  India: 'Índia', China: 'China', 'United States': 'Estados Unidos', Alaska: 'Alasca',
  California: 'Califórnia', CA: 'Califórnia', Argentina: 'Argentina', Ecuador: 'Equador',
  Bolivia: 'Bolívia', Panama: 'Panamá', Nicaragua: 'Nicarágua', Guatemala: 'Guatemala',
  'El Salvador': 'El Salvador', 'Costa Rica': 'Costa Rica', Vanuatu: 'Vanuatu', Fiji: 'Fiji',
  Tonga: 'Tonga', Taiwan: 'Taiwan', Portugal: 'Portugal', Morocco: 'Marrocos', Nepal: 'Nepal',
  Myanmar: 'Mianmar', Venezuela: 'Venezuela', Haiti: 'Haiti',
}

const DIRS = {
  N: 'norte', S: 'sul', E: 'leste', W: 'oeste', NE: 'nordeste', NW: 'noroeste', SE: 'sudeste', SW: 'sudoeste',
  NNE: 'norte-nordeste', ENE: 'leste-nordeste', ESE: 'leste-sudeste', SSE: 'sul-sudeste',
  SSW: 'sul-sudoeste', WSW: 'oeste-sudoeste', WNW: 'oeste-noroeste', NNW: 'norte-noroeste',
}

// "68 km NNW of Ende, Indonesia" -> "68 km a norte-noroeste de Ende, Indonésia"
export function traduzirLocal(place) {
  if (!place) return ''
  let s = String(place)
  const m = s.match(/^(\d+)\s*km\s+([NSEW]{1,3})\s+of\s+(.+)$/i)
  if (m) {
    s = `${m[1]} km a ${DIRS[m[2].toUpperCase()] || m[2]} de ${m[3]}`
  } else {
    s = s
      .replace(/^(\d+)\s*km\s+of\s+/i, '$1 km de ')
      .replace(/\boff the coast of\b/i, 'no litoral de')
      .replace(/\bsouth of\b/i, 'ao sul de')
      .replace(/\bnorth of\b/i, 'ao norte de')
      .replace(/\beast of\b/i, 'a leste de')
      .replace(/\bwest of\b/i, 'a oeste de')
      .replace(/\bregion\b/i, 'região')
      .replace(/\bIslands\b/g, 'Ilhas')
      .replace(/\bIsland\b/g, 'Ilha')
      .replace(/\bSea\b/g, 'Mar')
  }
  const i = s.lastIndexOf(', ')
  if (i > -1) {
    const pais = s.slice(i + 2).trim()
    if (PAISES[pais]) s = s.slice(0, i + 2) + PAISES[pais]
  }
  return s
}

export function magInfo(mag) {
  const m = Number(mag) || 0
  if (m >= 7) return { cor: '#7F1D1D', rotulo: 'Grande' }
  if (m >= 6) return { cor: '#DC2626', rotulo: 'Forte' }
  if (m >= 5) return { cor: '#EA580C', rotulo: 'Moderado' }
  if (m >= 4) return { cor: '#D97706', rotulo: 'Leve' }
  return { cor: '#16A34A', rotulo: 'Pequeno' }
}

export function tempoRelativo(ms) {
  const min = Math.round((Date.now() - ms) / 60000)
  if (min < 2) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.round(h / 24)
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`
}

function dataFmt(ms) {
  return new Date(ms).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  })
}

function mapear(f) {
  const p = f.properties || {}
  const c = f.geometry?.coordinates || []
  const info = magInfo(p.mag)
  return {
    id: f.id,
    mag: Number(p.mag) || 0,
    magFmt: (Number(p.mag) || 0).toFixed(1).replace('.', ','),
    local: traduzirLocal(p.place),
    localEn: p.place || '',
    cor: info.cor,
    rotulo: info.rotulo,
    prof: c[2] != null ? Math.round(c[2]) : null,
    lat: c[1],
    lon: c[0],
    tsunami: p.tsunami === 1,
    felt: p.felt || 0,
    alert: p.alert || null,
    time: p.time,
    dataFmt: dataFmt(p.time),
    tempo: tempoRelativo(p.time),
    url: p.url,
  }
}

async function feed(nome) {
  try {
    const r = await fetch(`${USGS}/${nome}.geojson`, {
      headers: { 'User-Agent': UA },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(15000),
    })
    if (!r.ok) return []
    const d = await r.json()
    return (d.features || []).map(mapear)
  } catch {
    return []
  }
}

// Carrega tudo de uma vez pra página: recentes (M4,5+ na semana) e maiores (mês).
export async function carregarTerremotos() {
  const [recentesRaw, maiores] = await Promise.all([feed('4.5_week'), feed('significant_month')])
  const recentes = recentesRaw.sort((a, b) => b.time - a.time)

  const umDia = Date.now() - 24 * 3600e3
  const dia = recentes.filter((t) => t.time >= umDia)
  const maiorDia = dia.slice().sort((a, b) => b.mag - a.mag)[0] || null
  const maiorMes = maiores.slice().sort((a, b) => b.mag - a.mag)[0] || null

  return {
    recentes: recentes.slice(0, 40),
    maiores: maiores.sort((a, b) => b.mag - a.mag).slice(0, 8),
    stats: { total24h: dia.length, maiorDia, maiorMes },
  }
}
