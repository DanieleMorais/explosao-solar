import { notFound, permanentRedirect } from 'next/navigation'
import TraducaoView from '@/components/views/TraducaoView'
import { IDIOMAS_NOVOS } from '@/lib/idiomas'
import { slugDoParametro } from '@/lib/blogSlug'
import { paramsDoIdioma, resolverRota } from '@/lib/traducoes'
import { metadataTraducao, metadataRedirecionamento } from '@/lib/paginasIdioma'

// /fr/noticia/<slug em francês>, /ru/noticia/<slug em russo>... ([categoria] = o IDIOMA; ver ../page.js). Gerada no build
// como o resto das matérias do site (o Worker não lê content/): só existe o que está publicado; rascunho e idioma fora
// dos 9 dão 404. O endereço antigo /<idioma>/noticia/<slug-pt> sai como redirecionamento permanente (308) para o novo.
export const dynamicParams = false

export function generateStaticParams() {
  return IDIOMAS_NOVOS.flatMap((categoria) => paramsDoIdioma(categoria).map((slug) => ({ categoria, slug })))
}

export async function generateMetadata({ params }) {
  const { categoria: lang, slug } = await params
  if (!IDIOMAS_NOVOS.includes(lang)) return {}
  const r = resolverRota(lang, slugDoParametro(slug))
  if (r?.tipo === 'traducao') return metadataTraducao(lang, r)
  return r?.tipo === 'redirecionar' ? metadataRedirecionamento() : {}
}

export default async function Page({ params }) {
  const { categoria: lang, slug } = await params
  if (!IDIOMAS_NOVOS.includes(lang)) notFound()
  const r = resolverRota(lang, slugDoParametro(slug))
  if (!r) notFound()
  if (r.tipo === 'redirecionar') permanentRedirect(r.para)
  return <TraducaoView lang={lang} doc={r.doc} pt={r.pt} versoes={r.versoes} />
}
