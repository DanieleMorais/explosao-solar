// Sobe os secrets do robô para o GitHub Actions (criptografados com sealed box).
// Uso: node scripts/set-secrets.js
const fs = require('fs')
const path = require('path')
const sodium = require('libsodium-wrappers')
const { execSync } = require('child_process')

const REPO = 'DanieleMorais/explosao-solar'

function tokenGithub() {
  return execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8' })
    .split('\n')
    .find((l) => l.startsWith('password='))
    .slice('password='.length)
    .trim()
}

function envRobo() {
  const out = {}
  for (const m of fs.readFileSync(path.join(__dirname, '..', '.env.robo'), 'utf8').matchAll(/^([A-Z_0-9]+)=(.+)$/gm)) out[m[1]] = m[2].trim()
  return out
}

async function api(tok, url, opts = {}) {
  const r = await fetch(`https://api.github.com${url}`, {
    ...opts,
    headers: { Authorization: `Bearer ${tok}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', ...(opts.headers || {}) },
  })
  const t = await r.text()
  return { ok: r.ok, status: r.status, data: t ? JSON.parse(t) : {} }
}

async function main() {
  await sodium.ready
  const tok = tokenGithub()
  const E = envRobo()

  const vercelAuth = JSON.parse(fs.readFileSync('C:/Users/Administrator/AppData/Roaming/com.vercel.cli/Data/auth.json', 'utf8'))
  const vercelProj = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.vercel', 'project.json'), 'utf8'))

  const secrets = {
    G_CLIENT_ID: E.G_CLIENT_ID,
    G_CLIENT_SECRET: E.G_CLIENT_SECRET,
    G_REFRESH_TOTAL: E.G_REFRESH_TOTAL,
    CEREBRAS_API_KEY: E.CEREBRAS_API_KEY,
    HF_API_TOKEN: E.HF_API_TOKEN,
    GEMINI_API_KEY: E.GEMINI_API_KEY,
    OPENROUTER_API_KEY: E.OPENROUTER_API_KEY || '',
    VAPID_PUBLIC: E.VAPID_PUBLIC,
    VAPID_PRIVATE: E.VAPID_PRIVATE,
    FIREBASE_SA_B64: E.FIREBASE_SA_B64,
    VERCEL_TOKEN: vercelAuth.token,
    VERCEL_ORG_ID: vercelProj.orgId,
    VERCEL_PROJECT_ID: vercelProj.projectId,
  }

  const chave = await api(tok, `/repos/${REPO}/actions/secrets/public-key`)
  if (!chave.ok) throw new Error('public-key falhou: ' + JSON.stringify(chave.data))
  const keyBuf = sodium.from_base64(chave.data.key, sodium.base64_variants.ORIGINAL)

  let ok = 0
  for (const [nome, valor] of Object.entries(secrets)) {
    if (!valor) {
      console.log(`  ~ ${nome}: vazio, pulado`)
      continue
    }
    const cifrado = sodium.crypto_box_seal(sodium.from_string(String(valor)), keyBuf)
    const r = await api(tok, `/repos/${REPO}/actions/secrets/${nome}`, {
      method: 'PUT',
      body: JSON.stringify({ encrypted_value: sodium.to_base64(cifrado, sodium.base64_variants.ORIGINAL), key_id: chave.data.key_id }),
    })
    console.log(`  ${r.ok ? '✓' : '✗ ' + r.status} ${nome}`)
    if (r.ok) ok++
  }
  console.log(`\n${ok} secrets configurados no ${REPO}`)
}

main().catch((e) => {
  console.error('ERRO:', e.message)
  process.exit(1)
})
