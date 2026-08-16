import { wmo } from '@/lib/clima'
import { t } from '@/lib/tokens'

const TIT = { pt: 'Hora a hora (24h)', en: 'Hourly (24h)', es: 'Hora a hora (24h)' }
const AGORA = { pt: 'Agora', en: 'Now', es: 'Ahora' }

export default function FaixaHoras({ horas, lang = 'pt' }) {
  if (!horas || !horas.length) return null
  return (
    <div style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, padding: '18px 6px 14px', boxShadow: t.shadow, marginTop: 22 }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: t.ink, margin: '0 0 12px', padding: '0 16px' }}>🕐 {TIT[lang] || TIT.pt}</h2>
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', padding: '0 12px 6px', scrollbarWidth: 'thin' }}>
        {horas.map((h, i) => {
          const w = wmo(h.code, lang)
          const chuva = h.chuva >= 20
          return (
            <div
              key={i}
              style={{
                flex: '0 0 auto',
                width: 60,
                textAlign: 'center',
                padding: '10px 4px',
                borderRadius: 12,
                background: i === 0 ? t.sunGrad : 'transparent',
                color: i === 0 ? '#131417' : t.ink,
              }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 700, color: i === 0 ? '#131417' : t.muted }}>{i === 0 ? AGORA[lang] || AGORA.pt : h.hora}</div>
              <div style={{ fontSize: 22, margin: '4px 0' }}>{w.emoji}</div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{h.temp}°</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, height: 14, color: i === 0 ? '#1b4d6b' : '#2f7dd1' }}>{chuva ? `💧${h.chuva}%` : ''}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
