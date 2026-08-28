import Link from 'next/link'
import { previsaoCidades, climaEspacial, wmo } from '@/lib/clima'
import { t } from '@/lib/tokens'
import { withLang } from '@/lib/site'

export const revalidate = 1800

const TXT = {
  pt: {
    kicker: 'Tempo real',
    titulo: 'Clima no mundo',
    intro: 'Previsão do tempo das grandes cidades e o clima espacial — atualizados automaticamente.',
    agora: 'Agora',
    umidade: 'Umidade',
    vento: 'Vento',
    chuva: 'chuva',
    espacialTitulo: '☀️ Clima espacial',
    espacialCalmo: 'Sem tempestade geomagnética prevista. O campo magnético da Terra está estável.',
    espacialTempestade: (esc, kp) => `Tempestade geomagnética ${esc} prevista (Kp ${kp}). Pode afetar GPS, satélites e redes elétricas em altas latitudes.`,
    espacialPico: 'Pico previsto para',
    indisponivel: 'Dados indisponíveis no momento.',
    dias: ['Hoje', 'Amanhã'],
    atualizado: 'Em tempo real · Fontes: Open-Meteo e NOAA',
  },
  en: {
    kicker: 'Live',
    titulo: 'World weather',
    intro: 'Weather forecast for major cities and space weather — updated automatically.',
    agora: 'Now',
    umidade: 'Humidity',
    vento: 'Wind',
    chuva: 'rain',
    espacialTitulo: '☀️ Space weather',
    espacialCalmo: "No geomagnetic storm forecast. Earth's magnetic field is stable.",
    espacialTempestade: (esc, kp) => `${esc} geomagnetic storm forecast (Kp ${kp}). May affect GPS, satellites and power grids at high latitudes.`,
    espacialPico: 'Peak expected',
    indisponivel: 'Data unavailable right now.',
    dias: ['Today', 'Tomorrow'],
    atualizado: 'Real-time data · Sources: Open-Meteo and NOAA',
  },
  es: {
    kicker: 'En vivo',
    titulo: 'Clima en el mundo',
    intro: 'Pronóstico del tiempo de las grandes ciudades y el clima espacial — actualizados automáticamente.',
    agora: 'Ahora',
    umidade: 'Humedad',
    vento: 'Viento',
    chuva: 'lluvia',
    espacialTitulo: '☀️ Clima espacial',
    espacialCalmo: 'Sin tormenta geomagnética prevista. El campo magnético de la Tierra está estable.',
    espacialTempestade: (esc, kp) => `Tormenta geomagnética ${esc} prevista (Kp ${kp}). Puede afectar GPS, satélites y redes eléctricas en altas latitudes.`,
    espacialPico: 'Pico previsto para',
    indisponivel: 'Datos no disponibles en este momento.',
    dias: ['Hoy', 'Mañana'],
    atualizado: 'En tiempo real · Fuentes: Open-Meteo y NOAA',
  },
}

function diaLabel(dataISO, i, L, lang) {
  if (i < 2) return L.dias[i]
  const loc = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }[lang]
  return new Date(dataISO + 'T12:00:00').toLocaleDateString(loc, { weekday: 'short' })
}

export default async function ClimaView({ lang = 'pt' }) {
  const L = TXT[lang] || TXT.pt
  const [cidades, espacial] = await Promise.all([previsaoCidades(), climaEspacial()])

  return (
    <div>
      <section style={{ background: t.dark, color: '#fff', padding: '42px 0 38px' }}>
        <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: t.pad }}>
          <p style={{ fontSize: 12, letterSpacing: 2.4, textTransform: 'uppercase', color: '#FFB300', marginBottom: 8, fontWeight: 700 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 999, background: '#22C55E', marginRight: 7 }} />
            {L.kicker}
          </p>
          <h1 style={{ fontSize: 'clamp(28px, 4.6vw, 40px)', fontWeight: 900, letterSpacing: -0.7 }}>{L.titulo}</h1>
          <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.75)', maxWidth: 640, lineHeight: 1.6, marginTop: 12 }}>{L.intro}</p>
          <Link
            href={withLang(lang, '/clima/brasil')}
            className="btn"
            style={{ display: 'inline-block', marginTop: 18, background: t.sunGrad, color: '#131417', fontWeight: 800, fontSize: 14, padding: '11px 22px', borderRadius: 999 }}
          >
            {{ pt: '🇧🇷 Clima por estado e cidade do Brasil →', en: '🇧🇷 Weather by Brazilian state and city →', es: '🇧🇷 Clima por estado y ciudad de Brasil →' }[lang]}
          </Link>
        </div>
      </section>

      <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: 'clamp(20px, 3vw, 56px)' }}>
        {espacial && (
          <div
            style={{
              background: espacial.tempestade
                ? `radial-gradient(120% 160% at 90% -20%, rgba(220,38,38,0.35), transparent 55%), ${t.dark}`
                : `radial-gradient(120% 160% at 90% -20%, rgba(255,179,0,0.28), transparent 55%), ${t.dark}`,
              border: `1px solid ${espacial.tempestade ? 'rgba(220,38,38,0.4)' : 'rgba(255,179,0,0.25)'}`,
              borderRadius: t.radius,
              padding: 'clamp(20px, 3vw, 28px)',
              color: '#fff',
              marginBottom: 28,
            }}
          >
            <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{L.espacialTitulo}</h2>
            <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: 0 }}>
              {espacial.tempestade ? L.espacialTempestade(espacial.escala, String(espacial.kp).replace('.', ',')) : L.espacialCalmo}
              {espacial.tempestade && espacial.quando && (
                <span style={{ display: 'block', marginTop: 6, color: '#FFB300', fontWeight: 700 }}>
                  {L.espacialPico} {new Date(espacial.quando).toLocaleString({ pt: 'pt-BR', en: 'en-US', es: 'es-ES' }[lang], { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                </span>
              )}
            </p>
          </div>
        )}

        <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
          {cidades.map(({ cidade, agora, dias, erro }) => (
            <div key={cidade.lat} style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, padding: '20px 22px', boxShadow: t.shadow }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: t.ink }}>{cidade.nome[lang]}</h3>
                  <p style={{ fontSize: 12.5, color: t.muted }}>{cidade.pais[lang]}</p>
                </div>
                {!erro && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 30, lineHeight: 1 }}>{wmo(agora.code, lang).emoji}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: t.ink, marginTop: 2 }}>{agora.temp}°</div>
                  </div>
                )}
              </div>

              {erro ? (
                <p style={{ fontSize: 13, color: t.muted }}>{L.indisponivel}</p>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: t.inkSoft, marginBottom: 12 }}>{wmo(agora.code, lang).texto}</p>
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: t.muted, marginBottom: 14 }}>
                    <span>💧 {L.umidade} {agora.umidade}%</span>
                    <span>💨 {L.vento} {agora.vento} km/h</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, borderTop: `1px solid ${t.line}`, paddingTop: 12 }}>
                    {dias.slice(0, 4).map((d, i) => (
                      <div key={d.data} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: t.muted, textTransform: 'capitalize', marginBottom: 3 }}>{diaLabel(d.data, i, L, lang)}</div>
                        <div style={{ fontSize: 18 }}>{wmo(d.code, lang).emoji}</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: t.ink }}>{d.max}°<span style={{ color: t.muted, fontWeight: 400 }}> {d.min}°</span></div>
                        {d.chuva > 30 && <div style={{ fontSize: 10.5, color: '#2563EB' }}>💧{d.chuva}%</div>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', marginTop: 28 }}>{L.atualizado}</p>
      </div>
    </div>
  )
}
