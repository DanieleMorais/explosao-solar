import Link from 'next/link'
import { getAllArticles, getByCategory, CATEGORIES, SITE, SITE_DESCRIPTIONS, SITE_TITLES } from '@/lib/content'
import { HeroCard, Card } from '@/components/ArticleCard'
import NewsletterBox from '@/components/NewsletterBox'
import AlertasPush from '@/components/AlertasPush'
import { cotacoes, formatarBRL } from '@/lib/cotacoes'
import { t, catColor } from '@/lib/tokens'
import { withLang } from '@/lib/site'
import { ui, catLabel } from '@/lib/i18n'

const wrap = { maxWidth: t.maxW, margin: '0 auto', padding: t.pad }

// linha compacta: miniatura + manchete (padrão portal)
function MiniLinha({ a, lang, tag }) {
  const cor = catColor(a.categorySlug)
  return (
    <Link href={withLang(lang, `/noticia/${a.slug}`)} className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', textDecoration: 'none', padding: '10px 0', borderBottom: `1px solid ${t.line}` }}>
      {a.imagem && (
        <span style={{ flexShrink: 0, width: 84, height: 60, borderRadius: 8, overflow: 'hidden', background: '#E7E4DB' }}>
          <img src={a.imagem} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </span>
      )}
      <span style={{ minWidth: 0 }}>
        {tag && <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: cor }}>{catLabel(lang, a.categorySlug)}</span>}
        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, lineHeight: 1.3, color: t.ink, marginTop: tag ? 2 : 0 }}>{a.title}</span>
      </span>
    </Link>
  )
}

function SectionTitle({ children, color, href, seeAll }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderLeft: `4px solid ${color || t.ink}`, paddingLeft: 10 }}>
      <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.2, color: color || t.ink, textTransform: 'uppercase' }}>{children}</h2>
      {href && <Link href={href} className="hoverlink" style={{ fontSize: 12.5, fontWeight: 700, color: t.muted }}>{seeAll}</Link>}
    </div>
  )
}

// widget de link pra utilidade (cotações/loterias/clima/horóscopo)
function WidgetLink({ href, emoji, titulo, sub }) {
  return (
    <Link href={href} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radiusSm, padding: '12px 14px' }}>
      <span style={{ fontSize: 24 }}>{emoji}</span>
      <span>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: t.ink }}>{titulo}</span>
        <span style={{ display: 'block', fontSize: 12, color: t.muted }}>{sub}</span>
      </span>
    </Link>
  )
}

export default async function HomeView({ lang = 'pt' }) {
  const all = getAllArticles(lang)
  const txt = ui(lang)
  if (!all.length) return null

  const [hero, ...rest] = all
  const secondary = rest.slice(0, 3)
  const maisLidas = rest.slice(3, 9)
  const cot = lang === 'pt' ? await cotacoes() : []
  const cotTop = cot.filter((c) => ['USD', 'EUR', 'BTC'].includes(c.code))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: SITE_TITLES[lang],
    description: SITE_DESCRIPTIONS[lang],
    url: `${SITE.url}${withLang(lang, '')}` || SITE.url,
    inLanguage: lang === 'pt' ? 'pt-BR' : lang,
  }

  const box = { background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, padding: '16px 18px', boxShadow: t.shadow }

  return (
    <div style={{ paddingTop: 22 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* MANCHETE */}
      <section style={wrap} aria-label="destaques">
        <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <HeroCard article={hero} lang={lang} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {secondary.map((a) => (
              <MiniLinha key={a.slug} a={a} lang={lang} tag />
            ))}
          </div>
        </div>
      </section>

      {/* CORPO: conteúdo + sidebar */}
      <div style={{ ...wrap, marginTop: 40, display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 34 }} className="home-grid">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.3fr) minmax(0, 1fr)', gap: 34 }} className="grid-1-mobile">
          {/* COLUNA PRINCIPAL */}
          <main>
            {CATEGORIES.map((c) => {
              const arts = getByCategory(c.slug, lang)
              if (!arts.length) return null
              const [lead, ...outros] = arts
              return (
                <section key={c.slug} style={{ marginBottom: 40 }} aria-label={catLabel(lang, c.slug)}>
                  <SectionTitle color={catColor(c.slug)} href={withLang(lang, `/${c.slug}`)} seeAll={txt.seeAll}>
                    {catLabel(lang, c.slug)}
                  </SectionTitle>
                  <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 22, alignItems: 'start' }}>
                    <Card article={lead} lang={lang} />
                    <div>
                      {outros.slice(0, 4).map((a) => (
                        <MiniLinha key={a.slug} a={a} lang={lang} />
                      ))}
                    </div>
                  </div>
                </section>
              )
            })}
          </main>

          {/* SIDEBAR */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Mais lidas */}
            <div style={box}>
              <h2 style={{ fontSize: 15, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 10, color: t.ink }}>🔥 {{ pt: 'Mais lidas', en: 'Most read', es: 'Más leídas' }[lang] || 'Mais lidas'}</h2>
              {maisLidas.map((a, i) => (
                <Link key={a.slug} href={withLang(lang, `/noticia/${a.slug}`)} className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', textDecoration: 'none', padding: '10px 0', borderTop: i === 0 ? 'none' : `1px solid ${t.line}` }}>
                  <span style={{ fontSize: 22, fontWeight: 900, lineHeight: 1, background: t.sunGrad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', minWidth: 24 }}>{i + 1}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.35, color: t.ink }}>{a.title}</span>
                </Link>
              ))}
            </div>

            {/* Utilidades */}
            {lang === 'pt' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cotTop.length > 0 && (
                  <div style={box}>
                    <h2 style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', marginBottom: 10, color: t.ink }}>💵 Cotações</h2>
                    {cotTop.map((c) => (
                      <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 13.5 }}>
                        <span style={{ fontWeight: 700, color: t.ink }}>{c.emoji} {c.nome.split(' ')[0]}</span>
                        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <strong>R$ {formatarBRL(c.valor, c.cripto ? 0 : 2)}</strong>
                          <span style={{ color: c.pct >= 0 ? '#16A34A' : '#DC2626', fontWeight: 700, fontSize: 12 }}>{c.pct >= 0 ? '▲' : '▼'}{Math.abs(c.pct).toFixed(1)}%</span>
                        </span>
                      </div>
                    ))}
                    <Link href="/cotacoes" className="hoverlink" style={{ fontSize: 12.5, color: t.sun, fontWeight: 700, display: 'inline-block', marginTop: 6 }}>Ver todas →</Link>
                  </div>
                )}
                <WidgetLink href="/terremotos" emoji="🌎" titulo="Terremotos ao vivo" sub="Abalos sísmicos no mundo agora" />
                <WidgetLink href="/loterias" emoji="🍀" titulo="Loterias" sub="Resultado da Mega-Sena e mais" />
                <WidgetLink href="/clima" emoji="🌤️" titulo="Clima" sub="Previsão da sua cidade" />
                <WidgetLink href="/horoscopo" emoji="🔮" titulo="Horóscopo do dia" sub="Os 12 signos de hoje" />
              </div>
            )}

            <AlertasPush />
            <NewsletterBox lang={lang} compact />
          </aside>
        </div>
      </div>
    </div>
  )
}
