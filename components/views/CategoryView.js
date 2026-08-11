import { notFound } from 'next/navigation'
import { getByCategory, getCategory, SITE } from '@/lib/content'
import { Card } from '@/components/ArticleCard'
import { t, catColor } from '@/lib/tokens'
import { withLang } from '@/lib/site'
import { ui } from '@/lib/i18n'

export default function CategoryView({ lang = 'pt', categoria }) {
  const cat = getCategory(categoria, lang)
  if (!cat) notFound()

  const articles = getByCategory(categoria, lang)
  const color = catColor(categoria)
  const txt = ui(lang)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${cat.name} | ${SITE.name}`,
    description: cat.description,
    url: `${SITE.url}${withLang(lang, `/${categoria}`)}`,
    inLanguage: lang === 'pt' ? 'pt-BR' : lang,
    hasPart: articles.slice(0, 20).map((a) => ({
      '@type': 'NewsArticle',
      headline: a.title,
      url: `${SITE.url}${withLang(lang, `/noticia/${a.slug}`)}`,
      datePublished: a.publishedAt,
    })),
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section
        style={{
          background: `radial-gradient(110% 160% at 85% -20%, ${color}66, transparent 55%), linear-gradient(135deg, ${color} 0%, #101322 80%)`,
          color: '#fff',
          padding: '46px 0 42px',
        }}
      >
        <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: t.pad }}>
          <p style={{ fontSize: 12, letterSpacing: 2.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>
            {txt.editorial}
          </p>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 44px)', fontWeight: 900, letterSpacing: -0.8, marginBottom: 10 }}>{cat.name}</h1>
          <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.8)', maxWidth: 620, lineHeight: 1.6 }}>{cat.description}</p>
        </div>
      </section>

      <section style={{ maxWidth: t.maxW, margin: '0 auto', padding: 'clamp(20px, 3vw, 56px)', paddingBottom: 0 }}>
        {articles.length ? (
          <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
            {articles.map((a) => (
              <Card key={a.slug} article={a} lang={lang} />
            ))}
          </div>
        ) : (
          <p style={{ color: t.muted, fontSize: 15 }}>{txt.soon}</p>
        )}
      </section>
    </div>
  )
}
