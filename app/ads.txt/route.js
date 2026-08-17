// ads.txt do AdSense — ativa sozinho quando NEXT_PUBLIC_ADSENSE_CLIENT estiver setado.
export const revalidate = 3600

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || ''
  const pub = client.replace(/^ca-/, '')
  const conteudo = pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : ''
  return new Response(conteudo, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
  })
}
