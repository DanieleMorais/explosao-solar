'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { t } from '@/lib/tokens'
import { langFromPath, withLang } from '@/lib/site'
import { ui } from '@/lib/i18n'
import { idiomaDaRota, rotaInstitucional } from '@/lib/idiomas'
import { casca } from '@/lib/blogCasca'

const KEY = 'es-consent'

export default function CookieBanner() {
  const pathname = usePathname()
  const lang = langFromPath(pathname)
  // nos 9 idiomas novos o aviso sai no idioma (lib/blogCasca.js) e a política é a da versão em inglês
  const idioma = idiomaDaRota(pathname)
  const c = casca(idioma)
  const txt = c
    ? { cookieTitle: c.cookieTitulo, cookieText: c.cookieTexto, cookiePolicy: c.cookiePolitica, cookieAccept: c.cookieAceitar, cookieEssential: c.cookieEssenciais }
    : ui(lang)
  const politica = c ? rotaInstitucional(idioma, '/politica-de-cookies') : withLang(lang, '/politica-de-cookies')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(KEY)) return
    // Onde vale a GDPR (Europa), o CMP do Moneytizer já mostra o aviso dele: não
    // empilhar dois banners. Sem resposta do CMP em 2,5 s, mostra o nosso (LGPD).
    let decidido = false
    const mostrar = () => {
      if (!decidido) {
        decidido = true
        setVisible(true)
      }
    }
    const espera = setTimeout(mostrar, 2500)
    if (typeof window.__tcfapi === 'function') {
      // addEventListener fica na fila do "stub" e só responde quando o CMP de verdade
      // carregou e sabe se a GDPR vale para este visitante (um 'ping' cedo vem vazio).
      window.__tcfapi('addEventListener', 2, (tcData, ok) => {
        if (!ok || !tcData || decidido) return
        clearTimeout(espera)
        if (tcData.gdprApplies === true) decidido = true
        else mostrar()
        if (tcData.listenerId !== undefined) window.__tcfapi('removeEventListener', 2, () => {}, tcData.listenerId)
      })
    }
    return () => clearTimeout(espera)
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
      className="es-aviso-cookie"
      aria-label={c ? c.cookieAria : lang === 'en' ? 'Cookie notice' : 'Aviso de cookies'}
      lang={c ? idioma : undefined}
      dir={idioma === 'ar' ? 'rtl' : undefined}
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
        <Link href={politica} style={{ color: '#FFB300', textDecoration: 'underline' }}>
          {txt.cookiePolicy}
        </Link>
        {c ? c.cookieFim : '.'}
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
