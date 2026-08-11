import { t } from '@/lib/tokens'

export default function PageShell({ kicker, title, intro, children, narrow = true }) {
  return (
    <div>
      <section style={{ background: t.dark, color: '#fff', padding: '42px 0 38px' }}>
        <div style={{ maxWidth: narrow ? 820 : t.maxW, margin: '0 auto', padding: '0 20px' }}>
          {kicker && (
            <p style={{ fontSize: 12, letterSpacing: 2.4, textTransform: 'uppercase', color: '#FFB300', marginBottom: 8, fontWeight: 700 }}>
              {kicker}
            </p>
          )}
          <h1 style={{ fontSize: 'clamp(28px, 4.6vw, 40px)', fontWeight: 900, letterSpacing: -0.7 }}>{title}</h1>
          {intro && <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.75)', maxWidth: 640, lineHeight: 1.6, marginTop: 12 }}>{intro}</p>}
        </div>
      </section>
      <div style={{ maxWidth: narrow ? 820 : t.maxW, margin: '0 auto', padding: '36px 20px 0' }}>{children}</div>
    </div>
  )
}
