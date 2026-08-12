import Link from 'next/link'
import { notFound } from 'next/navigation'
import { estado, geocodificar } from '@/lib/brasil'
import { cidadeBR } from '@/lib/cidades-br'
import { previsaoPonto, climaAnual } from '@/lib/clima'
import { t } from '@/lib/tokens'
import { withLang } from '@/lib/site'
import { CardClima } from '@/components/clima/ClimaBits'
import BuscaClima from '@/components/clima/BuscaClima'

export const revalidate = 1800

function titulo(slug) {
  return slug.split('-').map((p) => (p.length <= 2 ? p : p.charAt(0).toUpperCase() + p.slice(1))).join(' ')
}

const TXT = {
  pt: {
    voltar: (n) => `← ${n}`,
    bairros: 'Clima por bairro',
    bairrosIntro: 'Digite o nome do seu bairro para ver a previsão exata da sua região.',
    semDados: 'Não conseguimos carregar o clima desta cidade agora.',
    anualTitulo: (n) => `Como é o clima em ${n} ao longo do ano`,
    estacoes: ['Verão', 'Outono', 'Inverno', 'Primavera'],
    atualizado: 'Previsão atualizada a cada 30 min · Médias históricas: Open-Meteo',
  },
  en: {
    voltar: (n) => `← ${n}`,
    bairros: 'Weather by neighborhood',
    bairrosIntro: 'Type your neighborhood to see the exact forecast for your area.',
    semDados: "We couldn't load this city's weather right now.",
    anualTitulo: (n) => `What the weather is like in ${n} through the year`,
    estacoes: ['Summer', 'Autumn', 'Winter', 'Spring'],
    atualizado: 'Forecast updated every 30 min · Historical averages: Open-Meteo',
  },
  es: {
    voltar: (n) => `← ${n}`,
    bairros: 'Clima por barrio',
    bairrosIntro: 'Escribe tu barrio para ver el pronóstico exacto de tu zona.',
    semDados: 'No pudimos cargar el clima de esta ciudad ahora.',
    anualTitulo: (n) => `Cómo es el clima en ${n} a lo largo del año`,
    estacoes: ['Verano', 'Otoño', 'Invierno', 'Primavera'],
    atualizado: 'Pronóstico actualizado cada 30 min · Promedios históricos: Open-Meteo',
  },
}

function textoAnual(nome, a, lang) {
  if (lang !== 'pt') {
    return `In ${nome}, summer highs average around ${a.verao?.max}°C and winter lows around ${a.inverno?.min}°C. The warmest month is usually ${a.mesMaisQuente.nome} and the coldest is ${a.mesMaisFrio.nome}, with rainfall concentrated around ${a.mesMaisChuvoso} and roughly ${a.chuvaAnual} mm of rain per year.`
  }
  return `Em ${nome}, o verão costuma ter máximas em torno de ${a.verao?.max}°C e mínimas de ${a.verao?.min}°C, enquanto o inverno fica mais ameno, com máximas perto de ${a.inverno?.max}°C e mínimas de ${a.inverno?.min}°C. O mês mais quente costuma ser ${a.mesMaisQuente.nome} (média de máximas em torno de ${a.mesMaisQuente.temp}°C) e o mais frio, ${a.mesMaisFrio.nome} (mínimas perto de ${a.mesMaisFrio.temp}°C). As chuvas se concentram em ${a.mesMaisChuvoso}, e o período mais seco costuma ser ${a.mesMaisSeco} — a cidade registra cerca de ${a.chuvaAnual} mm de chuva por ano.`
}

export default async function CidadeClimaView({ lang = 'pt', uf, cidade }) {
  const e = estado(uf)
  if (!e) notFound()
  const L = TXT[lang] || TXT.pt

  const conhecida = cidadeBR(e.uf, cidade)
  const nomeCidade = conhecida ? conhecida.nome : titulo(cidade)
  const coords = conhecida ? { lat: conhecida.lat, lon: conhecida.lon, rotulo: `${nomeCidade}, ${e.nome}` } : await geocodificar(nomeCidade, e.uf)

  const [clima, anual] = await Promise.all([
    coords ? previsaoPonto(coords.lat, coords.lon) : Promise.resolve(null),
    coords ? climaAnual(coords.lat, coords.lon) : Promise.resolve(null),
  ])

  const estacoes = anual ? [anual.verao, anual.outono, anual.inverno, anual.primavera] : []

  return (
    <div>
      <section style={{ background: `radial-gradient(110% 160% at 85% -20%, ${t.sun}55, transparent 55%), linear-gradient(135deg, ${t.sun} 0%, #101322 80%)`, color: '#fff', padding: '40px 0 36px' }}>
        <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: t.pad }}>
          <Link href={withLang(lang, `/clima/brasil/${e.uf.toLowerCase()}`)} className="hoverlink" style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{L.voltar(e.nome)}</Link>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, letterSpacing: -0.8, marginTop: 10 }}>
            {lang === 'en' ? `Weather in ${nomeCidade}` : lang === 'es' ? `Clima en ${nomeCidade}` : `Previsão do tempo em ${nomeCidade}`}
          </h1>
          <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>{e.nome} · {e.uf}</p>
        </div>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(20px, 3vw, 56px)' }}>
        {clima ? (
          <CardClima titulo={nomeCidade} subtitulo={coords.rotulo} clima={clima} lang={lang} destaque />
        ) : (
          <p style={{ fontSize: 15, color: t.muted }}>{L.semDados}</p>
        )}

        {anual && (
          <div style={{ marginTop: 30 }}>
            <h2 style={{ fontSize: 'clamp(19px,3vw,24px)', fontWeight: 900, letterSpacing: -0.3, marginBottom: 14 }}>{L.anualTitulo(nomeCidade)}</h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.75, color: t.inkSoft, marginBottom: 20 }}>{textoAnual(nomeCidade, anual, lang)}</p>
            <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              {estacoes.map((s, i) =>
                s ? (
                  <div key={i} style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radiusSm, padding: '16px 18px', textAlign: 'center', boxShadow: t.shadow }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{L.estacoes[i]}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: t.ink }}>{s.max}°<span style={{ fontSize: 15, color: t.muted, fontWeight: 400 }}> / {s.min}°</span></div>
                  </div>
                ) : null
              )}
            </div>
          </div>
        )}

        <div style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, padding: 'clamp(18px,3vw,26px)', boxShadow: t.shadow, marginTop: 30 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: t.ink, marginBottom: 4 }}>🏘️ {L.bairros}</h2>
          <p style={{ fontSize: 13.5, color: t.muted, marginBottom: 14 }}>{L.bairrosIntro}</p>
          <BuscaClima lang={lang} uf={e.uf} placeholder={{ pt: `Ex.: seu bairro em ${nomeCidade}`, en: `e.g. your neighborhood in ${nomeCidade}`, es: `Ej.: tu barrio en ${nomeCidade}` }[lang]} />
        </div>

        <p style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', marginTop: 28 }}>{L.atualizado}</p>
      </div>
    </div>
  )
}
