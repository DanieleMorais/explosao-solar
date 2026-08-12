import { NextResponse } from 'next/server'
import { geocodificar } from '@/lib/brasil'
import { previsaoPonto } from '@/lib/clima'

export const revalidate = 0

export async function GET(request) {
  const q = (request.nextUrl.searchParams.get('q') || '').trim().slice(0, 80)
  const uf = (request.nextUrl.searchParams.get('uf') || '').trim().slice(0, 2)
  if (q.length < 2) return NextResponse.json({ error: 'termo curto' }, { status: 400 })

  const local = await geocodificar(q, uf)
  if (!local) return NextResponse.json({ error: 'não encontrado' }, { status: 404 })

  const clima = await previsaoPonto(local.lat, local.lon)
  if (!clima) return NextResponse.json({ error: 'sem clima' }, { status: 502 })

  return NextResponse.json({ rotulo: local.rotulo, lat: local.lat, lon: local.lon, clima })
}
