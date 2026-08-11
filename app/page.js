import HomeView from '@/components/views/HomeView'
import { SITE_TITLES, SITE_DESCRIPTIONS } from '@/lib/content'
import { alternates, OG_LOCALE } from '@/lib/seo'

export const metadata = {
  title: SITE_TITLES.pt,
  description: SITE_DESCRIPTIONS.pt,
  alternates: alternates('pt', ''),
  openGraph: { locale: OG_LOCALE.pt, title: SITE_TITLES.pt, description: SITE_DESCRIPTIONS.pt },
}

export default function Page() {
  return <HomeView lang="pt" />
}
