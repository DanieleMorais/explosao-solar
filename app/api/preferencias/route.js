import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { verificarUnsub } from '@/lib/email'
import { gravar, listar } from '@/lib/firestore-rest'

function idDe(email) {
  return crypto.createHash('sha256').update(email).digest('hex').slice(0, 40)
}

async function docDe(email) {
  const todos = await listar('newsletter')
  return todos.find((d) => d.email === email) || null
}

export async function GET(request) {
  const email = String(request.nextUrl.searchParams.get('e') || '').trim().toLowerCase()
  const token = String(request.nextUrl.searchParams.get('t') || '')
  if (!verificarUnsub(email, token)) return NextResponse.json({ error: 'link inválido' }, { status: 403 })

  const doc = await docDe(email)
  let cidades = []
  try {
    cidades = doc?.cidades ? JSON.parse(doc.cidades) : []
  } catch {}
  let editorias = []
  try {
    editorias = doc?.editorias ? JSON.parse(doc.editorias) : []
  } catch {}
  return NextResponse.json({ email, cidades, editorias, frequencia: doc?.frequencia || 'diario' })
}

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const email = String(body?.e || '').trim().toLowerCase()
  if (!verificarUnsub(email, String(body?.t || ''))) return NextResponse.json({ error: 'link inválido' }, { status: 403 })

  const cidades = Array.isArray(body?.cidades)
    ? body.cidades
        .filter((c) => c && c.rotulo && typeof c.lat === 'number' && typeof c.lon === 'number')
        .slice(0, 8)
        .map((c) => ({ rotulo: String(c.rotulo).slice(0, 80), lat: c.lat, lon: c.lon }))
    : []

  const CATS = ['mundo', 'brasil', 'politica', 'economia', 'tecnologia', 'ciencia', 'esportes', 'cultura']
  const editorias = Array.isArray(body?.editorias) ? body.editorias.filter((c) => CATS.includes(c)) : []
  const frequencia = body?.frequencia === 'semanal' ? 'semanal' : 'diario'

  try {
    await gravar('newsletter', idDe(email), {
      email,
      cidades: JSON.stringify(cidades),
      editorias: JSON.stringify(editorias),
      frequencia,
      atualizadoEm: new Date().toISOString(),
    })
    return NextResponse.json({ ok: true, cidades, editorias, frequencia })
  } catch (e) {
    console.error('[preferencias] falhou:', e.message)
    return NextResponse.json({ error: 'erro interno' }, { status: 500 })
  }
}
