import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getArticle, getRelated, articleLangs, formatDate, SITE } from '@/lib/content'
import { Card } from '@/components/ArticleCard'
import ShareButtons from '@/components/ShareButtons'
import { t, catColor } from '@/lib/tokens'
import { withLang } from '@/lib/site'
import { ui, catLabel, LANGS } from '@/lib/i18n'

const LOCALE = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }

export default function ArticleView({ lang = 'pt', slug }) {
  const article = getArticle(slug, lang)
  if (!article) notFound()

  const txt = ui(lang)
  const color = catColor(article.categorySlug)
  const url = `${SITE.url}${withLang(lang, `/noticia/${article.slug}`)}`
  const related = getRelated(article, 3, lang)
  const langs = articleLangs(article.slug)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: txt.home, item: `${SITE.url}${withLang(lang, '')}` || SITE.url },
      { '@type': 'ListItem', position: 2, name: catLabel(lang, article.categorySlug), item: `${SITE.url}${withLang(lang, `/${article.categorySlug}`)}` },
      { '@type': 'ListItem', position: 3, name: article.title, item: url },
    ],
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    inLanguage: lang === 'pt' ? 'pt-BR' : lang,
    articleSection: catLabel(lang, article.categorySlug),
    keywords: (article.tags || []).join(', '),
    mainEntityOfPage: url,
    image: [`${url}/opengraph-image`],
    wordCount: article.contentHtml.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length,
    timeRequired: `PT${article.readingMinutes}M`,
    isAccessibleForFree: true,
    author: { '@type': 'Organization', name: article.author, url: SITE.url },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
      logo: { '@type': 'ImageObject', url: `${SITE.url}/logo.png`, width: 600, height: 60 },
    },
  }

  return (
    <article style={{ paddingTop: 34 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 20px' }}>
        <nav aria-label="breadcrumb" style={{ fontSize: 13, color: t.muted, marginBottom: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href={withLang(lang, '/') || '/'} className="hoverlink">
            {txt.home}
          </Link>
          <span aria-hidden="true">›</span>
          <Link href={withLang(lang, `/${article.categorySlug}`)} className="hoverlink" style={{ color, fontWeight: 700 }}>
            {catLabel(lang, article.categorySlug)}
          </Link>
        </nav>

        <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, lineHeight: 1.12, letterSpacing: -0.8, marginBottom: 16 }}>
          {article.title}
        </h1>
        <p style={{ fontFamily: 'var(--font-serif), serif', fontSize: 'clamp(17px, 2.4vw, 21px)', color: t.inkSoft, lineHeight: 1.55, marginBottom: 24 }}>
          {article.subtitle}
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
            borderTop: `1px solid ${t.line}`,
            borderBottom: `1px solid ${t.line}`,
            padding: '14px 0',
            marginBottom: 30,
          }}
        >
          <div style={{ fontSize: 13.5, color: t.muted, lineHeight: 1.5 }}>
            <strong style={{ color: t.ink }}>{article.author}</strong>
            <br />
            {formatDate(article.publishedAt, LOCALE[lang])} · {article.readingMinutes} {txt.minRead}
          </div>
          <ShareButtons url={url} title={article.title} lang={lang} />
        </div>

        <div className="prose" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }} dangerouslySetInnerHTML={{ __html: article.contentHtml }} />

        {article.sourceUrl && (
          <p style={{ fontSize: 13, color: t.muted, marginTop: 26, paddingTop: 14, borderTop: `1px solid ${t.line}` }}>
            {lang === 'en' ? 'Source' : lang === 'es' ? 'Fuente' : 'Fonte'}:{' '}
            <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="hoverlink" style={{ color: t.sun, fontWeight: 600 }}>
              {article.sourceName}
            </a>
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '34px 0' }}>
          {(article.tags || []).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: t.inkSoft,
                background: '#F1EFE8',
                border: `1px solid ${t.line}`,
                padding: '6px 14px',
                borderRadius: 999,
              }}
            >
              #{tag}
            </span>
          ))}
        </div>

        {langs.length > 1 && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 26, fontSize: 13 }}>
            <span style={{ color: t.muted, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: 12 }}>
              {lang === 'en' ? 'Also in' : lang === 'es' ? 'También en' : 'Também em'}
            </span>
            {langs
              .filter((l) => l !== lang)
              .map((l) => (
                <Link
                  key={l}
                  href={withLang(l, `/noticia/${article.slug}`)}
                  hrefLang={LANGS[l].code}
                  className="hoverlink"
                  style={{ border: `1px solid ${t.line}`, borderRadius: 999, padding: '5px 14px', fontWeight: 700, color: t.inkSoft }}
                >
                  {LANGS[l].name}
                </Link>
              ))}
          </div>
        )}

        <div style={{ borderTop: `1px solid ${t.line}`, paddingTop: 18, marginBottom: 46 }}>
          <ShareButtons url={url} title={article.title} lang={lang} />
        </div>
      </div>

      <aside style={{ maxWidth: t.maxW, margin: '0 auto', padding: t.pad }} aria-label={txt.readAlso}>
        <h2 style={{ fontSize: 20, fontWeight: 900, textTransform: 'uppercase', letterSpacing: -0.2, borderBottom: `2px solid ${t.ink}`, paddingBottom: 10, marginBottom: 20 }}>
          {txt.readAlso}
        </h2>
        <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {related.map((a) => (
            <Card key={a.slug} article={a} lang={lang} compact />
          ))}
        </div>
      </aside>
    </article>
  )
}
