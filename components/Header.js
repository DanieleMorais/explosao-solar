'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SunLogo from './SunLogo'
import { t } from '@/lib/tokens'
import { CATEGORIES, langFromPath, withLang } from '@/lib/site'
import { ui, catLabel, LANGS } from '@/lib/i18n'

const LOCALE = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }

export default function Header() {
  const pathname = usePathname()
  const lang = langFromPath(pathname)
  const txt = ui(lang)
  const [today, setToday] = useState('')

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString(LOCALE[lang], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    )
  }, [lang])

  function swapLang(target) {
    const rest = lang === 'pt' ? pathname : pathname.replace(/^\/(en|es)/, '') || '/'
    return withLang(target, rest === '/' ? '' : rest) || '/'
  }

  return (
    <header style={{ background: t.dark, color: '#fff', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 20px rgba(0,0,0,0.35)' }}>
      <div style={{ borderBottom: `1px solid ${t.darkLine}` }}>
        <div
          style={{
            maxWidth: t.maxW,
            margin: '0 auto',
            padding: '7px clamp(20px, 3vw, 56px)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            fontSize: 12,
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          <span style={{ textTransform: 'capitalize' }} suppressHydrationWarning>
            {today || ' '}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="hide-mobile" style={{ letterSpacing: 0.4 }}>{txt.topbar}</span>
            <span style={{ display: 'flex', gap: 4 }}>
              {Object.keys(LANGS).map((code) => (
                <Link
                  key={code}
                  href={swapLang(code)}
                  hrefLang={LANGS[code].code}
                  className="chipnav"
                  aria-label={LANGS[code].name}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.5,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: code === lang ? t.sunGrad : 'transparent',
                    color: code === lang ? '#131417' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {LANGS[code].label}
                </Link>
              ))}
            </span>
          </span>
        </div>
      </div>

      <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: '14px clamp(20px, 3vw, 56px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <Link href={withLang(lang, '/') || '/'} style={{ display: 'flex', alignItems: 'center', gap: 12 }} aria-label="Explosão Solar">
          <SunLogo size={38} />
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span
              style={{
                fontWeight: 900,
                fontSize: 'clamp(20px, 4.5vw, 27px)',
                letterSpacing: -0.5,
                background: t.sunGrad,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                textTransform: 'uppercase',
              }}
            >
              Explosão Solar
            </span>
            <span style={{ fontSize: 10.5, letterSpacing: 3.2, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginTop: 4 }}>
              {txt.tagline}
            </span>
          </span>
        </Link>

        <Link
          href={withLang(lang, '/busca')}
          className="chipnav"
          aria-label={txt.search}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: 999,
            padding: '9px 16px',
            fontSize: 13.5,
            color: 'rgba(255,255,255,0.75)',
            whiteSpace: 'nowrap',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
          <span className="hide-mobile">{txt.search}</span>
        </Link>
      </div>

      <nav aria-label={txt.editorials} style={{ borderTop: `1px solid ${t.darkLine}` }}>
        <div
          className="noscrollbar"
          style={{ maxWidth: t.maxW, margin: '0 auto', padding: '10px clamp(20px, 3vw, 56px)', display: 'flex', gap: 8, overflowX: 'auto' }}
        >
          {CATEGORIES.map((c) => {
            const href = withLang(lang, `/${c.slug}`)
            const active = pathname === href
            return (
              <Link
                key={c.slug}
                href={href}
                className="chipnav"
                style={{
                  padding: '7px 15px',
                  borderRadius: 999,
                  fontSize: 13.5,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  border: active ? '1px solid transparent' : '1px solid rgba(255,255,255,0.18)',
                  background: active ? t.sunGrad : 'transparent',
                  color: active ? '#131417' : 'rgba(255,255,255,0.78)',
                }}
              >
                {catLabel(lang, c.slug)}
              </Link>
            )
          })}
          {(() => {
            const href = withLang(lang, '/clima')
            const active = pathname === href
            const label = { pt: 'Clima', en: 'Weather', es: 'Clima' }[lang] || 'Clima'
            return (
              <Link
                key="clima"
                href={href}
                className="chipnav"
                style={{
                  padding: '7px 15px',
                  borderRadius: 999,
                  fontSize: 13.5,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: active ? '1px solid transparent' : '1px solid rgba(255,255,255,0.18)',
                  background: active ? t.sunGrad : 'transparent',
                  color: active ? '#131417' : 'rgba(255,255,255,0.78)',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: 999, background: '#22C55E', display: 'inline-block' }} />
                {label}
              </Link>
            )
          })()}
          {lang === 'pt' && (() => {
            const href = '/cotacoes'
            const active = pathname === href
            const label = 'Cotações'
            return (
              <Link
                key="cotacoes"
                href={href}
                className="chipnav"
                style={{
                  padding: '7px 15px',
                  borderRadius: 999,
                  fontSize: 13.5,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: active ? '1px solid transparent' : '1px solid rgba(255,255,255,0.18)',
                  background: active ? t.sunGrad : 'transparent',
                  color: active ? '#131417' : 'rgba(255,255,255,0.78)',
                }}
              >
                💵 {label}
              </Link>
            )
          })()}
          {lang === 'pt' && (() => {
            const href = '/loterias'
            const active = pathname === href
            return (
              <Link
                key="loterias"
                href={href}
                className="chipnav"
                style={{
                  padding: '7px 15px',
                  borderRadius: 999,
                  fontSize: 13.5,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: active ? '1px solid transparent' : '1px solid rgba(255,255,255,0.18)',
                  background: active ? t.sunGrad : 'transparent',
                  color: active ? '#131417' : 'rgba(255,255,255,0.78)',
                }}
              >
                🍀 Loterias
              </Link>
            )
          })()}
          {lang === 'pt' && (() => {
            const href = '/horoscopo'
            const active = pathname.startsWith('/horoscopo')
            return (
              <Link
                key="horoscopo"
                href={href}
                className="chipnav"
                style={{
                  padding: '7px 15px',
                  borderRadius: 999,
                  fontSize: 13.5,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: active ? '1px solid transparent' : '1px solid rgba(255,255,255,0.18)',
                  background: active ? t.sunGrad : 'transparent',
                  color: active ? '#131417' : 'rgba(255,255,255,0.78)',
                }}
              >
                🔮 Horóscopo
              </Link>
            )
          })()}
        </div>
      </nav>
    </header>
  )
}
