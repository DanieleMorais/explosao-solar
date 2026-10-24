'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SunLogo from './SunLogo'
import RodapeIdioma from './RodapeIdioma'
import { t } from '@/lib/tokens'
import { CATEGORIES, SITE, SITE_DESCRIPTIONS, INSTITUTIONAL_LINKS, langFromPath, withLang } from '@/lib/site'
import { ui, catLabel } from '@/lib/i18n'
import { idiomaDaRota, ehIdiomaNovo } from '@/lib/idiomas'

export default function Footer() {
  const pathname = usePathname()
  const lang = langFromPath(pathname)
  const txt = ui(lang)
  // fr, de, it, nl, ru, zh, ja, ko, ar: rodapé próprio, todo no idioma
  const idioma = idiomaDaRota(pathname)
  if (ehIdiomaNovo(idioma)) return <RodapeIdioma idioma={idioma} />
  // matérias do blog em inglês/espanhol: sem emoji (regra das páginas traduzidas); o resto do site fica como estava
  const feitoPor = /^\/(en|es)\/noticia(\/|$)/.test(pathname) ? txt.madeBy.replace(/\s*\p{Extended_Pictographic}️?/gu, '') : txt.madeBy

  return (
    <footer style={{ background: t.dark, color: 'rgba(255,255,255,0.72)', marginTop: 56 }}>
      <div style={{ height: 3, background: t.sunGrad }} />
      <div
        className="grid-1-mobile"
        style={{
          maxWidth: t.maxW,
          margin: '0 auto',
          padding: '48px clamp(20px, 3vw, 56px) 36px',
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr 1.2fr',
          gap: 40,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <SunLogo size={30} />
            <span
              style={{
                fontWeight: 900,
                fontSize: 19,
                textTransform: 'uppercase',
                letterSpacing: -0.3,
                background: t.sunGrad,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Explosão Solar
            </span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 420 }}>{SITE_DESCRIPTIONS[lang]}</p>
          <p style={{ fontSize: 13.5, marginTop: 16 }}>
            {txt.contact}:{' '}
            <a href={`mailto:${SITE.email}`} className="hoverlink" style={{ color: '#FFB300', fontWeight: 600 }}>
              {SITE.email}
            </a>
          </p>
        </div>

        <nav aria-label={txt.editorials}>
          <h3 style={{ color: '#fff', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>{txt.editorials}</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={withLang(lang, `/${c.slug}`)} className="hoverlink" style={{ fontSize: 14 }}>
                  {catLabel(lang, c.slug)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={txt.institutional}>
          <h3 style={{ color: '#fff', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>{txt.institutional}</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {INSTITUTIONAL_LINKS[lang].map((l) => (
              <li key={l.href}>
                <Link href={withLang(lang, l.href)} className="hoverlink" style={{ fontSize: 14 }}>
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div style={{ borderTop: `1px solid ${t.darkLine}` }}>
        <div
          style={{
            maxWidth: t.maxW,
            margin: '0 auto',
            padding: '18px clamp(20px, 3vw, 56px)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            justifyContent: 'space-between',
            fontSize: 12.5,
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          <span>© 2026 Explosão Solar · {txt.rights} · {feitoPor}</span>
          <span>explosaosolar.com</span>
        </div>
      </div>
    </footer>
  )
}
