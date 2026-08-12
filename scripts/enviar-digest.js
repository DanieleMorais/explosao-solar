// Envia o resumo diário (clima + últimas notícias) por e-mail a todos os inscritos
// da newsletter. Roda na nuvem (GitHub Actions) toda manhã. Uso: node scripts/enviar-digest.js [--dry]

const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')
const { coletar } = require('./digest')

function carregarEnv() {
  const f = path.join(__dirname, '..', '.env.robo')
  if (!fs.existsSync(f)) return
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/^([A-Z_0-9]+)=(.+)$/gm)) process.env[m[1]] = process.env[m[1]] || m[2].trim()
}

function log(m) {
  console.log(`[${new Date().toISOString()}] ${m}`)
}

async function main() {
  carregarEnv()
  const dry = process.argv.includes('--dry')

  const email = await import(pathToFileURL(path.join(__dirname, '..', 'lib', 'email.js')).href)
  const { listar, remover } = await import(pathToFileURL(path.join(__dirname, '..', 'lib', 'firestore-rest.js')).href)

  if (!email.emailConfigurado()) {
    log('RESEND_API_KEY ausente — abortando')
    return
  }

  const dados = await coletar()
  log(`resumo montado: ${dados.clima.length} cidades, ${dados.noticias.length} notícias`)

  let inscritos = []
  try {
    inscritos = await listar('newsletter')
  } catch (e) {
    log('falha ao listar inscritos: ' + e.message)
    return
  }
  log(`${inscritos.length} inscrito(s)`)

  if (dry) {
    const preview = email.emailDigest({ ...dados, email: 'exemplo@teste.com' })
    log('DRY — assunto: ' + preview.assunto)
    return
  }

  let ok = 0
  let falhou = 0
  for (const i of inscritos) {
    if (!i.email) continue
    const msg = email.emailDigest({ ...dados, email: i.email })
    const r = await email.enviarEmail({ para: i.email, assunto: msg.assunto, html: msg.html, texto: msg.texto })
    if (r.ok) ok++
    else falhou++
    await new Promise((s) => setTimeout(s, 600)) // respeita rate do Resend
  }
  log(`fim: ${ok} enviados, ${falhou} falhas`)
}

main().catch((e) => {
  log('ERRO FATAL: ' + (e.stack || e.message))
  process.exit(1)
})
