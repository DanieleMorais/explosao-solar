'use client'

import { useState } from 'react'
import { wmo } from '@/lib/clima'
import { t } from '@/lib/tokens'

const TXT = {
  pt: { ph: 'Digite sua cidade ou bairro…', btn: 'Ver clima', buscando: 'Buscando…', nada: 'Não encontramos esse lugar. Tente incluir a cidade.', erro: 'Não deu certo — tente de novo.', umid: 'Umidade', vento: 'Vento', hoje: 'Hoje', amanha: 'Amanhã' },
  en: { ph: 'Type your city or neighborhood…', btn: 'Get weather', buscando: 'Searching…', nada: "We couldn't find that place. Try adding the city.", erro: 'Something went wrong — try again.', umid: 'Humidity', vento: 'Wind', hoje: 'Today', amanha: 'Tomorrow' },
  es: { ph: 'Escribe tu ciudad o barrio…', btn: 'Ver clima', buscando: 'Buscando…', nada: 'No encontramos ese lugar. Intenta incluir la ciudad.', erro: 'Algo salió mal — inténtalo de nuevo.', umid: 'Humedad', vento: 'Viento', hoje: 'Hoy', amanha: 'Mañana' },
}

export default function BuscaClima({ lang = 'pt', uf = '', placeholder }) {
  const L = TXT[lang] || TXT.pt
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('idle') // idle | loading | ok | nada | erro
  const [res, setRes] = useState(null)

  async function buscar(e) {
    e.preventDefault()
    if (q.trim().length < 2) return
    setEstado('loading')
    try {
      const r = await fetch(`/api/clima-busca?q=${encodeURIComponent(q.trim())}${uf ? `&uf=${uf}` : ''}`)
      if (r.status === 404) return setEstado('nada')
      if (!r.ok) return setEstado('erro')
      setRes(await r.json())
      setEstado('ok')
    } catch {
      setEstado('erro')
    }
  }

  const diaLabel = (d, i) => (i === 0 ? L.hoje : i === 1 ? L.amanha : new Date(d + 'T12:00:00').toLocaleDateString({ pt: 'pt-BR', en: 'en-US', es: 'es-ES' }[lang], { weekday: 'short' }))

  return (
    <div>
      <form onSubmit={buscar} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder || L.ph}
          aria-label={placeholder || L.ph}
          style={{ flex: '1 1 280px', minWidth: 0, padding: '14px 20px', borderRadius: 999, border: `2px solid ${t.line}`, background: t.card, fontSize: 15, outline: 'none' }}
        />
        <button type="submit" className="btn" style={{ background: t.sunGrad, color: '#131417', fontWeight: 800, fontSize: 14.5, padding: '14px 26px', borderRadius: 999, whiteSpace: 'nowrap' }}>
          {estado === 'loading' ? L.buscando : L.btn}
        </button>
      </form>

      {estado === 'nada' && <p style={{ fontSize: 13.5, color: t.muted, marginTop: 12 }}>{L.nada}</p>}
      {estado === 'erro' && <p style={{ fontSize: 13.5, color: '#DC2626', marginTop: 12 }}>{L.erro}</p>}

      {estado === 'ok' && res?.clima?.agora && (
        <div style={{ marginTop: 16, background: t.card, border: `1px solid ${t.line}`, borderTop: `4px solid ${t.sun}`, borderRadius: t.radius, padding: 'clamp(20px,3vw,28px)', boxShadow: t.shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: t.ink, lineHeight: 1.25 }}>{res.rotulo}</h3>
              <p style={{ fontSize: 13.5, color: t.inkSoft, marginTop: 4 }}>{wmo(res.clima.agora.code, lang).texto}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 40, lineHeight: 1 }}>{wmo(res.clima.agora.code, lang).emoji}</div>
              <div style={{ fontSize: 38, fontWeight: 900, color: t.ink }}>{res.clima.agora.temp}°</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 12.5, color: t.muted, marginBottom: 14, flexWrap: 'wrap' }}>
            {res.clima.agora.sensacao != null && <span>🌡️ {res.clima.agora.sensacao}°</span>}
            <span>💧 {L.umid} {res.clima.agora.umidade}%</span>
            <span>💨 {L.vento} {res.clima.agora.vento} km/h</span>
          </div>
          <div style={{ display: 'flex', gap: 8, borderTop: `1px solid ${t.line}`, paddingTop: 12 }}>
            {res.clima.dias.slice(0, 5).map((d, i) => (
              <div key={d.data} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: t.muted, textTransform: 'capitalize', marginBottom: 3 }}>{diaLabel(d.data, i)}</div>
                <div style={{ fontSize: 18 }}>{wmo(d.code, lang).emoji}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: t.ink }}>{d.max}°<span style={{ color: t.muted, fontWeight: 400 }}> {d.min}°</span></div>
                {d.chuva > 30 && <div style={{ fontSize: 10.5, color: '#2563EB' }}>💧{d.chuva}%</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
