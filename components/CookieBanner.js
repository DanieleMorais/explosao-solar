'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { t } from '@/lib/tokens'
import { langFromPath, withLang } from '@/lib/site'
import { ui } from '@/lib/i18n'

const KEY = 'es-consent'

export default function CookieBanner() {
  const lang = langFromPath(usePathname())
  const txt = ui(lang)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true)
  }, [])

  function decide(value) {
    localStorage.setItem(KEY, value)
    window.dispatchEvent(new CustomEvent('es-consent-changed', { detail: value }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 100,
        maxWidth: 680,
        margin: '0 auto',
        background: t.dark,
        color: 'rgba(255,255,255,0.85)',
        borderRadius: t.radius,
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        padding: '20px 22px',
      }}
    >
      <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>
        <strong style={{ color: '#FFB300' }}>{txt.cookieTitle}</strong> {txt.cookieText}{' '}
        <Link href={withLang(lang, '/politica-de-cookies')} style={{ color: '#FFB300', textDecoration: 'underline' }}>
          {txt.cookiePolicy}
        </Link>
        .
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <button
          className="btn"
          onClick={() => decide('all')}
          style={{
            background: t.sunGrad,
            color: '#131417',
            fontWeight: 800,
            fontSize: 13.5,
            padding: '10px 20px',
            borderRadius: 999,
          }}
        >
          {txt.cookieAccept}
        </button>
        <button
          className="btn"
          onClick={() => decide('essential')}
          style={{
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'rgba(255,255,255,0.85)',
            fontWeight: 600,
            fontSize: 13.5,
            padding: '10px 20px',
            borderRadius: 999,
          }}
        >
          {txt.cookieEssential}
        </button>
      </div>
    </div>
  )
}
