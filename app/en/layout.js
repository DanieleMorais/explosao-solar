import { ROBOTS_NOINDEX } from '@/lib/seo'

// Freio de 14/10/2026 (decisão da Dani, para o site voltar ao Google): tudo em /en é tradução
// automática e sai do índice (noindex,follow). O clima tem layout próprio e continua indexado.
export const metadata = { robots: ROBOTS_NOINDEX }

export default function Layout({ children }) {
  return children
}
