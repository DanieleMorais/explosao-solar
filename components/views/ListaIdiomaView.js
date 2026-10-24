import Link from 'next/link'
import CtaFixo from '@/components/CtaFixo'
import { t, catColor } from '@/lib/tokens'
import { SITE } from '@/lib/site'
import { LANG_SCHEMA, direcao, caminhoLista } from '@/lib/idiomas'
import { caminhoArtigo } from '@/lib/blogSlug'
import { dicBlog, preencher, dataNoticia, urlAbsoluta, jsonLd } from '@/lib/blogDic'
import { traducoesPublicadas, ptDoSlug } from '@/lib/traducoes'

// Lista de matérias de um idioma (/en/noticia, /fr/noticia, /ar/noticia...). Vazia = noindex (metadata) com o convite
// para a edição completa em inglês (en/es: a edição do próprio idioma, que existe desde antes).
export default function ListaIdiomaView({ lang }) {
  const d = dicBlog(lang)
  const lista = traducoesPublicadas(lang)
  const url = urlAbsoluta(caminhoLista(lang))
  const edicao = lang === 'es' ? '/es' : '/en'
  const cta = lista.length ? { href: caminhoArtigo(lang, lista[0].slugIdioma), rotulo: d.lerMaisRecente } : { href: edicao, rotulo: d.ctaEdicao }
  // botões de idioma do cabeçalho: cada um leva à lista do idioma (PT = a capa, que é a lista do português)
  const mapa = { pt: '/', en: caminhoLista('en'), es: caminhoLista('es'), [lang]: caminhoLista(lang) }

  const paginaLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: d.listaTitulo,
    description: d.listaIntro,
    url,
    inLanguage: LANG_SCHEMA[lang],
    isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE.url },
    ...(lista.length
      ? {
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: lista.slice(0, 30).map((doc, i) => ({ '@type': 'ListItem', position: i + 1, url: urlAbsoluta(caminhoArtigo(lang, doc.slugIdioma)), name: doc.titulo })),
          },
        }
      : {}),
  }

  return (
    <div lang={lang} dir={direcao(lang)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(paginaLd) }} />
      <script type="application/json" id="es-versoes" dangerouslySetInnerHTML={{ __html: jsonLd(mapa) }} />

      <section style={{ background: `radial-gradient(120% 140% at 90% -10%, rgba(255,179,0,0.28), transparent 55%), ${t.dark}`, color: '#fff', padding: '44px 0 40px' }}>
        <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: t.pad }}>
          <p style={{ fontSize: 12, letterSpacing: 2.4, textTransform: 'uppercase', color: '#FFB300', marginBottom: 8, fontWeight: 800 }}>{SITE.name}</p>
          <h1 style={{ fontSize: 'clamp(28px, 4.6vw, 44px)', fontWeight: 900, letterSpacing: -0.6 }}>{d.listaTitulo}</h1>
          <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.75)', maxWidth: 680, lineHeight: 1.6, marginTop: 12 }}>{d.listaIntro}</p>
        </div>
      </section>

      <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: t.pad, paddingTop: 34, paddingBottom: 20 }}>
        {lista.length ? (
          <div className="es-grade-idioma">
            {lista.map((doc) => {
              const pt = ptDoSlug(doc.slug)
              const cor = catColor(doc.categoria)
              return (
                <Link
                  key={doc.slug}
                  href={caminhoArtigo(lang, doc.slugIdioma)}
                  className="card"
                  style={{ display: 'flex', flexDirection: 'column', background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, overflow: 'hidden', boxShadow: t.shadow, color: t.ink }}
                >
                  {pt?.imagem ? (
                    <img src={pt.imagem} alt="" loading="lazy" style={{ width: '100%', aspectRatio: '16 / 10', objectFit: 'cover', display: 'block', background: '#F1EFE8' }} />
                  ) : (
                    <span aria-hidden="true" style={{ display: 'block', aspectRatio: '16 / 10', background: `linear-gradient(140deg, ${cor} 0%, ${t.dark} 80%)` }} />
                  )}
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 16px 16px', flex: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: cor }}>{d.categorias[doc.categoria] || doc.categoria}</span>
                    <span className="es-cartao-titulo" style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.3, letterSpacing: -0.2 }}>
                      {doc.titulo}
                    </span>
                    <span className="es-cartao-desc" style={{ fontSize: 14, color: t.inkSoft, lineHeight: 1.55 }}>
                      {doc.descricao}
                    </span>
                    <span style={{ fontSize: 12, color: t.muted, marginTop: 'auto' }}>
                      {dataNoticia(pt?.publicadoEm || doc.publicadoEm, lang)} · {preencher(d.leitura, doc.tempoLeitura)}
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>
        ) : (
          <div style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, padding: 'clamp(24px, 4vw, 44px)', boxShadow: t.shadow, maxWidth: 760 }}>
            <h2 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 900, marginBottom: 10 }}>{d.vazio}</h2>
            <p style={{ fontSize: 15.5, color: t.inkSoft, lineHeight: 1.6, marginBottom: 20 }}>{d.vazioTexto}</p>
            <Link href={edicao} className="btn" style={{ display: 'inline-block', background: t.sunGrad, color: '#131417', fontWeight: 900, padding: '12px 22px', borderRadius: 999, whiteSpace: 'nowrap' }}>
              {d.ctaEdicao}
            </Link>
          </div>
        )}
      </div>

      <CtaFixo href={cta.href} rotulo={cta.rotulo} lang={lang} />
    </div>
  )
}
