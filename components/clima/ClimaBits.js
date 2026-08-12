import { wmo } from '@/lib/clima'
import { t } from '@/lib/tokens'

const LOC = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }

export function diaCurto(dataISO, i, lang) {
  if (i === 0) return { pt: 'Hoje', en: 'Today', es: 'Hoy' }[lang] || 'Hoje'
  if (i === 1) return { pt: 'Amanhã', en: 'Tomorrow', es: 'Mañana' }[lang] || 'Amanhã'
  return new Date(dataISO + 'T12:00:00').toLocaleDateString(LOC[lang] || 'pt-BR', { weekday: 'short' })
}

// Bloco horizontal de dias (previsão)
export function TiraDias({ dias, lang, n = 5 }) {
  return (
    <div style={{ display: 'flex', gap: 8, borderTop: `1px solid ${t.line}`, paddingTop: 12 }}>
      {dias.slice(0, n).map((d, i) => (
        <div key={d.data} style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: t.muted, textTransform: 'capitalize', marginBottom: 3 }}>{diaCurto(d.data, i, lang)}</div>
          <div style={{ fontSize: 18 }}>{wmo(d.code, lang).emoji}</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: t.ink }}>
            {d.max}°<span style={{ color: t.muted, fontWeight: 400 }}> {d.min}°</span>
          </div>
          {d.chuva > 30 && <div style={{ fontSize: 10.5, color: '#2563EB' }}>💧{d.chuva}%</div>}
        </div>
      ))}
    </div>
  )
}

// Card completo de um lugar (capital, cidade ou bairro)
export function CardClima({ titulo, subtitulo, clima, lang, destaque = false }) {
  const L = { pt: { umid: 'Umidade', vento: 'Vento', sens: 'Sensação', indisp: 'Dados indisponíveis.' }, en: { umid: 'Humidity', vento: 'Wind', sens: 'Feels like', indisp: 'Data unavailable.' }, es: { umid: 'Humedad', vento: 'Viento', sens: 'Sensación', indisp: 'Datos no disponibles.' } }[lang] || {}
  if (!clima || !clima.agora) {
    return (
      <div style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, padding: '20px 22px' }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: t.ink }}>{titulo}</h3>
        <p style={{ fontSize: 13, color: t.muted, marginTop: 8 }}>{L.indisp}</p>
      </div>
    )
  }
  const w = wmo(clima.agora.code, lang)
  return (
    <div
      style={{
        background: destaque ? `radial-gradient(120% 140% at 90% -10%, rgba(255,179,0,0.14), transparent 55%), ${t.card}` : t.card,
        border: `1px solid ${t.line}`,
        borderTop: `4px solid ${t.sun}`,
        borderRadius: t.radius,
        padding: destaque ? 'clamp(22px,3vw,30px)' : '20px 22px',
        boxShadow: t.shadow,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <h3 style={{ fontSize: destaque ? 22 : 17, fontWeight: 800, color: t.ink, lineHeight: 1.2 }}>{titulo}</h3>
          {subtitulo && <p style={{ fontSize: 12.5, color: t.muted, marginTop: 2 }}>{subtitulo}</p>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: destaque ? 40 : 30, lineHeight: 1 }}>{w.emoji}</div>
          <div style={{ fontSize: destaque ? 38 : 26, fontWeight: 900, color: t.ink, marginTop: 2 }}>{clima.agora.temp}°</div>
        </div>
      </div>
      <p style={{ fontSize: 13.5, color: t.inkSoft, marginBottom: 10 }}>{w.texto}</p>
      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: t.muted, marginBottom: 14, flexWrap: 'wrap' }}>
        {clima.agora.sensacao != null && <span>🌡️ {L.sens} {clima.agora.sensacao}°</span>}
        <span>💧 {L.umid} {clima.agora.umidade}%</span>
        <span>💨 {L.vento} {clima.agora.vento} km/h</span>
      </div>
      <TiraDias dias={clima.dias} lang={lang} n={5} />
    </div>
  )
}
