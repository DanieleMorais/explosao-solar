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

function ler(f) {
  return fs.readFileSync(f, 'utf8').replace(/[\s\r\n]+/g, '')
}

function acharAppSecret() {
  if (process.argv[2]) return process.argv[2].trim()
  if (process.env.META_APP_SECRET) return process.env.META_APP_SECRET.trim()
  const dir = 'C:/Users/Administrator/OneDrive/Documentos/documentos'
  for (const nome of fs.readdirSync(dir)) {
    if (/app.?secret|secret.?app|chave.?secreta/i.test(nome)) return ler(path.join(dir, nome))
  }
  throw new Error('app secret não encontrado — passe como argumento ou salve em "app secret.txt"')
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
  const curto = ler(TOKEN_FILE)
  const appSecret = acharAppSecret()

  console.log('trocando token curto por um de 60 dias...')
  const ex = await fetch(
    `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${appSecret}&fb_exchange_token=${curto}`
  ).then((r) => r.json())
  if (!ex.access_token) throw new Error('troca falhou: ' + JSON.stringify(ex.error || ex))
  const longo = ex.access_token

  const dbg = await fetch(`${GRAPH}/debug_token?input_token=${longo}&access_token=${longo}`).then((r) => r.json())
  const exp = dbg.data?.expires_at ? new Date(dbg.data.expires_at * 1000).toLocaleString('pt-BR') : 'longa duração'
  console.log(`novo token ok — expira: ${exp}`)

  // guarda o token longo de volta no arquivo (pra próxima renovação partir dele)
  fs.writeFileSync(TOKEN_FILE, longo)

  const secrets = { META_TOKEN: longo, META_IG_ID: IG_ID, META_APP_ID: APP_ID, META_APP_SECRET: appSecret }

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
