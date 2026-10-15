import { ROBOTS_INDEX } from '@/lib/seo'

// O clima trazia busca nos 3 idiomas (Search Console, 14/07–13/10/2026): fica indexado como antes,
// sem herdar o noindex de /en (freio de 14/10/2026).
export const metadata = { robots: ROBOTS_INDEX }

export default function Layout({ children }) {
  return children
}
