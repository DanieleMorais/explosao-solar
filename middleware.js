import { NextResponse } from 'next/server'

// Só roda na raiz. Se o host for o subdomínio do painel, serve /saude
// (mantendo a query, ex.: ?t=token). Nos demais hosts não faz nada.
export const config = { matcher: '/' }

export function middleware(req) {
  const host = req.headers.get('host') || ''
  if (host.startsWith('saude.')) {
    const url = req.nextUrl.clone()
    url.pathname = '/saude'
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}
