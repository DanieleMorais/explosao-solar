// /ads_tm.php — o endereço que o verificador do The Moneytizer compara com o /ads.txt
// (método "automático" da FAQ deles). Precisa devolver exatamente o mesmo conteúdo.
import { montarAdsTxt } from '@/lib/ads-txt'

export const revalidate = 3600

export async function GET() {
  return new Response(await montarAdsTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
  })
}
