import { notFound } from 'next/navigation'
import ListaIdiomaView from '@/components/views/ListaIdiomaView'
import { IDIOMAS_NOVOS } from '@/lib/idiomas'
import { metadataLista } from '@/lib/paginasIdioma'

// /fr/noticia, /de/noticia ... /ar/noticia. O segmento se chama [categoria] porque divide a raiz com app/[categoria]/page.js
// (o Next não aceita dois nomes de parâmetro no mesmo nível): aqui o valor é o IDIOMA. en/es têm pasta própria (app/en,
// app/es). Idioma fora dos 9 = 404 (dynamicParams false: só o que o build gerou existe).
export const dynamicParams = false

export function generateStaticParams() {
  return IDIOMAS_NOVOS.map((categoria) => ({ categoria }))
}

export async function generateMetadata({ params }) {
  const { categoria: lang } = await params
  return IDIOMAS_NOVOS.includes(lang) ? metadataLista(lang) : {}
}

export default async function Page({ params }) {
  const { categoria: lang } = await params
  if (!IDIOMAS_NOVOS.includes(lang)) notFound()
  return <ListaIdiomaView lang={lang} />
}
