// ads.txt: linha do AdSense (liga sozinha com NEXT_PUBLIC_ADSENSE_CLIENT) + a lista
// do The Moneytizer. As duas redes convivem no mesmo arquivo; linha repetida é tirada.
import { ADS_MONEYTIZER } from '@/lib/ads-moneytizer'

export const revalidate = 3600

function montar() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || ''
  const pub = client.replace(/^ca-/, '')
  const adsense = pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0` : ''

  // OWNERDOMAIN/MANAGERDOMAIN têm que vir antes das linhas de parceiro.
  const linhas = ADS_MONEYTIZER.split('\n').map((l) => l.trim()).filter(Boolean)
  const variaveis = linhas.filter((l) => l.includes('='))
  const parceiros = linhas.filter((l) => !l.includes('='))

  const vistas = new Set()
  const unicas = []
  for (const l of [adsense, ...parceiros]) {
    if (!l) continue
    const chave = l.toLowerCase().replace(/\s+/g, '')
    if (vistas.has(chave)) continue
    vistas.add(chave)
    unicas.push(l)
  }
  return [...variaveis, ...unicas].join('\n') + '\n'
}

export function GET() {
  return new Response(montar(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
  })
}
