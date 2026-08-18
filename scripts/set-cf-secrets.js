// Sobe CLOUDFLARE_API_TOKEN e CLOUDFLARE_ACCOUNT_ID como secrets do GitHub Actions.
// Uso: CFTOK="<token>" node scripts/set-cf-secrets.js
const sodium = require('libsodium-wrappers')
const { execSync } = require('child_process')

const REPO = 'DanieleMorais/explosao-solar'
const ACCOUNT_ID = '98e86ba9a4999ad9e29c7120ca0e0fac'

function ghToken() {
  return execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8' })
    .split('\n').find((l) => l.startsWith('password=')).slice('password='.length).trim()
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
  const cfTok = (process.env.CFTOK || '').trim()
  if (!cfTok) throw new Error('CFTOK vazio (passe o token via env)')
  const tok = ghToken()
  const secrets = { CLOUDFLARE_API_TOKEN: cfTok, CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID }

  const chave = await api(tok, `/repos/${REPO}/actions/secrets/public-key`)
  if (!chave.ok) throw new Error('public-key: ' + JSON.stringify(chave.data))
  const keyBuf = sodium.from_base64(chave.data.key, sodium.base64_variants.ORIGINAL)

  for (const [nome, valor] of Object.entries(secrets)) {
    const cif = sodium.crypto_box_seal(sodium.from_string(String(valor)), keyBuf)
    const r = await api(tok, `/repos/${REPO}/actions/secrets/${nome}`, {
      method: 'PUT',
      body: JSON.stringify({ encrypted_value: sodium.to_base64(cif, sodium.base64_variants.ORIGINAL), key_id: chave.data.key_id }),
    })
    console.log(`${r.ok ? '✓' : '✗ ' + r.status} ${nome}`)
  }
}

main().catch((e) => { console.error('ERRO:', e.message); process.exit(1) })
