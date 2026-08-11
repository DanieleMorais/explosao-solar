import HomeView from '@/components/views/HomeView'
import { SITE_TITLES, SITE_DESCRIPTIONS } from '@/lib/content'
import { alternates, OG_LOCALE } from '@/lib/seo'

export const metadata = {
  title: SITE_TITLES.en,
  description: SITE_DESCRIPTIONS.en,
  alternates: alternates('en', ''),
  openGraph: { locale: OG_LOCALE.en, title: SITE_TITLES.en, description: SITE_DESCRIPTIONS.en },
}

export default function Page() {
  return <HomeView lang="en" />
}
