// Envia o resumo diário PERSONALIZADO por e-mail: cada inscrito recebe o clima
// das cidades/bairros que ele escolheu + as últimas notícias.
// Roda na nuvem (GitHub Actions) toda manhã. Uso: node scripts/enviar-digest.js [--dry]

const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')
const { ultimasNoticias, dataHoje } = require('./digest')

function carregarEnv() {
  const f = path.join(__dirname, '..', '.env.robo')
  if (!fs.existsSync(f)) return
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/^([A-Z_0-9]+)=(.+)$/gm)) process.env[m[1]] = process.env[m[1]] || m[2].trim()
}

const log = (m) => console.log(`[${new Date().toISOString()}] ${m}`)

function parseCidades(doc) {
  try {
    const arr = doc?.cidades ? JSON.parse(doc.cidades) : []
    return Array.isArray(arr) ? arr.filter((c) => c && typeof c.lat === 'number' && typeof c.lon === 'number').slice(0, 8) : []
  } catch {
    return []
  }
}

async function main() {
  carregarEnv()
  const dry = process.argv.includes('--dry')

  const email = await import(pathToFileURL(path.join(__dirname, '..', 'lib', 'email.js')).href)
  const clima = await import(pathToFileURL(path.join(__dirname, '..', 'lib', 'clima.js')).href)
  const { listar } = await import(pathToFileURL(path.join(__dirname, '..', 'lib', 'firestore-rest.js')).href)

  if (!email.emailConfigurado()) return log('RESEND_API_KEY ausente — abortando')

  const dataFmt = dataHoje()
  const noticias = ultimasNoticias(5).map((a) => ({ title: a.title, slug: a.slug, category: a.category, imagem: a.imagem, excerpt: a.excerpt }))
  log(`resumo do dia: ${noticias.length} notícias`)

  let inscritos = []
  try {
    inscritos = await listar('newsletter')
  } catch (e) {
    return log('falha ao listar inscritos: ' + e.message)
  }
  log(`${inscritos.length} inscrito(s)`)

  let ok = 0
  let falhou = 0
  for (const i of inscritos) {
    if (!i.email) continue

    const pontos = parseCidades(i)
    let cidades = []
    if (pontos.length) {
      const prev = await clima.previsaoPontos(pontos)
      cidades = prev
        .map((p, idx) => {
          if (p.erro || !p.agora) return null
          const w = clima.wmo(p.agora.code, 'pt')
          const hoje = p.dias[0] || {}
          return { rotulo: pontos[idx].rotulo, emoji: w.emoji, texto: w.texto, temp: p.agora.temp, max: hoje.max, min: hoje.min, chuva: hoje.chuva }
        })
        .filter(Boolean)
    }

    const msg = email.emailDigest({ dataFmt, cidades, noticias, email: i.email })
    if (dry) {
      log(`DRY ${i.email}: ${cidades.length} cidades | ${msg.assunto}`)
      continue
    }
    const r = await email.enviarEmail({ para: i.email, assunto: msg.assunto, html: msg.html, texto: msg.texto })
    r.ok ? ok++ : falhou++
    await new Promise((s) => setTimeout(s, 600))
  }
  log(`fim: ${ok} enviados, ${falhou} falhas`)
}

main().catch((e) => {
  log('ERRO FATAL: ' + (e.stack || e.message))
  process.exit(1)
})
