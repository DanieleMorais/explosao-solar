import CategoryView from '@/components/views/CategoryView'
import { CATEGORIES, getCategory, SITE } from '@/lib/content'
import { alternates, OG_LOCALE } from '@/lib/seo'

export const dynamicParams = false

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ categoria: c.slug }))
}

export async function generateMetadata({ params }) {
  const { categoria } = await params
  const cat = getCategory(categoria, 'es')
  if (!cat) return {}
  return {
    title: cat.name,
    description: cat.description,
    alternates: alternates('es', `/${cat.slug}`),
    openGraph: { locale: OG_LOCALE.es, title: `${cat.name} | ${SITE.name}`, description: cat.description },
  }
}

export default async function Page({ params }) {
  const { categoria } = await params
  return <CategoryView lang="es" categoria={categoria} />
}
