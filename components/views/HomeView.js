import Link from 'next/link'
import { getAllArticles, getByCategory, CATEGORIES, SITE, SITE_DESCRIPTIONS, SITE_TITLES } from '@/lib/content'
import { HeroCard, Card, RowCard } from '@/components/ArticleCard'
import NewsletterBox from '@/components/NewsletterBox'
import AlertasPush from '@/components/AlertasPush'
import { t, catColor } from '@/lib/tokens'
import { withLang } from '@/lib/site'
import { ui, catLabel } from '@/lib/i18n'

const wrap = { maxWidth: t.maxW, margin: '0 auto', padding: t.pad }

function SectionTitle({ children, color = null, href = null, seeAll }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18, borderBottom: `2px solid ${color || t.ink}`, paddingBottom: 10 }}>
      <h2 style={{ fontSize: 21, fontWeight: 900, letterSpacing: -0.3, color: color || t.ink, textTransform: 'uppercase' }}>{children}</h2>
      {href && (
        <Link href={href} className="hoverlink" style={{ fontSize: 13, fontWeight: 700, color: t.muted }}>
          {seeAll}
        </Link>
      )}
    </div>
  )
}

export default function HomeView({ lang = 'pt' }) {
  const all = getAllArticles(lang)
  const txt = ui(lang)
  if (!all.length) return null

  const [hero, ...rest] = all
  const secondary = rest.slice(0, 2)
  const latest = rest.slice(2, 9)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: SITE_TITLES[lang],
    description: SITE_DESCRIPTIONS[lang],
    url: `${SITE.url}${withLang(lang, '')}` || SITE.url,
    inLanguage: lang === 'pt' ? 'pt-BR' : lang,
  }

  return (
    <div style={{ paddingTop: 28 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section style={wrap} aria-label="destaques">
        <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <HeroCard article={hero} lang={lang} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {secondary.map((a) => (
              <Card key={a.slug} article={a} lang={lang} />
            ))}
          </div>
        </div>
      </section>

      {latest.length > 0 && (
        <section style={{ ...wrap, marginTop: 44 }} aria-label={txt.latest}>
          <SectionTitle href={withLang(lang, '/busca')} seeAll={txt.seeAll}>
            {txt.latest}
          </SectionTitle>
          <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 12 }}>
            {latest.map((a, i) => (
              <RowCard key={a.slug} article={a} index={i} lang={lang} />
            ))}
          </div>
        </section>
      )}

      <section style={{ ...wrap, marginTop: 32 }}>
        <AlertasPush />
      </section>

      <section style={{ ...wrap, marginTop: 48 }}>
        <NewsletterBox lang={lang} />
      </section>

      {CATEGORIES.map((c) => {
        const arts = getByCategory(c.slug, lang)
        if (!arts.length) return null
        return (
          <section key={c.slug} style={{ ...wrap, marginTop: 48 }} aria-label={catLabel(lang, c.slug)}>
            <SectionTitle color={catColor(c.slug)} href={withLang(lang, `/${c.slug}`)} seeAll={txt.seeAll}>
              {catLabel(lang, c.slug)}
            </SectionTitle>
            <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 20 }}>
              {arts.slice(0, 4).map((a) => (
                <Card key={a.slug} article={a} lang={lang} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
