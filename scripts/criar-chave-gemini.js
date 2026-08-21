// Cria uma API key do Gemini num projeto Google via OAuth (cloud-platform).
// Uso: node scripts/criar-chave-gemini.js <projectId>
const fs = require('fs')
const path = require('path')

for (const m of fs.readFileSync(path.join(__dirname, '..', '.env.robo'), 'utf8').matchAll(/^([A-Z_0-9]+)=(.+)$/gm)) process.env[m[1]] = m[2].trim()
const PROJ = process.argv[2] || 'sistema-fada-madrinha'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function token() {
  const p = new URLSearchParams({ client_id: process.env.G_CLIENT_ID, client_secret: process.env.G_CLIENT_SECRET, refresh_token: process.env.G_REFRESH_TOTAL, grant_type: 'refresh_token' })
  const j = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p })).json()
  return j.access_token
}

async function main() {
  const AT = await token()
  const H = { Authorization: 'Bearer ' + AT, 'Content-Type': 'application/json' }

  // 1) habilita a Generative Language API
  const en = await fetch(`https://serviceusage.googleapis.com/v1/projects/${PROJ}/services/generativelanguage.googleapis.com:enable`, { method: 'POST', headers: H })
  console.log('enable API:', en.status)
  await sleep(4000)

  // 2) cria a chave (operação de longa duração)
  const cr = await fetch(`https://apikeys.googleapis.com/v2/projects/${PROJ}/locations/global/keys?keyId=explosao-gemini`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ displayName: 'Explosao Solar Gemini', restrictions: { apiTargets: [{ service: 'generativelanguage.googleapis.com' }] } }),
  })
  const cj = await cr.json()
  if (cr.status >= 400 && cj.error && !/already exists/i.test(JSON.stringify(cj.error))) { console.log('criar erro:', JSON.stringify(cj.error).slice(0, 250)); }
  let opName = cj.name

  // se já existe, pega direto
  let keyName = `projects/${PROJ}/locations/global/keys/explosao-gemini`
  if (opName && !opName.startsWith('projects/')) {
    for (let i = 0; i < 15; i++) {
      const op = await (await fetch(`https://apikeys.googleapis.com/v2/${opName}`, { headers: H })).json()
      if (op.done) { keyName = op.response?.name || keyName; break }
      await sleep(2000)
    }
  }

  // 3) pega o keyString
  const ks = await (await fetch(`https://apikeys.googleapis.com/v2/${keyName}/keyString`, { headers: H })).json()
  const key = ks.keyString
  if (!key) { console.log('sem keyString:', JSON.stringify(ks).slice(0, 200)); return }
  fs.writeFileSync(path.join(process.env.TEMP || '.', 'gemini_novo.txt'), key)
  console.log('CHAVE criada, len:', key.length, 'inicio:', key.slice(0, 4))

  // 4) testa (pode levar ~1min pra propagar)
  await sleep(8000)
  const t = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: 'responda: ok' }] }], generationConfig: { maxOutputTokens: 10, thinkingConfig: { thinkingBudget: 0 } } }),
  })
  const tj = await t.json()
  console.log('TESTE gemini-2.5-flash:', t.status, t.status === 200 ? 'OK -> ' + (tj.candidates?.[0]?.content?.parts?.[0]?.text || '').trim() : JSON.stringify(tj.error || tj).slice(0, 180))
}
main().catch((e) => console.log('ERRO', e.message))
