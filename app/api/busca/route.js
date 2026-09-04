import { buscar } from '@/lib/busca'

// Dinâmica: lê o termo da query. O cache do CDN (s-maxage) evita recomputar
// a mesma busca no Worker a cada acesso.
export const dynamic = 'force-dynamic'

export function GET(request) {
  const { searchParams } = new URL(request.url)
  const lang = ['pt', 'en', 'es'].includes(searchParams.get('lang')) ? searchParams.get('lang') : 'pt'
  const dados = buscar(searchParams.get('q') || '', lang)
  return Response.json(dados, { headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=86400' } })
}
