'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import SunLogo from './SunLogo'
import { t } from '@/lib/tokens'
import { casca } from '@/lib/blogCasca'
import { LOCALE_DATA, SIGLA_IDIOMA, NOME_IDIOMA, HREFLANG, direcao, caminhoLista } from '@/lib/idiomas'

// Cabeçalho das páginas nos 9 idiomas novos (fr de it nl ru zh ja ko ar): mesmo visual do Header, todo no idioma. Lá só
// existem a lista e as matérias traduzidas, então não há editorias, busca nem clima; a marca leva à lista do idioma.
// Botões de idioma: PT, EN, ES e o atual; numa matéria, cada um leva à versão DELA (#es-versoes), senão à capa do idioma.
const PADRAO = { pt: '/', en: '/en', es: '/es' }
// no celular a faixa de baixo sai (a marca e o botão fixo já levam à lista): o topo fixo fica com 2 linhas, não 3
const CSS = '@media (max-width: 900px){.es-cab-nav{display:none}}'

export default function CabecalhoIdioma({ idioma, pathname, versoes }) {
  const c = casca(idioma)
  const [hoje, setHoje] = useState('')
  useEffect(() => {
    // no celular a data longa não cabe ao lado dos idiomas (mesma regra do Header): versão curta sem o ano
    const curta = window.matchMedia('(max-width: 480px)').matches
    setHoje(new Date().toLocaleDateString(LOCALE_DATA[idioma], curta ? { weekday: 'short', day: 'numeric', month: 'long' } : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
  }, [idioma])

  const lista = caminhoLista(idioma)
  const chip = (ativo) => ({
    padding: '2px 8px',
    borderRadius: 5,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.5,
    border: '1px solid rgba(255,255,255,0.2)',
    background: ativo ? t.sunGrad : 'transparent',
    color: ativo ? '#131417' : 'rgba(255,255,255,0.7)',
  })

  return (
    <header dir={direcao(idioma)} lang={idioma} style={{ background: t.dark, color: '#fff', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 20px rgba(0,0,0,0.35)' }}>
      <style>{CSS}</style>
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
            {hoje || ' '}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 0 auto' }}>
            <span className="hide-mobile" style={{ letterSpacing: 0.4 }}>{c.topbar}</span>
            <span style={{ display: 'flex', gap: 4 }} dir="ltr">
              {['pt', 'en', 'es', idioma].map((code) => (
                <Link
                  key={code}
                  href={versoes?.[code] || (code === idioma ? pathname : PADRAO[code])}
                  hrefLang={HREFLANG[code]}
                  className="chipnav"
                  aria-label={NOME_IDIOMA[code]}
                  style={chip(code === idioma)}
                >
                  {SIGLA_IDIOMA[code]}
                </Link>
              ))}
            </span>
          </span>
        </div>
      </div>

      <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: '14px clamp(20px, 3vw, 56px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <Link href={lista} style={{ display: 'flex', alignItems: 'center', gap: 12 }} aria-label="Explosão Solar">
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
                whiteSpace: 'nowrap',
              }}
            >
              Explosão Solar
            </span>
            {/* topo-frase: some no celular, como no Header (em maiúsculas espaçadas quebrava em duas linhas) */}
            <span className="topo-frase" style={{ fontSize: 10.5, letterSpacing: 2, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginTop: 4 }}>{c.tagline}</span>
          </span>
        </Link>
      </div>

      <nav aria-label={c.noticias} className="es-cab-nav" style={{ borderTop: `1px solid ${t.darkLine}` }}>
        <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: '10px clamp(20px, 3vw, 56px)', display: 'flex', gap: 8 }}>
          <Link
            href={lista}
            className="chipnav"
            style={{
              padding: '7px 15px',
              borderRadius: 999,
              fontSize: 13.5,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              border: pathname === lista ? '1px solid transparent' : '1px solid rgba(255,255,255,0.18)',
              background: pathname === lista ? t.sunGrad : 'transparent',
              color: pathname === lista ? '#131417' : 'rgba(255,255,255,0.78)',
            }}
          >
            {c.noticias}
          </Link>
        </div>
      </nav>
    </header>
  )
}
