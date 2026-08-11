// Envia notificação push aos inscritos do portal. Usado pelo robô de alertas.

const path = require('path')
const webpush = require('web-push')

function env() {
  const fs = require('fs')
  const out = {}
  for (const m of fs.readFileSync(path.join(__dirname, '..', '.env.robo'), 'utf8').matchAll(/^([A-Z_0-9]+)=(.+)$/gm)) out[m[1]] = m[2].trim()
  return out
}

const E = env()
process.env.FIREBASE_SA_B64 = process.env.FIREBASE_SA_B64 || E.FIREBASE_SA_B64

webpush.setVapidDetails('mailto:contato@explosaosolar.com', E.VAPID_PUBLIC, E.VAPID_PRIVATE)

async function firestore() {
  // lib do site é ESM; no Windows o import dinâmico exige URL file://
  const { pathToFileURL } = require('url')
  return import(pathToFileURL(path.join(__dirname, '..', 'lib', 'firestore-rest.js')).href)
}

// payloadPorLang: { pt: {title, body, url}, en: {...}, es: {...} }
async function enviarPush(payloadPorLang, log = console.log) {
  const { listar, remover } = await firestore()
  let inscritos
  try {
    inscritos = await listar('push_inscritos')
  } catch (e) {
    log('push: falha ao listar inscritos — ' + e.message)
    return { enviados: 0, removidos: 0 }
  }
  if (!inscritos.length) {
    log('push: nenhum inscrito ainda')
    return { enviados: 0, removidos: 0 }
  }

  let enviados = 0
  let removidos = 0
  for (const i of inscritos) {
    const p = payloadPorLang[i.lang] || payloadPorLang.pt
    try {
      await webpush.sendNotification(
        { endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } },
        JSON.stringify(p),
        { TTL: 3600, urgency: 'high' }
      )
      enviados++
    } catch (e) {
      // 404/410 = inscrição expirada; 400/403 = chaves inválidas — nenhuma volta a funcionar
      if ([400, 403, 404, 410].includes(e.statusCode)) {
        await remover('push_inscritos', i._id).catch(() => {})
        removidos++
      }
    }
  }
  log(`push: ${enviados} enviados, ${removidos} inscrições mortas removidas (de ${inscritos.length})`)
  return { enviados, removidos }
}

// Broadcast de e-mail SÓ para desastres graves, à lista dedicada `alertas_email`
// (separada da newsletter). item = { pt:{title,body,url}, en:{...}, es:{...} }.
async function enviarAlertaEmail(item, log = console.log) {
  const path = require('path')
  const { pathToFileURL } = require('url')
  const { listar } = await firestore()
  const email = await import(pathToFileURL(path.join(__dirname, '..', 'lib', 'email.js')).href)

  if (!email.emailConfigurado()) {
    log('alerta-email: RESEND_API_KEY ausente, pulando')
    return { enviados: 0 }
  }

  let inscritos
  try {
    inscritos = await listar('alertas_email')
  } catch (e) {
    log('alerta-email: falha ao listar — ' + e.message)
    return { enviados: 0 }
  }
  if (!inscritos.length) {
    log('alerta-email: nenhum inscrito')
    return { enviados: 0 }
  }

  let enviados = 0
  for (const i of inscritos) {
    const lang = ['pt', 'en', 'es'].includes(i.lang) ? i.lang : 'pt'
    const dados = item[lang] || item.pt
    const msg = email.emailAlerta({ titulo: dados.title, resumo: dados.body, url: dados.url, lang })
    const r = await email.enviarEmail({ para: i.email, assunto: msg.assunto, html: msg.html, texto: msg.texto })
    if (r.ok) enviados++
  }
  log(`alerta-email: ${enviados}/${inscritos.length} enviados`)
  return { enviados }
}

module.exports = { enviarPush, enviarAlertaEmail }
