import Link from 'next/link'
import { SIGNOS, getHoroscopo } from '@/lib/horoscopo'
import { t } from '@/lib/tokens'
import { SITE } from '@/lib/content'

export const revalidate = 3600

export const metadata = {
  title: 'Horóscopo do dia — previsão de hoje para os 12 signos',
  description:
    'Horóscopo do dia para todos os signos: Áries, Touro, Gêmeos, Câncer, Leão, Virgem, Libra, Escorpião, Sagitário, Capricórnio, Aquário e Peixes. Amor, trabalho e energia de hoje.',
  alternates: { canonical: '/horoscopo' },
}

export default function HoroscopoPage() {
  const h = getHoroscopo()
  const signos = h?.signos || {}

  return (
    <div>
      <section style={{ background: 'radial-gradient(120% 160% at 80% -20%, #7C3AED66, transparent 55%), linear-gradient(140deg, #2b1a5e 0%, #0C0E1A 80%)', color: '#fff', padding: '40px 0 34px' }}>
        <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: t.pad }}>
          <p style={{ fontSize: 12, letterSpacing: 2, color: '#c9b6ff', fontWeight: 800, textTransform: 'uppercase' }}>🔮 Astrologia</p>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, letterSpacing: -0.8, marginTop: 8 }}>Horóscopo do dia</h1>
          <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>
            {h?.dataFmt ? `Previsão de ${h.dataFmt} para os 12 signos.` : 'Previsão de hoje para os 12 signos.'}
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(20px, 3vw, 48px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {SIGNOS.map((s) => (
            <Link
              key={s.slug}
              href={`/horoscopo/${s.slug}`}
              className="card"
              style={{ display: 'block', textDecoration: 'none', background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, boxShadow: t.shadow, overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${t.line}` }}>
                <span style={{ fontSize: 30, color: s.cor }}>{s.simbolo}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: t.ink }}>{s.nome}</div>
                  <div style={{ fontSize: 11.5, color: t.muted }}>{s.periodo} · {s.elemento}</div>
                </div>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: t.inkSoft, padding: '14px 18px', margin: 0 }}>
                {signos[s.slug] || 'Previsão do dia chegando em instantes…'}
              </p>
            </Link>
          ))}
        </div>
        <p style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', marginTop: 26 }}>Horóscopo atualizado diariamente · {SITE.name}</p>
      </div>
    </div>
  )
}
