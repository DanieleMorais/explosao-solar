// Metadata das páginas do blog em 12 idiomas (lista /<idioma>/noticia e matéria /<idioma>/noticia/<slug no idioma>),
// num lugar só: as rotas de en, es e dos 9 idiomas novos (app/[categoria]/noticia) usam as mesmas funções.
import { SITE } from '@/lib/site'
import { ROBOTS_INDEX, ROBOTS_NOINDEX } from '@/lib/seo'
import { OG_LOCALE_IDIOMA, caminhoLista } from '@/lib/idiomas'
import { caminhoArtigo } from '@/lib/blogSlug'
import { dicBlog, hreflangDoBlog, urlAbsoluta } from '@/lib/blogDic'
import { traducoesPublicadas } from '@/lib/traducoes'

export function metadataLista(lang) {
  const d = dicBlog(lang)
  const url = urlAbsoluta(caminhoLista(lang))
  const titulo = `${d.listaTitulo} | ${SITE.name}`
  return {
    title: d.listaTitulo,
    description: d.listaIntro,
    alternates: { canonical: url },
    // lista vazia fica fora do Google até a primeira matéria do idioma sair
    robots: traducoesPublicadas(lang).length ? ROBOTS_INDEX : ROBOTS_NOINDEX,
    openGraph: { type: 'website', locale: OG_LOCALE_IDIOMA[lang], siteName: SITE.name, title: titulo, description: d.listaIntro, url },
    twitter: { card: 'summary_large_image', title: titulo, description: d.listaIntro },
  }
}

export function metadataTraducao(lang, { doc, pt, versoes }) {
  const d = dicBlog(lang)
  const url = urlAbsoluta(caminhoArtigo(lang, doc.slugIdioma))
  return {
    title: doc.titulo,
    description: doc.descricao,
    keywords: doc.palavrasChave,
    authors: [{ name: pt.autor }],
    alternates: { canonical: url, languages: hreflangDoBlog(doc.slug, versoes) },
    // a tradução nova é indexável mesmo em /en e /es (o layout de lá deixa a tradução antiga em noindex)
    robots: ROBOTS_INDEX,
    openGraph: {
      type: 'article',
      locale: OG_LOCALE_IDIOMA[lang],
      siteName: SITE.name,
      title: doc.titulo,
      description: doc.descricao,
      url,
      publishedTime: pt.publicadoEm,
      modifiedTime: doc.publicadoEm || pt.publicadoEm,
      section: d.categorias[doc.categoria],
      tags: doc.palavrasChave,
      // en/es têm opengraph-image próprio (título no idioma); nos 9 novos vai a foto da matéria
      images: pt.imagem ? [{ url: pt.imagem, alt: doc.titulo }] : undefined,
    },
    twitter: { card: 'summary_large_image', title: doc.titulo, description: doc.descricao, images: pt.imagem ? [pt.imagem] : undefined },
  }
}

// endereço antigo que só redireciona: nada a indexar
export const metadataRedirecionamento = () => ({ robots: ROBOTS_NOINDEX })
