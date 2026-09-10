import { indiceBusca } from '@/lib/busca'

// Gerado no BUILD (um arquivo por idioma) e servido como estático: é assim que a
// busca funciona na Cloudflare, onde o Worker não enxerga os arquivos de conteúdo
// em tempo de execução — uma rota de busca dinâmica responde sempre vazio.
export const dynamicParams = false
export const revalidate = 600

export function generateStaticParams() {
  return [{ lang: 'pt' }, { lang: 'en' }, { lang: 'es' }]
}

export async function GET(_request, { params }) {
  const { lang } = await params
  return Response.json(indiceBusca(lang), {
    headers: { 'Cache-Control': 'public, max-age=600, s-maxage=600, stale-while-revalidate=86400' },
  })
}
