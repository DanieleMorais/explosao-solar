// Acesso à conta Google da Dani (Search Console, Indexing, Analytics Admin).
// Usa o refresh_token de acesso total guardado no OneDrive.

const fs = require('fs')

// Credenciais fora do código: .env.robo (local) ou env vars (nuvem).
const TOKEN_FILE = 'C:/Users/Administrator/OneDrive/Documentos/documentos/google-acesso-total.txt'

function envRobo() {
  const out = {}
  const f = require('path').join(__dirname, '..', '.env.robo')
  if (fs.existsSync(f)) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/^([A-Z_0-9]+)=(.+)$/gm)) out[m[1]] = m[2].trim()
  }
  return out
}

const E = envRobo()
const CLIENT_ID = process.env.G_CLIENT_ID || E.G_CLIENT_ID
const CLIENT_SECRET = process.env.G_CLIENT_SECRET || E.G_CLIENT_SECRET

function refreshToken() {
  const direto = process.env.G_REFRESH_TOTAL || E.G_REFRESH_TOTAL
  if (direto) return direto
  const txt = fs.readFileSync(TOKEN_FILE, 'utf8')
  const m = txt.match(/refresh_token=(.+)/)
  if (!m) throw new Error('refresh_token não encontrado em ' + TOKEN_FILE)
  return m[1].trim()
}

let cache = null

async function accessToken() {
  if (cache && cache.exp > Date.now() + 60000) return cache.token
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken(),
      grant_type: 'refresh_token',
    }),
  })
  const j = await r.json()
  if (!j.access_token) throw new Error('falha ao renovar token: ' + JSON.stringify(j).slice(0, 200))
  cache = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 }
  return cache.token
}

async function api(url, { method = 'GET', body } = {}) {
  const tok = await accessToken()
  const r = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const txt = await r.text()
  let data
  try {
    data = txt ? JSON.parse(txt) : {}
  } catch {
    data = { raw: txt }
  }
  return { ok: r.ok, status: r.status, data }
}

module.exports = { accessToken, api }
