'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SunLogo from './SunLogo'
import { t } from '@/lib/tokens'
import { CATEGORIES, langFromPath, withLang } from '@/lib/site'
import { catColor } from '@/lib/tokens'
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
  const topo = useRef(null)
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
    const fora = (e) => { if (topo.current && !topo.current.contains(e.target)) setAberto(false) }
    const tecla = (e) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('pointerdown', fora)
    document.addEventListener('keydown', tecla)
    return () => { document.removeEventListener('pointerdown', fora); document.removeEventListener('keydown', tecla) }
  }, [aberto])

  function swapLang(target) {
    const rest = lang === 'pt' ? pathname : pathname.replace(/^\/(en|es)/, '') || '/'
    return withLang(target, rest === '/' ? '' : rest) || '/'
  }

  const editorias = CATEGORIES.map((c) => ({ href: withLang(lang, `/${c.slug}`), label: catLabel(lang, c.slug), cor: catColor(c.slug) }))
  const servicos = [
    { href: withLang(lang, '/clima'), label: { pt: 'Clima', en: 'Weather', es: 'Clima' }[lang] || 'Clima', faixa: { pt: 'Clima', en: 'Weather', es: 'Clima' }[lang] || 'Clima', ponto: '#22C55E', icone: 'clima', cor: '#22C55E' },
    ...(lang === 'pt'
      ? [
          { href: '/terremotos', label: 'Terremotos', faixa: 'Terremotos', ponto: '#DC2626', icone: 'terremoto', cor: '#EF4444' },
          { href: '/cotacoes', label: 'Cotações', faixa: '💵 Cotações', icone: 'cotacao', cor: '#22C55E' },
          { href: '/loterias', label: 'Loterias', faixa: '🍀 Loterias', icone: 'loteria', cor: '#10B981' },
          { href: '/horoscopo', label: 'Horóscopo', faixa: '🔮 Horóscopo', icone: 'horoscopo', cor: '#A78BFA', prefixo: true },
        ]
      : []),
  ]
  const itens = [...editorias, ...servicos.map((s) => ({ ...s, label: s.faixa }))]
  const ehAtivo = (it) => (it.prefixo ? pathname.startsWith(it.href) : pathname === it.href)

  return (
    <header ref={topo} style={{ background: t.dark, color: '#fff', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 20px rgba(0,0,0,0.35)' }}>
      <div className="topo-barra" style={{ borderBottom: `1px solid ${t.darkLine}` }}>
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

      <div className="topo-linha" style={{ maxWidth: t.maxW, margin: '0 auto', padding: '14px clamp(20px, 3vw, 56px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <Link href={withLang(lang, '/') || '/'} className="topo-logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }} aria-label="Explosão Solar">
          <SunLogo size={38} />
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span
              className="topo-nome"
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
            <span className="topo-frase" style={{ fontSize: 10.5, letterSpacing: 3.2, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginTop: 4 }}>
              {txt.tagline}
            </span>
          </span>
        </Link>

        <div className="topo-direita" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link
          href={withLang(lang, '/busca')}
          className="chipnav topo-busca"
          aria-label={txt.search}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'center',
            flex: '0 0 auto',
            minWidth: 42,
            height: 42,
            border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: 999,
            padding: '0 14px',
            fontSize: 13.5,
            color: 'rgba(255,255,255,0.75)',
            whiteSpace: 'nowrap',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" style={{ flex: '0 0 auto' }}>
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
          <span className="hide-mobile">{txt.search}</span>
        </Link>
          <button
            type="button"
            className="chipnav menu-botao"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-controls="menu-caixa"
            aria-label={aberto ? { pt: 'Fechar editorias', en: 'Close sections', es: 'Cerrar secciones' }[lang] : { pt: 'Abrir editorias', en: 'Open sections', es: 'Abrir secciones' }[lang]}
            style={{ alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 999, border: `1px solid ${aberto ? '#FFB300' : 'rgba(255,255,255,0.22)'}`, background: aberto ? 'rgba(255,179,0,0.12)' : 'transparent', color: aberto ? '#FFB300' : '#fff', cursor: 'pointer', flex: '0 0 auto' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              {aberto ? <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></> : <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>}
            </svg>
          </button>
        </div>
      </div>

      <nav ref={nav} aria-label={txt.editorials} className="menu-nav" data-caixa={caixa ? '1' : undefined} style={{ borderTop: `1px solid ${t.darkLine}`, position: 'relative' }}>
        <div
          ref={faixa}
          className="noscrollbar menu-faixa"
          style={{ maxWidth: t.maxW, margin: '0 auto', padding: '10px clamp(20px, 3vw, 56px)', display: 'flex', gap: 8, overflowX: 'auto' }}
        >
          {itens.map((it) => <Chip key={it.href} it={it} ativo={ehAtivo(it)} />)}
        </div>

        {aberto && (
          <>
            <div aria-hidden="true" onClick={() => setAberto(false)} className="menu-fundo" style={{ position: 'fixed', inset: 0, background: 'rgba(5,6,12,0.55)', zIndex: -1 }} />
            <div id="menu-caixa" className="menu-caixa" style={{ position: 'absolute', left: 0, right: 0, top: '100%', background: t.dark, borderTop: `1px solid ${t.darkLine}`, boxShadow: '0 24px 48px rgba(0,0,0,0.5)', maxHeight: 'calc(100dvh - 120px)', overflowY: 'auto' }}>
              <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: '18px clamp(20px, 3vw, 56px) 22px' }}>
                <div className="painel-topo">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }} suppressHydrationWarning>{today}</span>
                    <span role="group" aria-label={{ pt: 'Idioma', en: 'Language', es: 'Idioma' }[lang]} style={{ display: 'flex', padding: 3, borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', flex: '0 0 auto' }}>
                      {Object.keys(LANGS).map((code) => (
                        <Link key={code} href={swapLang(code)} hrefLang={LANGS[code].code} aria-label={LANGS[code].name} aria-current={code === lang ? 'true' : undefined} style={{ padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800, letterSpacing: 0.5, background: code === lang ? t.sunGrad : 'transparent', color: code === lang ? '#131417' : 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                          {LANGS[code].label}
                        </Link>
                      ))}
                    </span>
                  </div>
                  <form action={withLang(lang, '/busca')} method="get" role="search" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px 0 16px', height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 20 }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" style={{ flex: '0 0 auto' }}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg>
                    <input name="q" type="search" enterKeyHint="search" placeholder={{ pt: 'Buscar notícias', en: 'Search news', es: 'Buscar noticias' }[lang]} aria-label={txt.search} style={{ flex: 1, minWidth: 0, height: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 16, fontFamily: 'inherit' }} />
                    <button type="submit" style={{ flex: '0 0 auto', height: 36, padding: '0 14px', borderRadius: 10, border: 'none', background: t.sunGrad, color: '#131417', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}>{{ pt: 'Buscar', en: 'Search', es: 'Buscar' }[lang]}</button>
                  </form>
                </div>
                <p style={rotulo}>{{ pt: 'Editorias', en: 'Sections', es: 'Secciones' }[lang] || 'Editorias'}</p>
                <div style={grade}>
                  {editorias.map((it) => <ItemPainel key={it.href} it={it} ativo={ehAtivo(it)} />)}
                </div>
                <p style={{ ...rotulo, marginTop: 20 }}>{{ pt: 'Serviços', en: 'Services', es: 'Servicios' }[lang] || 'Serviços'}</p>
                <div style={gradeServicos}>
                  {servicos.map((it) => <ServicoPainel key={it.href} it={it} ativo={ehAtivo(it)} />)}
                </div>
              </div>
            </div>
          </>
        )}
      </nav>
    </header>
  )
}

const rotulo = { margin: '0 0 10px', fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }
const grade = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }
const gradeServicos = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }

const ICONES = {
  clima: <><circle cx="9" cy="9" r="3.2" /><path d="M9 2.5v1.6M3.6 9H2M4.4 4.4l1.1 1.1M13.6 4.4l-1.1 1.1" /><path d="M8.5 20h9a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.4 1.6A2.7 2.7 0 0 0 8.5 20z" /></>,
  terremoto: <path d="M2 12h3.5l2-5 3.5 11 3-8 2 2H22" />,
  cotacao: <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  loteria: <><rect x="3" y="6" width="18" height="12" rx="2.5" /><circle cx="8.5" cy="12" r="1.6" /><circle cx="15.5" cy="12" r="1.6" /></>,
  horoscopo: <><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /><path d="M17 3.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" /></>,
}

// item do painel: barra ou ícone na cor da editoria; a aberta fica marcada em dourado
function ItemPainel({ it, ativo }) {
  return (
    <Link
      href={it.href}
      aria-current={ativo ? 'page' : undefined}
      className="menu-item"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '12px 14px',
        borderRadius: 12,
        fontSize: 15,
        fontWeight: 700,
        color: ativo ? '#FFB300' : 'rgba(255,255,255,0.88)',
        background: ativo ? 'rgba(255,179,0,0.10)' : 'rgba(255,255,255,0.035)',
        border: `1px solid ${ativo ? 'rgba(255,179,0,0.45)' : 'rgba(255,255,255,0.07)'}`,
        textDecoration: 'none',
      }}
    >
      {it.icone ? (
        <span style={{ width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center', background: `${it.cor}22`, color: it.cor, flex: '0 0 auto' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONES[it.icone]}</svg>
        </span>
      ) : (
        <span style={{ width: 4, height: 20, borderRadius: 4, background: it.cor, flex: '0 0 auto' }} />
      )}
      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.label}</span>
    </Link>
  )
}

// serviço no painel: bloco com ícone em cima e nome embaixo (mais leve que uma lista longa)
function ServicoPainel({ it, ativo }) {
  return (
    <Link
      href={it.href}
      aria-current={ativo ? 'page' : undefined}
      className="menu-item"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '14px 8px 12px',
        borderRadius: 14,
        fontSize: 13,
        fontWeight: 700,
        textAlign: 'center',
        color: ativo ? '#FFB300' : 'rgba(255,255,255,0.88)',
        background: ativo ? 'rgba(255,179,0,0.10)' : 'rgba(255,255,255,0.035)',
        border: `1px solid ${ativo ? 'rgba(255,179,0,0.45)' : 'rgba(255,255,255,0.07)'}`,
        textDecoration: 'none',
      }}
    >
      <span style={{ width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', background: `${it.cor}22`, color: it.cor }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONES[it.icone]}</svg>
      </span>
      {it.label}
    </Link>
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
