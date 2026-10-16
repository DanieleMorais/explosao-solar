'use client'

import { useEffect, useRef, useState } from 'react'
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
    // no celular a data longa não cabe ao lado dos idiomas: versão curta sem o ano
    const curta = window.matchMedia('(max-width: 480px)').matches
    setToday(
      new Date().toLocaleDateString(LOCALE[lang], curta ? { weekday: 'short', day: 'numeric', month: 'long' } : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    )
  }, [lang])

  // Menu de editorias: no computador, faixa numa linha só. Quando os botões não cabem (celular, tablet, janela
  // estreita), vira um botão "Editorias" que abre uma caixa com todos, só quando a pessoa clica.
  const nav = useRef(null)
  const faixa = useRef(null)
  const [caixa, setCaixa] = useState(false)
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    const medir = () => { if (nav.current && faixa.current) setCaixa(faixa.current.scrollWidth > nav.current.clientWidth + 1) }
    medir()
    const ro = new ResizeObserver(medir)
    if (nav.current) ro.observe(nav.current)
    return () => ro.disconnect()
  }, [lang])

  useEffect(() => { setAberto(false) }, [pathname])

  useEffect(() => {
    if (!aberto) return
    const fora = (e) => { if (nav.current && !nav.current.contains(e.target)) setAberto(false) }
    const tecla = (e) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('pointerdown', fora)
    document.addEventListener('keydown', tecla)
    return () => { document.removeEventListener('pointerdown', fora); document.removeEventListener('keydown', tecla) }
  }, [aberto])

  function swapLang(target) {
    const rest = lang === 'pt' ? pathname : pathname.replace(/^\/(en|es)/, '') || '/'
    return withLang(target, rest === '/' ? '' : rest) || '/'
  }

  const itens = [
    ...CATEGORIES.map((c) => ({ href: withLang(lang, `/${c.slug}`), label: catLabel(lang, c.slug) })),
    { href: withLang(lang, '/clima'), label: { pt: 'Clima', en: 'Weather', es: 'Clima' }[lang] || 'Clima', ponto: '#22C55E' },
    ...(lang === 'pt'
      ? [
          { href: '/terremotos', label: 'Terremotos', ponto: '#DC2626' },
          { href: '/cotacoes', label: '💵 Cotações' },
          { href: '/loterias', label: '🍀 Loterias' },
          { href: '/horoscopo', label: '🔮 Horóscopo', prefixo: true },
        ]
      : []),
  ]
  const ehAtivo = (it) => (it.prefixo ? pathname.startsWith(it.href) : pathname === it.href)

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
          <span style={{ textTransform: 'capitalize', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} suppressHydrationWarning>
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

      <nav ref={nav} aria-label={txt.editorials} className="menu-nav" data-caixa={caixa ? '1' : undefined} style={{ borderTop: `1px solid ${t.darkLine}`, position: 'relative' }}>
        <div
          ref={faixa}
          className="noscrollbar menu-faixa"
          style={{ maxWidth: t.maxW, margin: '0 auto', padding: '10px clamp(20px, 3vw, 56px)', display: 'flex', gap: 8, overflowX: 'auto' }}
        >
          {itens.map((it) => <Chip key={it.href} it={it} ativo={ehAtivo(it)} />)}
        </div>

        <div className="menu-botao" style={{ maxWidth: t.maxW, margin: '0 auto', padding: '9px clamp(20px, 3vw, 56px)', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-controls="menu-caixa"
            className="chipnav"
            style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 16px', borderRadius: 999, fontSize: 14, fontWeight: 800, color: '#fff', background: aberto ? 'rgba(255,255,255,0.12)' : 'transparent', border: '1px solid rgba(255,255,255,0.28)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              {aberto ? <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></> : <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>}
            </svg>
            {{ pt: 'Editorias', en: 'Sections', es: 'Secciones' }[lang] || 'Editorias'}
          </button>
          {itens.find(ehAtivo) && (
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
              {itens.find(ehAtivo).label}
            </span>
          )}
        </div>

        {aberto && (
          <div
            id="menu-caixa"
            className="menu-caixa"
            style={{ position: 'absolute', left: 0, right: 0, top: '100%', background: t.dark, borderTop: `1px solid ${t.darkLine}`, boxShadow: '0 18px 40px rgba(0,0,0,0.45)', zIndex: 60 }}
          >
            <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: '14px clamp(20px, 3vw, 56px) 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
              {itens.map((it) => <Chip key={it.href} it={it} ativo={ehAtivo(it)} cheio />)}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

function Chip({ it, ativo, cheio }) {
  return (
    <Link
      href={it.href}
      className="chipnav"
      aria-current={ativo ? 'page' : undefined}
      style={{
        padding: cheio ? '10px 14px' : '7px 15px',
        borderRadius: 999,
        fontSize: 13.5,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        justifyContent: cheio ? 'center' : undefined,
        gap: 6,
        border: ativo ? '1px solid transparent' : '1px solid rgba(255,255,255,0.18)',
        background: ativo ? t.sunGrad : 'transparent',
        color: ativo ? '#131417' : 'rgba(255,255,255,0.78)',
      }}
    >
      {it.ponto && <span style={{ width: 7, height: 7, borderRadius: 999, background: it.ponto, display: 'inline-block' }} />}
      {it.label}
    </Link>
  )
}
