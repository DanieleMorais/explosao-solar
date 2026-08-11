// Acesso ao Firestore via REST com conta de serviço — funciona no Vercel (API
// routes) e no robô local, sem SDK do Firebase.

import crypto from 'crypto'

function credenciais() {
  const b64 = process.env.FIREBASE_SA_B64
  if (!b64) throw new Error('FIREBASE_SA_B64 ausente')
  return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
}

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

let cache = null

export async function tokenSA() {
  if (cache && cache.exp > Date.now() + 60000) return cache.token
  const sa = credenciais()
  const agora = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      iat: agora,
      exp: agora + 3600,
    })
  )
  const assinatura = crypto.createSign('RSA-SHA256').update(`${header}.${claims}`).sign(sa.private_key)
  const jwt = `${header}.${claims}.${b64url(assinatura)}`

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  const j = await r.json()
  if (!j.access_token) throw new Error('token SA falhou: ' + JSON.stringify(j).slice(0, 140))
  cache = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 }
  return cache.token
}

const BASE = 'https://firestore.googleapis.com/v1/projects/agencia-fada-madrinha-498514/databases/(default)/documents'

function paraFirestore(obj) {
  const campos = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue
    campos[k] =
      typeof v === 'number' ? { integerValue: String(Math.round(v)) } : typeof v === 'boolean' ? { booleanValue: v } : { stringValue: String(v) }
  }
  return { fields: campos }
}

function deFirestore(doc) {
  const out = { _id: doc.name.split('/').pop() }
  for (const [k, v] of Object.entries(doc.fields || {})) {
    out[k] = v.stringValue ?? (v.integerValue ? Number(v.integerValue) : v.booleanValue)
  }
  return out
}

export async function gravar(colecao, id, dados) {
  const tok = await tokenSA()
  const r = await fetch(`${BASE}/${colecao}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(paraFirestore(dados)),
  })
  if (!r.ok) throw new Error(`firestore gravar ${r.status}: ${(await r.text()).slice(0, 140)}`)
  return true
}

export async function listar(colecao, limite = 1000) {
  const tok = await tokenSA()
  const docs = []
  let pageToken = ''
  do {
    const r = await fetch(`${BASE}/${colecao}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
    if (!r.ok) {
      if (r.status === 404) return []
      throw new Error(`firestore listar ${r.status}`)
    }
    const j = await r.json()
    for (const d of j.documents || []) docs.push(deFirestore(d))
    pageToken = j.nextPageToken || ''
  } while (pageToken && docs.length < limite)
  return docs
}

export async function remover(colecao, id) {
  const tok = await tokenSA()
  await fetch(`${BASE}/${colecao}/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok}` } })
}
