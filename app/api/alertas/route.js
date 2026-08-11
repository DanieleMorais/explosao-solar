import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { gravar, remover } from '@/lib/firestore-rest'

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const sub = body?.subscription
  if (!sub?.endpoint || !sub.endpoint.startsWith('https://') || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: 'inscrição inválida' }, { status: 400 })
  }
  if (JSON.stringify(sub).length > 4000) {
    return NextResponse.json({ error: 'payload grande demais' }, { status: 400 })
  }

  const id = crypto.createHash('sha256').update(sub.endpoint).digest('hex').slice(0, 40)
  try {
    await gravar('push_inscritos', id, {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      lang: ['pt', 'en', 'es'].includes(body.lang) ? body.lang : 'pt',
      criadoEm: new Date().toISOString(),
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[alertas] gravar falhou:', e.message)
    return NextResponse.json({ error: 'erro interno' }, { status: 500 })
  }
}

export async function DELETE(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  if (!body?.endpoint) return NextResponse.json({ error: 'endpoint ausente' }, { status: 400 })
  const id = crypto.createHash('sha256').update(body.endpoint).digest('hex').slice(0, 40)
  try {
    await remover('push_inscritos', id)
  } catch {}
  return NextResponse.json({ ok: true })
}
