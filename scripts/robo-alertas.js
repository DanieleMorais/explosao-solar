// Monitor de desastres e clima espacial do Explosão Solar.
// Terremotos (USGS), alertas globais (GDACS: ciclones, enchentes, vulcões) e
// PREVISÃO de tempestade geomagnética (NOAA). Matérias geradas por TEMPLATE com
// os números oficiais das agências — sem IA, sem risco de invenção, funciona
// mesmo com as cotas de IA esgotadas.
//
// Uso: node scripts/robo-alertas.js [--dry]

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { adquirir } = require('./trava')
const { slugify, contaPalavras } = require('./regras-editoriais')
const { enviarPush } = require('./push')

const ROOT = path.join(__dirname, '..')
const CONTENT = path.join(ROOT, 'content')
const STATE_FILE = path.join(CONTENT, 'alertas-state.json')
const LOG = path.join(__dirname, 'alertas.log')

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`
  console.log(line)
  fs.appendFileSync(LOG, line + '\n')
}

const loadState = () => (fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : { vistos: [] })
const saveState = (v) => fs.writeFileSync(STATE_FILE, JSON.stringify({ vistos: v.slice(-1500) }, null, 2))

const nf = (n, lang) => Number(n).toLocaleString({ pt: 'pt-BR', en: 'en-US', es: 'es-ES' }[lang])

function dataLocal(iso, lang) {
  return new Date(iso).toLocaleString({ pt: 'pt-BR', en: 'en-US', es: 'es-ES' }[lang], {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

// "5 km S of San José del Palmar, Colombia" -> { perto: "San José del Palmar", pais: "Colombia" }
function lugarUsgs(place) {
  const p = String(place || '')
  const m = p.match(/of\s+(.+?),\s*([^,]+)$/i)
  if (m) return { perto: m[1], pais: m[2] }
  const partes = p.split(',')
  return { perto: partes[0] || p, pais: (partes[1] || '').trim() || null }
}

const paraNotificar = []

function salvar(base, tr) {
  paraNotificar.push({
    pt: { title: tr.pt.title, body: tr.pt.excerpt, url: 'https://explosaosolar.com/noticia/' + base.slug, tag: base.slug },
    en: { title: tr.en.title, body: tr.en.excerpt, url: 'https://explosaosolar.com/en/noticia/' + base.slug, tag: base.slug },
    es: { title: tr.es.title, body: tr.es.excerpt, url: 'https://explosaosolar.com/es/noticia/' + base.slug, tag: base.slug },
  })
  const dirs = { pt: path.join(CONTENT, 'articles'), en: path.join(CONTENT, 'en', 'articles'), es: path.join(CONTENT, 'es', 'articles') }
  for (const lang of ['pt', 'en', 'es']) {
    fs.mkdirSync(dirs[lang], { recursive: true })
    const t = tr[lang]
    fs.writeFileSync(
      path.join(dirs[lang], base.slug + '.json'),
      JSON.stringify(
        {
          ...base,
          title: t.title,
          seoTitle: t.seoTitle || t.title.slice(0, 58),
          subtitle: t.subtitle,
          excerpt: t.excerpt,
          contentHtml: t.contentHtml,
          readingMinutes: Math.max(2, Math.round(contaPalavras(t.contentHtml) / 200)),
          tags: t.tags,
          lang: lang === 'pt' ? undefined : lang,
        },
        null,
        2
      )
    )
  }
}

// ---------- TERREMOTOS (USGS) ----------

function materiaTerremoto(f) {
  const p = f.properties
  const mag = p.mag.toFixed(1)
  const magPt = mag.replace('.', ',')
  const { perto, pais } = lugarUsgs(p.place)
  const prof = Math.round(f.geometry.coordinates[2])
  const quando = { pt: dataLocal(p.time, 'pt'), en: dataLocal(p.time, 'en'), es: dataLocal(p.time, 'es') }
  const local = pais ? `${perto} (${pais})` : perto
  const forte = p.mag >= 6.5

  const ctxPt =
    p.mag >= 7
      ? 'Terremotos acima de magnitude 7 são classificados como grandes e podem causar danos graves em áreas povoadas, dependendo da profundidade e da distância de centros urbanos.'
      : p.mag >= 6
        ? 'Terremotos entre magnitude 6 e 7 são considerados fortes e costumam ser sentidos a centenas de quilômetros do epicentro.'
        : 'Terremotos nessa faixa de magnitude são moderados e raramente causam danos estruturais graves, mas são amplamente sentidos pela população.'

  const replicasPt =
    'Após um tremor principal, é esperado que ocorram réplicas — abalos menores na mesma região — nos dias e semanas seguintes. A frequência delas tende a diminuir com o tempo, um padrão bem estabelecido pela sismologia. Réplicas relevantes são registradas pelas redes de monitoramento e atualizadas em tempo real.'

  const tsunamiPt = p.tsunami ? '<p><strong>As autoridades avaliam risco de tsunami para a região.</strong> Moradores de áreas costeiras próximas devem acompanhar os canais oficiais de defesa civil.</p>' : ''

  return {
    id: 'usgs:' + f.id,
    base: {
      slug: slugify(`terremoto magnitude ${magPt} ${perto} ${pais || ''}`),
      category: 'Ciência',
      categorySlug: 'ciencia',
      author: 'Daniele Morais',
      publishedAt: new Date().toISOString(),
      eventDate: new Date(p.time).toISOString(),
      sourceName: 'USGS',
      sourceUrl: p.url,
      alerta: 'terremoto',
    },
    tr: {
      pt: {
        title: `Terremoto de magnitude ${magPt} atinge região de ${local}`,
        seoTitle: `Terremoto de magnitude ${magPt} em ${perto}`.slice(0, 58),
        subtitle: `Tremor foi registrado a ${nf(prof, 'pt')} km de profundidade, segundo o serviço geológico americano (USGS).`,
        excerpt: `Terremoto de magnitude ${magPt} foi registrado perto de ${local}, a ${nf(prof, 'pt')} km de profundidade, segundo o USGS.`.slice(0, 166),
        tags: ['terremoto', 'sismo', pais || perto, 'USGS', 'desastres naturais'].filter(Boolean),
        contentHtml:
          `<p>Um terremoto de magnitude ${magPt} foi registrado em ${quando.pt} (horário de Brasília) perto de ${local}, segundo o Serviço Geológico dos Estados Unidos (USGS). O tremor ocorreu a aproximadamente ${nf(prof, 'pt')} km de profundidade.</p>` +
          tsunamiPt +
          `<h2>O que significa essa magnitude</h2><p>${ctxPt}</p><p>${forte ? 'A profundidade do tremor influencia diretamente o impacto na superfície: quanto mais raso, maior tende a ser a intensidade sentida pela população próxima ao epicentro.' : 'A magnitude mede a energia liberada na origem do tremor; a intensidade sentida em cada cidade depende da distância e do tipo de solo.'}</p>` +
          `<h2>O que esperar nos próximos dias</h2><p>${replicasPt}</p>` +
          `<p><em>Com dados do USGS (Serviço Geológico dos Estados Unidos).</em></p>`,
      },
      en: {
        title: `Magnitude ${mag} earthquake strikes near ${local}`,
        seoTitle: `Magnitude ${mag} earthquake near ${perto}`.slice(0, 58),
        subtitle: `The quake was recorded at a depth of ${nf(prof, 'en')} km, according to the US Geological Survey (USGS).`,
        excerpt: `A magnitude ${mag} earthquake was recorded near ${local}, at a depth of ${nf(prof, 'en')} km, according to the USGS.`.slice(0, 166),
        tags: ['earthquake', pais || perto, 'USGS', 'natural disasters'].filter(Boolean),
        contentHtml:
          `<p>A magnitude ${mag} earthquake was recorded on ${quando.en} (Brasília time) near ${local}, according to the United States Geological Survey (USGS). The quake occurred at a depth of roughly ${nf(prof, 'en')} km.</p>` +
          (p.tsunami ? '<p><strong>Authorities are assessing tsunami risk for the region.</strong></p>' : '') +
          `<h2>What this magnitude means</h2><p>${p.mag >= 7 ? 'Earthquakes above magnitude 7 are classified as major and can cause serious damage in populated areas, depending on depth and distance from urban centers.' : p.mag >= 6 ? 'Earthquakes between magnitude 6 and 7 are considered strong and are usually felt hundreds of kilometers from the epicenter.' : 'Earthquakes in this range are moderate and rarely cause severe structural damage, but are widely felt.'}</p>` +
          `<h2>What to expect in the coming days</h2><p>After a main shock, aftershocks — smaller quakes in the same region — are expected over the following days and weeks, with frequency decreasing over time, a well-established pattern in seismology.</p>` +
          `<p><em>With data from the USGS (United States Geological Survey).</em></p>`,
      },
      es: {
        title: `Terremoto de magnitud ${magPt} sacude la región de ${local}`,
        seoTitle: `Terremoto de magnitud ${magPt} en ${perto}`.slice(0, 58),
        subtitle: `El sismo se registró a ${nf(prof, 'es')} km de profundidad, según el servicio geológico estadounidense (USGS).`,
        excerpt: `Un terremoto de magnitud ${magPt} fue registrado cerca de ${local}, a ${nf(prof, 'es')} km de profundidad, según el USGS.`.slice(0, 166),
        tags: ['terremoto', 'sismo', pais || perto, 'USGS', 'desastres naturales'].filter(Boolean),
        contentHtml:
          `<p>Un terremoto de magnitud ${magPt} fue registrado el ${quando.es} (hora de Brasilia) cerca de ${local}, según el Servicio Geológico de los Estados Unidos (USGS). El sismo ocurrió a aproximadamente ${nf(prof, 'es')} km de profundidad.</p>` +
          (p.tsunami ? '<p><strong>Las autoridades evalúan el riesgo de tsunami para la región.</strong></p>' : '') +
          `<h2>Qué significa esta magnitud</h2><p>${p.mag >= 7 ? 'Los terremotos de magnitud superior a 7 se clasifican como grandes y pueden causar daños graves en zonas pobladas, según la profundidad y la distancia a los centros urbanos.' : p.mag >= 6 ? 'Los terremotos entre magnitud 6 y 7 se consideran fuertes y suelen sentirse a cientos de kilómetros del epicentro.' : 'Los sismos en este rango son moderados y rara vez causan daños estructurales graves, pero se sienten ampliamente.'}</p>` +
          `<h2>Qué esperar en los próximos días</h2><p>Tras un sismo principal, se esperan réplicas — temblores menores en la misma región — durante los días y semanas siguientes, con frecuencia decreciente, un patrón bien establecido por la sismología.</p>` +
          `<p><em>Con datos del USGS (Servicio Geológico de los Estados Unidos).</em></p>`,
      },
    },
  }
}

async function terremotos(vistos, dry) {
  const r = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson', { signal: AbortSignal.timeout(30000) })
  if (!r.ok) throw new Error('USGS HTTP ' + r.status)
  const j = await r.json()
  let n = 0
  for (const f of j.features) {
    if (f.properties.mag < 5.8) continue
    const id = 'usgs:' + f.id
    if (vistos.has(id)) continue
    vistos.add(id)
    const m = materiaTerremoto(f)
    if (!dry) salvar(m.base, m.tr)
    n++
    log(`terremoto M${f.properties.mag.toFixed(1)} ${f.properties.place} -> ${m.base.slug}`)
  }
  return n
}

// ---------- TEMPESTADE GEOMAGNÉTICA (NOAA) — previsão de verdade, e a cara do portal ----------

const KP_G = (kp) => (kp >= 8.67 ? 'G5' : kp >= 7.67 ? 'G4' : kp >= 6.67 ? 'G3' : kp >= 5.67 ? 'G2' : kp >= 4.67 ? 'G1' : null)

async function climaEspacial(vistos, dry) {
  const r = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json', { signal: AbortSignal.timeout(30000) })
  if (!r.ok) throw new Error('NOAA HTTP ' + r.status)
  const linhas = (await r.json()).slice(1) // [time_tag, kp, observed|estimated|predicted, noaa_scale]
  const previstos = linhas.filter((l) => l[2] === 'predicted')
  if (!previstos.length) return 0

  let pico = previstos[0]
  for (const l of previstos) if (parseFloat(l[1]) > parseFloat(pico[1])) pico = l
  const kp = parseFloat(pico[1])
  const escala = KP_G(kp)
  if (!escala || kp < 5.67) return 0 // só noticia G2+

  const dia = pico[0].slice(0, 10)
  const id = 'noaa:' + dia + ':' + escala
  if (vistos.has(id)) return 0
  vistos.add(id)

  const kpPt = kp.toFixed(1).replace('.', ',')
  const diaFmt = { pt: dataLocal(dia + 'T12:00:00Z', 'pt').split(',')[0], en: dataLocal(dia + 'T12:00:00Z', 'en').split(',')[0], es: dataLocal(dia + 'T12:00:00Z', 'es').split(',')[0] }
  const efeitosPt =
    escala >= 'G3'
      ? 'Tempestades dessa intensidade podem afetar sinais de GPS, comunicações de rádio em altas latitudes e operações de satélites, além de gerar auroras visíveis muito além dos polos.'
      : 'Nessa intensidade, os efeitos práticos costumam ser limitados: pequenas flutuações em redes elétricas de altas latitudes, ajustes de órbita em satélites e auroras mais amplas que o normal.'

  const base = {
    slug: slugify(`tempestade geomagnetica ${escala} prevista ${dia}`),
    category: 'Ciência',
    categorySlug: 'ciencia',
    author: 'Daniele Morais',
    publishedAt: new Date().toISOString(),
    sourceName: 'NOAA SWPC',
    sourceUrl: 'https://www.swpc.noaa.gov/',
    alerta: 'clima-espacial',
  }
  const tr = {
    pt: {
      title: `NOAA prevê tempestade geomagnética ${escala} para ${diaFmt.pt}`,
      seoTitle: `Tempestade solar ${escala} prevista para ${diaFmt.pt}`.slice(0, 58),
      subtitle: `Índice Kp deve chegar a ${kpPt}, segundo a previsão de três dias do centro de clima espacial americano.`,
      excerpt: `Centro de clima espacial da NOAA prevê tempestade geomagnética ${escala} (Kp ${kpPt}) para ${diaFmt.pt}. Entenda os efeitos.`.slice(0, 166),
      tags: ['tempestade solar', 'clima espacial', 'NOAA', 'aurora', 'explosão solar'],
      contentHtml:
        `<p>O Centro de Previsão de Clima Espacial da NOAA, agência atmosférica dos Estados Unidos, prevê uma tempestade geomagnética de classe ${escala} para ${diaFmt.pt}, com índice Kp estimado em ${kpPt}. A previsão faz parte do boletim de três dias da agência e pode ser revisada conforme novas observações do Sol.</p>` +
        `<h2>O que provoca a tempestade</h2><p>Tempestades geomagnéticas acontecem quando partículas carregadas lançadas pelo Sol — em explosões solares ou ejeções de massa coronal — atingem o campo magnético da Terra. A escala vai de G1 (fraca) a G5 (extrema).</p>` +
        `<h2>Efeitos esperados</h2><p>${efeitosPt}</p>` +
        `<h2>Como acompanhar</h2><p>A previsão é atualizada diariamente pela NOAA. Como o vento solar leva de um a três dias para chegar à Terra, esse é um dos poucos fenômenos naturais que a ciência consegue antecipar com antecedência real.</p>` +
        `<p><em>Com dados do Space Weather Prediction Center (NOAA).</em></p>`,
    },
    en: {
      title: `NOAA forecasts ${escala} geomagnetic storm for ${diaFmt.en}`,
      seoTitle: `${escala} solar storm forecast for ${diaFmt.en}`.slice(0, 58),
      subtitle: `The Kp index is expected to reach ${kp.toFixed(1)}, according to the US space weather center's 3-day outlook.`,
      excerpt: `NOAA's space weather center forecasts a ${escala} geomagnetic storm (Kp ${kp.toFixed(1)}) for ${diaFmt.en}. Here is what to expect.`.slice(0, 166),
      tags: ['solar storm', 'space weather', 'NOAA', 'aurora'],
      contentHtml:
        `<p>NOAA's Space Weather Prediction Center forecasts a ${escala}-class geomagnetic storm for ${diaFmt.en}, with the Kp index expected to reach ${kp.toFixed(1)}. The forecast is part of the agency's three-day outlook and may be revised as new solar observations arrive.</p>` +
        `<h2>What causes the storm</h2><p>Geomagnetic storms occur when charged particles released by the Sun — in solar flares or coronal mass ejections — reach Earth's magnetic field. The scale runs from G1 (minor) to G5 (extreme).</p>` +
        `<h2>Expected effects</h2><p>${escala >= 'G3' ? 'Storms of this intensity can affect GPS signals, high-latitude radio communications and satellite operations, and produce auroras visible far beyond the poles.' : 'At this intensity, practical effects are usually limited: minor power grid fluctuations at high latitudes, satellite orbit adjustments and wider-than-usual auroras.'}</p>` +
        `<p><em>With data from NOAA's Space Weather Prediction Center.</em></p>`,
    },
    es: {
      title: `NOAA prevé tormenta geomagnética ${escala} para el ${diaFmt.es}`,
      seoTitle: `Tormenta solar ${escala} prevista para el ${diaFmt.es}`.slice(0, 58),
      subtitle: `El índice Kp llegaría a ${kpPt}, según el pronóstico de tres días del centro de clima espacial de EE. UU.`,
      excerpt: `El centro de clima espacial de la NOAA prevé una tormenta geomagnética ${escala} (Kp ${kpPt}) para el ${diaFmt.es}.`.slice(0, 166),
      tags: ['tormenta solar', 'clima espacial', 'NOAA', 'aurora'],
      contentHtml:
        `<p>El Centro de Predicción de Clima Espacial de la NOAA prevé una tormenta geomagnética de clase ${escala} para el ${diaFmt.es}, con un índice Kp estimado en ${kpPt}. El pronóstico forma parte del boletín de tres días de la agencia y puede revisarse con nuevas observaciones del Sol.</p>` +
        `<h2>Qué provoca la tormenta</h2><p>Las tormentas geomagnéticas ocurren cuando partículas cargadas lanzadas por el Sol alcanzan el campo magnético de la Tierra. La escala va de G1 (menor) a G5 (extrema).</p>` +
        `<h2>Efectos esperados</h2><p>${escala >= 'G3' ? 'Tormentas de esta intensidad pueden afectar señales de GPS, comunicaciones de radio en altas latitudes y operaciones de satélites, además de generar auroras visibles mucho más allá de los polos.' : 'A esta intensidad, los efectos suelen ser limitados: pequeñas fluctuaciones en redes eléctricas de altas latitudes y auroras más amplias de lo normal.'}</p>` +
        `<p><em>Con datos del Space Weather Prediction Center (NOAA).</em></p>`,
    },
  }
  if (!dry) salvar(base, tr)
  log(`clima espacial: ${escala} previsto para ${dia} (Kp ${kp}) -> ${base.slug}`)
  return 1
}

// ---------- GDACS (ciclones, enchentes, vulcões — alertas laranja/vermelho) ----------

const GDACS_TIPO = {
  TC: { pt: 'Ciclone tropical', en: 'Tropical cyclone', es: 'Ciclón tropical' },
  FL: { pt: 'Enchente', en: 'Flood', es: 'Inundación' },
  VO: { pt: 'Atividade vulcânica', en: 'Volcanic activity', es: 'Actividad volcánica' },
  DR: { pt: 'Seca', en: 'Drought', es: 'Sequía' },
}

async function gdacs(vistos, dry) {
  const r = await fetch('https://www.gdacs.org/xml/rss.xml', { headers: { 'User-Agent': 'ExplosaoSolarBot/1.0' }, signal: AbortSignal.timeout(30000) })
  if (!r.ok) throw new Error('GDACS HTTP ' + r.status)
  const xml = await r.text()
  let n = 0

  for (const b of xml.match(/<item>[\s\S]*?<\/item>/g) || []) {
    const g = (tag) => ((b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i')) || [])[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim()
    const nivel = g('gdacs:alertlevel')
    const tipo = g('gdacs:eventtype')
    if (nivel !== 'Red' && nivel !== 'Orange') continue
    if (!GDACS_TIPO[tipo]) continue // terremotos já vêm do USGS com mais detalhe

    const eventId = g('gdacs:eventid')
    const id = `gdacs:${tipo}:${eventId}:${nivel}`
    if (vistos.has(id)) continue
    vistos.add(id)

    const paisRaw = g('gdacs:country') || 'região não especificada'
    const pais = paisRaw.split(',')[0]
    const nome = g('gdacs:eventname') || GDACS_TIPO[tipo].pt
    const titulo = g('title')
    const desc = g('description').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400)
    const link = g('link')
    const severo = nivel === 'Red'

    const nivelTxt = { pt: severo ? 'vermelho (grave)' : 'laranja (moderado a alto)', en: severo ? 'red (severe)' : 'orange (moderate to high)', es: severo ? 'rojo (grave)' : 'naranja (moderado a alto)' }

    const base = {
      slug: slugify(`${GDACS_TIPO[tipo].pt} ${nome} ${pais} alerta ${nivel}`),
      category: 'Mundo',
      categorySlug: 'mundo',
      author: 'Daniele Morais',
      publishedAt: new Date().toISOString(),
      sourceName: 'GDACS',
      sourceUrl: link || 'https://www.gdacs.org/',
      alerta: tipo.toLowerCase(),
    }
    const mk = (lang, tipoTxt) => ({
      title: `${tipoTxt}: alerta ${nivelTxt[lang].split(' ')[0]} ${lang === 'pt' ? 'para' : lang === 'en' ? 'for' : 'para'} ${pais}`.slice(0, 76),
      seoTitle: `${tipoTxt} ${lang === 'pt' ? 'em' : lang === 'en' ? 'in' : 'en'} ${pais}: ${lang === 'pt' ? 'alerta' : lang === 'en' ? 'alert' : 'alerta'} ${nivelTxt[lang].split(' ')[0]}`.slice(0, 58),
      subtitle:
        lang === 'pt'
          ? `Sistema global de alerta de desastres classifica o evento "${nome}" no nível ${nivelTxt.pt}.`
          : lang === 'en'
            ? `The global disaster alert system rates event "${nome}" at ${nivelTxt.en} level.`
            : `El sistema global de alerta de desastres clasifica el evento "${nome}" en nivel ${nivelTxt.es}.`,
      excerpt: (lang === 'pt'
        ? `${tipoTxt} leva ${pais} a alerta ${nivelTxt.pt} no sistema internacional GDACS. Veja o que se sabe.`
        : lang === 'en'
          ? `${tipoTxt} puts ${pais} under ${nivelTxt.en} alert in the international GDACS system.`
          : `${tipoTxt} pone a ${pais} en alerta ${nivelTxt.es} en el sistema internacional GDACS.`
      ).slice(0, 166),
      tags: [tipoTxt.toLowerCase(), pais, 'GDACS', lang === 'pt' ? 'desastres naturais' : lang === 'en' ? 'natural disasters' : 'desastres naturales'],
      contentHtml:
        (lang === 'pt'
          ? `<p>O GDACS, sistema global de alerta e coordenação de desastres mantido pela ONU e pela Comissão Europeia, emitiu alerta ${nivelTxt.pt} para o evento "${nome}", do tipo ${tipoTxt.toLowerCase()}, afetando ${paisRaw}.</p><p>Segundo o boletim oficial: ${desc}</p><h2>O que significa o nível de alerta</h2><p>O GDACS classifica eventos em verde, laranja e vermelho conforme o impacto humanitário estimado — população exposta, vulnerabilidade da região e capacidade de resposta local. Alertas laranja e vermelho indicam potencial necessidade de assistência internacional.</p><p><em>Com dados do GDACS (Global Disaster Alert and Coordination System).</em></p>`
          : lang === 'en'
            ? `<p>GDACS, the global disaster alert and coordination system run by the UN and the European Commission, issued a ${nivelTxt.en} alert for event "${nome}" (${tipoTxt.toLowerCase()}) affecting ${paisRaw}.</p><p>From the official bulletin: ${desc}</p><h2>What the alert level means</h2><p>GDACS rates events green, orange or red based on estimated humanitarian impact — exposed population, regional vulnerability and local response capacity.</p><p><em>With data from GDACS (Global Disaster Alert and Coordination System).</em></p>`
            : `<p>El GDACS, sistema global de alerta y coordinación de desastres de la ONU y la Comisión Europea, emitió una alerta ${nivelTxt.es} para el evento "${nome}" (${tipoTxt.toLowerCase()}) que afecta a ${paisRaw}.</p><p>Según el boletín oficial: ${desc}</p><h2>Qué significa el nivel de alerta</h2><p>El GDACS clasifica los eventos en verde, naranja y rojo según el impacto humanitario estimado.</p><p><em>Con datos del GDACS (Global Disaster Alert and Coordination System).</em></p>`),
    })

    if (!dry) salvar(base, { pt: mk('pt', GDACS_TIPO[tipo].pt), en: mk('en', GDACS_TIPO[tipo].en), es: mk('es', GDACS_TIPO[tipo].es) })
    n++
    log(`gdacs ${nivel} ${tipo} ${pais} -> ${base.slug}`)
    if (n >= 4) break // no máximo 4 por rodada pra não inundar o portal
  }
  return n
}

async function main() {
  if (!adquirir('alertas', log)) return
  const dry = process.argv.includes('--dry')

  const state = loadState()
  const vistos = new Set(state.vistos)
  let total = 0

  for (const [nome, fn] of [
    ['terremotos', terremotos],
    ['clima espacial', climaEspacial],
    ['gdacs', gdacs],
  ]) {
    try {
      total += await fn(vistos, dry)
    } catch (e) {
      log(`${nome} falhou: ${e.message}`)
    }
  }

  if (!dry) saveState([...vistos])
  if (!dry && paraNotificar.length) {
    for (const p of paraNotificar.slice(0, 3)) {
      try { await enviarPush(p, log) } catch (e) { log('push falhou: ' + e.message) }
    }
  }
  log(`fim: ${total} alerta(s) publicado(s)${dry ? ' [DRY]' : ''}`)

  if (total > 0 && !dry) {
    const stamp = path.join(CONTENT, '.ultimo-deploy')
    const ultimo = fs.existsSync(stamp) ? Number(fs.readFileSync(stamp, 'utf8')) : 0
    try {
      execSync('git add -A && git commit -q -m "Robo de alertas: desastres e clima espacial"', { cwd: ROOT, stdio: 'pipe', shell: 'cmd.exe' })
    } catch {}
    // alertas furam a trava de 55min se for terremoto forte ou alerta vermelho (notícia quente)
    if (Date.now() - ultimo > 20 * 60 * 1000) {
      fs.writeFileSync(stamp, String(Date.now()))
      try {
        execSync('vercel deploy --prod --yes', { cwd: ROOT, stdio: 'pipe', shell: 'cmd.exe', timeout: 900000 })
        log('deploy publicado')
      } catch (e) {
        log('DEPLOY FALHOU: ' + String(e.message).slice(0, 160))
      }
    } else {
      log('deploy adiado (trava de intervalo) — entra na próxima publicação')
    }
  }
}

main().catch((e) => {
  log('ERRO FATAL: ' + (e.stack || e.message))
  process.exit(1)
})
