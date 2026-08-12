// Configura o robô de redes sociais: troca o token curto por um de longa duração
// (60 dias) e grava META_TOKEN, META_IG_ID, META_APP_ID, META_APP_SECRET nos
// secrets do GitHub Actions. Uso: node scripts/meta-setup.js
//
// Lê:
//   OneDrive/.../token explosao.txt   -> token de usuário atual (curto)
//   OneDrive/.../app secret.txt       -> chave secreta do app (ou 1º arg / META_APP_SECRET)

const fs = require('fs')
const path = require('path')
const sodium = require('libsodium-wrappers')
const { execSync } = require('child_process')

const REPO = 'DanieleMorais/explosao-solar'
const APP_ID = '1310096497603737'
const IG_ID = '17841440791860842'
const GRAPH = 'https://graph.facebook.com/v20.0'
const TOKEN_FILE = 'C:/Users/Administrator/OneDrive/Documentos/documentos/token explosao.txt'

// O arquivo tem 3 linhas: token de usuário (EAA...), App ID (dígitos) e App Secret (32 hex).
function lerCredenciais() {
  const linhas = fs.readFileSync(TOKEN_FILE, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
  const token = linhas.find((l) => /^EAA/.test(l))
  const appSecret = linhas.find((l) => /^[a-f0-9]{32}$/i.test(l))
  const appId = linhas.find((l) => /^\d{15,17}$/.test(l)) || APP_ID
  if (!token) throw new Error('token (EAA...) não encontrado no arquivo')
  if (!appSecret) throw new Error('app secret (32 hex) não encontrado no arquivo')
  return { token, appSecret, appId }
}

function tokenGithub() {
  return execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8' })
    .split('\n')
    .find((l) => l.startsWith('password='))
    .slice('password='.length)
    .trim()
}

async function gh(tok, url, opts = {}) {
  const r = await fetch(`https://api.github.com${url}`, {
    ...opts,
    headers: { Authorization: `Bearer ${tok}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', ...(opts.headers || {}) },
  })
  const t = await r.text()
  return { ok: r.ok, status: r.status, data: t ? JSON.parse(t) : {} }
}

async function main() {
  await sodium.ready
  const { token: curto, appSecret, appId } = lerCredenciais()

  console.log('trocando token curto por um de 60 dias...')
  const ex = await fetch(
    `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${curto}`
  ).then((r) => r.json())
  if (!ex.access_token) throw new Error('troca falhou: ' + JSON.stringify(ex.error || ex))
  const longo = ex.access_token

  const dbg = await fetch(`${GRAPH}/debug_token?input_token=${longo}&access_token=${longo}`).then((r) => r.json())
  const exp = dbg.data?.expires_at ? new Date(dbg.data.expires_at * 1000).toLocaleString('pt-BR') : 'longa duração'
  console.log(`novo token ok — expira: ${exp}`)

  // guarda o token longo de volta no arquivo (mantendo App ID e Secret pra próxima renovação)
  fs.writeFileSync(TOKEN_FILE, `${longo}\n${appId}\n${appSecret}\n`)

  const secrets = { META_TOKEN: longo, META_IG_ID: IG_ID, META_APP_ID: appId, META_APP_SECRET: appSecret }

  const tok = tokenGithub()
  const chave = await gh(tok, `/repos/${REPO}/actions/secrets/public-key`)
  if (!chave.ok) throw new Error('public-key: ' + JSON.stringify(chave.data))
  const keyBuf = sodium.from_base64(chave.data.key, sodium.base64_variants.ORIGINAL)

  for (const [nome, valor] of Object.entries(secrets)) {
    const cifrado = sodium.crypto_box_seal(sodium.from_string(String(valor)), keyBuf)
    const r = await gh(tok, `/repos/${REPO}/actions/secrets/${nome}`, {
      method: 'PUT',
      body: JSON.stringify({ encrypted_value: sodium.to_base64(cifrado, sodium.base64_variants.ORIGINAL), key_id: chave.data.key_id }),
    })
    console.log(`  ${r.ok ? '✓' : '✗ ' + r.status} ${nome}`)
  }
  console.log('\npronto — robô de redes sociais LIGADO na nuvem.')
}

main().catch((e) => {
  console.error('ERRO:', e.message)
  process.exit(1)
})
