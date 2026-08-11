import HomeView from '@/components/views/HomeView'
import { SITE_TITLES, SITE_DESCRIPTIONS } from '@/lib/content'
import { alternates, OG_LOCALE } from '@/lib/seo'

export const metadata = {
  title: SITE_TITLES.es,
  description: SITE_DESCRIPTIONS.es,
  alternates: alternates('es', ''),
  openGraph: { locale: OG_LOCALE.es, title: SITE_TITLES.es, description: SITE_DESCRIPTIONS.es },
}

export default function Page() {
  return <HomeView lang="es" />
}
