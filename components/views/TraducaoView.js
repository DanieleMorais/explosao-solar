import Link from 'next/link'
import BannerAdsterra from '@/components/BannerAdsterra'
import CtaFixo from '@/components/CtaFixo'
import { t, catColor } from '@/lib/tokens'
import { SITE } from '@/lib/site'
import { NOME_IDIOMA, HREFLANG, LANG_SCHEMA, direcao, caminhoLista } from '@/lib/idiomas'
import { caminhoArtigo } from '@/lib/blogSlug'
import { dicBlog, preencher, dataNoticia, urlAbsoluta, jsonLd, creditoImagem } from '@/lib/blogDic'
import { relacionadas, ptDoSlug, contaPalavras } from '@/lib/traducoes'

// Matéria traduzida (blog em 12 idiomas). Mesma diagramação da ArticleView em português, com TODO o texto no idioma:
// moldura do lib/blogDic.js, matéria de content/i18n. Foto, crédito, autor e fonte vêm da matéria PT original.
const enc = encodeURIComponent
const REDES = [
  { nome: 'WhatsApp', bg: '#25D366', href: (url, titulo) => `https://wa.me/?text=${enc(`${titulo} — ${url}`)}` },
  { nome: 'X', bg: '#131417', href: (url, titulo) => `https://twitter.com/intent/tweet?text=${enc(titulo)}&url=${enc(url)}` },
  { nome: 'Facebook', bg: '#1877F2', href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
]

function Compartilhar({ url, titulo, d }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: t.muted, letterSpacing: 1, textTransform: 'uppercase', marginInlineEnd: 4 }}>{d.compartilhar}</span>
      {REDES.map((r) => (
        <a
          key={r.nome}
          href={r.href(url, titulo)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
          aria-label={preencher(d.compartilharEm, { rede: r.nome })}
          style={{ background: r.bg, color: '#fff', fontSize: 12.5, fontWeight: 700, padding: '7px 14px', borderRadius: 999, display: 'inline-block' }}
        >
          {r.nome}
        </a>
      ))}
    </div>
  )
}

export default function TraducaoView({ lang, doc, pt, versoes }) {
  const d = dicBlog(lang)
  const cor = catColor(doc.categoria)
  const categoria = d.categorias[doc.categoria] || doc.categoria
  const url = urlAbsoluta(caminhoArtigo(lang, doc.slugIdioma))
  const urlPt = urlAbsoluta(caminhoArtigo('pt', doc.slug))
  const lista = caminhoLista(lang)
  const outras = relacionadas(doc, 3)
  // o PT e as outras traduções no ar desta matéria (o cabeçalho lê o mapa para trocar de idioma na MESMA matéria)
  const mapa = { pt: caminhoArtigo('pt', doc.slug), ...Object.fromEntries(Object.entries(versoes).map(([i, s]) => [i, caminhoArtigo(i, s)])) }
  const versoesOutras = Object.entries(mapa).filter(([i]) => i !== lang)

  const artigoLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: doc.titulo,
    description: doc.descricao,
    inLanguage: LANG_SCHEMA[lang],
    datePublished: pt.publicadoEm,
    dateModified: doc.publicadoEm || pt.publicadoEm,
    articleSection: categoria,
    keywords: (doc.palavrasChave || []).join(', '),
    mainEntityOfPage: url,
    ...(pt.imagem ? { image: [pt.imagem] } : {}),
    wordCount: contaPalavras(doc.conteudo),
    timeRequired: `PT${doc.tempoLeitura}M`,
    isAccessibleForFree: true,
    translationOfWork: { '@type': 'NewsArticle', '@id': urlPt, url: urlPt, inLanguage: 'pt-BR' },
    author: { '@type': 'Organization', name: pt.autor, url: SITE.url },
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url, logo: { '@type': 'ImageObject', url: `${SITE.url}/logo.png`, width: 600, height: 60 } },
  }
  const trilhaLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: d.noticias, item: urlAbsoluta(lista) },
      { '@type': 'ListItem', position: 2, name: doc.titulo, item: url },
    ],
  }

  return (
    <article lang={lang} dir={direcao(lang)} style={{ paddingTop: 34 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(artigoLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(trilhaLd) }} />
      <script type="application/json" id="es-versoes" dangerouslySetInnerHTML={{ __html: jsonLd(mapa) }} />

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 20px' }}>
        <nav aria-label={d.noticias} style={{ fontSize: 13, color: t.muted, marginBottom: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href={lista} className="hoverlink">
            {d.noticias}
          </Link>
          <span aria-hidden="true">›</span>
          <span style={{ color: cor, fontWeight: 700 }}>{categoria}</span>
        </nav>

        <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, lineHeight: 1.15, letterSpacing: -0.5, marginBottom: 16 }}>{doc.titulo}</h1>
        <p style={{ fontFamily: 'var(--font-serif), serif', fontSize: 'clamp(17px, 2.4vw, 21px)', color: t.inkSoft, lineHeight: 1.55, marginBottom: 24 }}>
          {doc.descricao}
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
            <strong style={{ color: t.ink }}>{pt.autor}</strong>
            <br />
            {d.publicadoEm} {dataNoticia(pt.publicadoEm, lang)} · {preencher(d.leitura, doc.tempoLeitura)}
          </div>
          <Compartilhar url={url} titulo={doc.titulo} d={d} />
        </div>

        {pt.imagem && (
          <figure style={{ margin: '0 0 30px' }}>
            <img src={pt.imagem} alt={doc.titulo} loading="eager" style={{ width: '100%', height: 'auto', borderRadius: 10, display: 'block', background: '#F1EFE8' }} />
            {pt.imagemCredito && (
              <figcaption style={{ fontSize: 12, color: t.muted, marginTop: 8, lineHeight: 1.45 }}>
                {d.imagem}:{' '}
                {pt.imagemCreditoUrl ? (
                  <a href={pt.imagemCreditoUrl} target="_blank" rel="noopener noreferrer nofollow" className="hoverlink" style={{ color: t.muted }}>
                    {creditoImagem(pt.imagemCredito, lang)}
                  </a>
                ) : (
                  creditoImagem(pt.imagemCredito, lang)
                )}
              </figcaption>
            )}
          </figure>
        )}

        <BannerAdsterra formato="faixa" lang={lang} />

        <div className="prose" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }} dangerouslySetInnerHTML={{ __html: doc.conteudo }} />

        <BannerAdsterra formato="quadrado" lang={lang} />

        {pt.fonteUrl && (
          <p style={{ fontSize: 13, color: t.muted, marginTop: 26, paddingTop: 14, borderTop: `1px solid ${t.line}` }}>
            {d.fonte}:{' '}
            <a href={pt.fonteUrl} target="_blank" rel="noopener noreferrer nofollow" className="hoverlink" style={{ color: t.sun, fontWeight: 600 }}>
              {pt.fonteNome || pt.fonteUrl}
            </a>
          </p>
        )}

        {(doc.palavrasChave || []).length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '30px 0' }}>
            {doc.palavrasChave.map((p) => (
              <span key={p} style={{ fontSize: 12.5, fontWeight: 600, color: t.inkSoft, background: '#F1EFE8', border: `1px solid ${t.line}`, padding: '6px 14px', borderRadius: 999 }}>
                #{p}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '0 0 12px', fontSize: 13 }}>
          <span style={{ color: t.muted, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: 12 }}>{d.tambemEm}</span>
          {versoesOutras.map(([i, href]) => (
            <Link
              key={i}
              href={href}
              hrefLang={HREFLANG[i]}
              lang={HREFLANG[i]}
              className="hoverlink"
              style={{ border: `1px solid ${t.line}`, borderRadius: 999, padding: '5px 14px', fontWeight: 700, color: t.inkSoft }}
            >
              {NOME_IDIOMA[i]}
            </Link>
          ))}
        </div>
        <p style={{ fontSize: 12.5, color: t.muted, marginBottom: 30 }}>{d.traduzidoDe}.</p>

        <div style={{ borderTop: `1px solid ${t.line}`, paddingTop: 18, marginBottom: 46, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Compartilhar url={url} titulo={doc.titulo} d={d} />
          <Link href={lista} className="btn" style={{ background: t.dark, color: '#fff', fontWeight: 800, fontSize: 14, padding: '11px 20px', borderRadius: 999, whiteSpace: 'nowrap' }}>
            {d.maisNoticias}
          </Link>
        </div>
      </div>

      {outras.length > 0 && (
        <aside style={{ maxWidth: t.maxW, margin: '0 auto', padding: t.pad }} aria-label={d.leiaTambem}>
          <h2 style={{ fontSize: 20, fontWeight: 900, textTransform: 'uppercase', letterSpacing: -0.2, borderBottom: `2px solid ${t.ink}`, paddingBottom: 10, marginBottom: 20 }}>
            {d.leiaTambem}
          </h2>
          <div className="es-relacionadas">
            {outras.map((o) => {
              const opt = ptDoSlug(o.slug)
              return (
                <Link
                  key={o.slug}
                  href={caminhoArtigo(lang, o.slugIdioma)}
                  className="card"
                  style={{ display: 'flex', gap: 14, alignItems: 'center', background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radiusSm, padding: 12, boxShadow: t.shadow }}
                >
                  {opt?.imagem && (
                    <img src={opt.imagem} alt="" loading="lazy" style={{ width: 92, height: 70, objectFit: 'cover', borderRadius: 7, flexShrink: 0, background: '#F1EFE8' }} />
                  )}
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: catColor(o.categoria) }}>
                      {d.categorias[o.categoria] || o.categoria}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.35, color: t.ink }}>{o.titulo}</span>
                  </span>
                </Link>
              )
            })}
          </div>
        </aside>
      )}

      <CtaFixo href={lista} rotulo={d.maisNoticias} lang={lang} />
    </article>
  )
}
