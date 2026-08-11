'use client'

import { useState } from 'react'
import { t } from '@/lib/tokens'
import { ui } from '@/lib/i18n'

export default function NewsletterBox({ lang = 'pt' }) {
  const txt = ui(lang)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')

  async function submit(e) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('invalid')
      return
    }
    setStatus('sending')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section
      aria-label="Newsletter"
      style={{
        background: `radial-gradient(130% 160% at 90% -20%, rgba(255,179,0,0.35), transparent 55%), linear-gradient(135deg, #1A1030 0%, ${t.dark} 70%)`,
        borderRadius: t.radius,
        padding: 'clamp(26px, 4vw, 44px)',
        color: '#fff',
        textAlign: 'center',
        boxShadow: t.shadow,
      }}
    >
      <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 900, letterSpacing: -0.4, marginBottom: 10 }}>
        {txt.newsletterTitle} <span style={{ background: t.sunGrad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Explosão Solar</span>
      </h2>
      <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.72)', maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.6 }}>
        {txt.newsletterText}
      </p>
      {status === 'done' ? (
        <p style={{ fontSize: 15.5, fontWeight: 700, color: '#FFB300' }}>{txt.newsletterDone}</p>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={txt.newsletterPlaceholder}
            aria-label={txt.newsletterPlaceholder}
            style={{
              flex: '1 1 260px',
              maxWidth: 340,
              padding: '13px 18px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: 14.5,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            className="btn"
            disabled={status === 'sending'}
            style={{
              background: t.sunGrad,
              color: '#131417',
              fontWeight: 800,
              fontSize: 14.5,
              padding: '13px 26px',
              borderRadius: 999,
              opacity: status === 'sending' ? 0.7 : 1,
            }}
          >
            {status === 'sending' ? txt.newsletterSending : txt.newsletterButton}
          </button>
        </form>
      )}
      {status === 'invalid' && <p style={{ marginTop: 10, fontSize: 13, color: '#FF8A65' }}>{txt.newsletterInvalid}</p>}
      {status === 'error' && <p style={{ marginTop: 10, fontSize: 13, color: '#FF8A65' }}>{txt.newsletterError}</p>}
    </section>
  )
}
