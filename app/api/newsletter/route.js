import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { gravar } from '@/lib/firestore-rest'
import { enviarEmail, emailBoasVindas, emailConfigurado } from '@/lib/email'

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
    await gravar('newsletter', id, { email, criadoEm: new Date().toISOString(), origem: 'site' })
  } catch (e) {
    console.error('[newsletter] gravar falhou:', e.message)
    return NextResponse.json({ error: 'erro interno' }, { status: 500 })
  }

  // envio de boas-vindas não bloqueia a resposta; se o e-mail não estiver
  // configurado ainda, o inscrito fica salvo do mesmo jeito.
  if (emailConfigurado()) {
    const bv = emailBoasVindas(email)
    enviarEmail({ para: email, assunto: bv.assunto, html: bv.html, texto: bv.texto }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
