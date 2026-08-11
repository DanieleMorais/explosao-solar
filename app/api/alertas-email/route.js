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

  const email = String(body?.email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
  }

  const id = crypto.createHash('sha256').update(email).digest('hex').slice(0, 40)
  try {
    await gravar('alertas_email', id, {
      email,
      lang: ['pt', 'en', 'es'].includes(body.lang) ? body.lang : 'pt',
      criadoEm: new Date().toISOString(),
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[alertas-email] gravar falhou:', e.message)
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
  const email = String(body?.email || '').trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'e-mail ausente' }, { status: 400 })
  const id = crypto.createHash('sha256').update(email).digest('hex').slice(0, 40)
  try {
    await remover('alertas_email', id)
  } catch {}
  return NextResponse.json({ ok: true })
}