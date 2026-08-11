import Link from 'next/link'
import { t, catColor } from '@/lib/tokens'
import { formatDateShort } from '@/lib/format'
import { withLang } from '@/lib/site'
import { ui, catLabel } from '@/lib/i18n'

const LOCALE = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }

function articleHref(lang, slug) {
  return withLang(lang, `/noticia/${slug}`)
}

function Meta({ article, lang, light = false }) {
  return (
    <span style={{ fontSize: 12.5, color: light ? 'rgba(255,255,255,0.72)' : t.muted, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      <span>{formatDateShort(article.publishedAt, LOCALE[lang])}</span>
      <span aria-hidden="true">•</span>
      <span>
        {article.readingMinutes} {ui(lang).minRead}
      </span>
    </span>
  )
}

export function HeroCard({ article, lang = 'pt' }) {
  const color = catColor(article.categorySlug)
  return (
    <Link
      href={articleHref(lang, article.slug)}
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        minHeight: 380,
        borderRadius: t.radius,
        padding: 'clamp(22px, 4vw, 36px)',
        background: `radial-gradient(120% 140% at 85% -10%, ${color}55, transparent 55%), linear-gradient(140deg, ${color} 0%, #101322 78%)`,
        color: '#fff',
        boxShadow: t.shadow,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <span
        style={{
          alignSelf: 'flex-start',
          background: 'rgba(255,255,255,0.94)',
          color,
          fontWeight: 800,
          fontSize: 11.5,
          letterSpacing: 1.6,
          textTransform: 'uppercase',
          padding: '5px 12px',
          borderRadius: 999,
          marginBottom: 16,
        }}
      >
        {catLabel(lang, article.categorySlug)}
      </span>
      <h2 style={{ fontSize: 'clamp(24px, 3.6vw, 38px)', fontWeight: 900, lineHeight: 1.15, letterSpacing: -0.5, marginBottom: 12 }}>
        {article.title}
      </h2>
      <p style={{ fontSize: 'clamp(14px, 1.6vw, 16.5px)', color: 'rgba(255,255,255,0.82)', lineHeight: 1.55, maxWidth: 640, marginBottom: 14 }}>
        {article.subtitle}
      </p>
      <Meta article={article} lang={lang} light />
    </Link>
  )
}

export function Card({ article, lang = 'pt', compact = false }) {
  const color = catColor(article.categorySlug)
  return (
    <Link
      href={articleHref(lang, article.slug)}
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: t.card,
        borderRadius: t.radius,
        border: `1px solid ${t.line}`,
        borderTop: `4px solid ${color}`,
        padding: compact ? '18px 20px' : '22px 24px',
        boxShadow: t.shadow,
        height: '100%',
      }}
    >
      <span style={{ color, fontWeight: 800, fontSize: 11.5, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 10 }}>
        {catLabel(lang, article.categorySlug)}
      </span>
      <h3 style={{ fontSize: compact ? 16.5 : 19, fontWeight: 800, lineHeight: 1.3, letterSpacing: -0.2, marginBottom: 10, color: t.ink }}>
        {article.title}
      </h3>
      {!compact && (
        <p
          style={{
            fontSize: 14.2,
            color: t.inkSoft,
            lineHeight: 1.6,
            marginBottom: 14,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {article.excerpt}
        </p>
      )}
      <div style={{ marginTop: 'auto' }}>
        <Meta article={article} lang={lang} />
      </div>
    </Link>
  )
}

export function RowCard({ article, index, lang = 'pt' }) {
  const color = catColor(article.categorySlug)
  return (
    <Link
      href={articleHref(lang, article.slug)}
      className="card"
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        background: t.card,
        borderRadius: t.radiusSm,
        border: `1px solid ${t.line}`,
        padding: '16px 18px',
        boxShadow: t.shadow,
      }}
    >
      {typeof index === 'number' && (
        <span
          style={{
            fontWeight: 900,
            fontSize: 26,
            lineHeight: 1,
            background: t.sunGrad,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            minWidth: 30,
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
      )}
      <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ color, fontWeight: 800, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase' }}>
          {catLabel(lang, article.categorySlug)}
        </span>
        <span style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.35, color: t.ink }}>{article.title}</span>
        <Meta article={article} lang={lang} />
      </span>
    </Link>
  )
}
