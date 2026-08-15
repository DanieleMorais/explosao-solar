// Monitor de saúde do Explosão Solar. Roda na nuvem a cada 30 min.
// Checa se o site responde, se o sitemap está de pé e se o conteúdo está fresco
// (robôs rodando). Só avisa a Dani por e-mail quando há problema — e no máximo
// 1 e-mail a cada 3h por problema (estado no Firestore, coleção `sistema`).
// Uso: node scripts/monitor.js [--dry]

const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')

const SITE = 'https://explosaosolar.com'
const AVISAR = 'fadamadrinhadm@gmail.com'
const PT_DIR = path.join(__dirname, '..', 'content', 'articles')
const MAX_HORAS_SEM_NOTICIA = 26 // notícias rodam a cada 8h; 26h = 3 janelas perdidas
const REPETIR_ALERTA_H = 3

const log = (m) => console.log(`[${new Date().toISOString()}] ${m}`)

function carregarEnv() {
  const f = path.join(__dirname, '..', '.env.robo')
  if (!fs.existsSync(f)) return
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/^([A-Z_0-9]+)=(.+)$/gm)) process.env[m[1]] = process.env[m[1]] || m[2].trim()
}

async function checarUrl(url, deveConter) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'ExplosaoSolarMonitor/1.0' }, signal: AbortSignal.timeout(20000) })
    if (!r.ok) return `HTTP ${r.status}`
    if (deveConter) {
      const txt = await r.text()
      if (!txt.includes(deveConter)) return `resposta sem "${deveConter}"`
    }
    return null
  } catch (e) {
    return e.name === 'TimeoutError' ? 'timeout' : e.message
  }
}

function frescorConteudo() {
  try {
    let maisNova = 0
    for (const f of fs.readdirSync(PT_DIR)) {
      if (!f.endsWith('.json')) continue
      try {
        const a = JSON.parse(fs.readFileSync(path.join(PT_DIR, f), 'utf8'))
        const t = new Date(a.publishedAt).getTime()
        if (t > maisNova) maisNova = t
      } catch {}
    }
    return maisNova
  } catch {
    return 0
  }
}

async function main() {
  carregarEnv()
  const dry = process.argv.includes('--dry')
  const agora = Date.now()

  const problemas = []

  const home = await checarUrl(SITE, 'Explosão Solar')
  if (home) problemas.push(`🏠 Home fora do ar: ${home}`)

  const sitemap = await checarUrl(`${SITE}/sitemap.xml`, '<urlset')
  if (sitemap) problemas.push(`🗺️ Sitemap com erro: ${sitemap}`)

  const clima = await checarUrl(`${SITE}/clima/brasil/sp/sao-paulo`)
  if (clima) problemas.push(`🌤️ Página de clima com erro: ${clima}`)

  const maisNova = frescorConteudo()
  const horas = maisNova ? (agora - maisNova) / 3.6e6 : 999
  if (horas > MAX_HORAS_SEM_NOTICIA) {
    problemas.push(`📰 Sem notícia nova há ${Math.round(horas)}h — robô pode ter parado.`)
  }

  const status = problemas.length ? 'PROBLEMA' : 'OK'
  log(`${status} — ${problemas.length} problema(s); conteúdo mais novo há ${Math.round(horas)}h`)

  // Estado anterior (Firestore) para deduplicar alertas
  let email, listar, gravar
  try {
    email = await import(pathToFileURL(path.join(__dirname, '..', 'lib', 'email.js')).href)
    const fr = await import(pathToFileURL(path.join(__dirname, '..', 'lib', 'firestore-rest.js')).href)
    listar = fr.listar
    gravar = fr.gravar
  } catch (e) {
    log('libs indisponíveis: ' + e.message)
  }

  let anterior = null
  try {
    if (listar) anterior = (await listar('sistema')).find((d) => d._id === 'monitor') || null
  } catch {}

  const mudou = !anterior || anterior.status !== status
  const ultimoAlerta = anterior?.ultimoAlertaMs || 0
  const fazTempo = agora - ultimoAlerta > REPETIR_ALERTA_H * 3.6e6

  let alertou = false
  if (problemas.length && (mudou || fazTempo)) {
    if (email?.emailConfigurado?.() && !dry) {
      const corpo = problemas.map((p) => `<p style="margin:0 0 10px;font-size:15px;color:#131417">${p}</p>`).join('')
      const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <div style="background:#DC2626;color:#fff;font-weight:800;font-size:12px;letter-spacing:1.5px;padding:5px 12px;border-radius:999px;display:inline-block;margin-bottom:16px">⚠️ EXPLOSÃO SOLAR — MONITOR</div>
        <h1 style="font-size:20px;margin:0 0 16px;color:#131417">Encontrei ${problemas.length} problema(s) no portal</h1>
        ${corpo}
        <p style="font-size:12.5px;color:#8a8f98;margin-top:20px">Verificado em ${new Date(agora).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} · <a href="${SITE}" style="color:#FF6B00">explosaosolar.com</a></p>
      </div>`
      const r = await email.enviarEmail({
        para: AVISAR,
        assunto: `⚠️ Explosão Solar: ${problemas.length} problema(s) detectado(s)`,
        html,
        texto: `Problemas no Explosão Solar:\n\n${problemas.join('\n')}\n\n${SITE}`,
      })
      alertou = r.ok
      log(alertou ? `alerta enviado para ${AVISAR}` : `falha ao enviar alerta: ${r.erro || ''}`)
    } else {
      log(`(dry/sem e-mail) alertaria: ${problemas.join(' | ')}`)
      alertou = dry
    }
  } else if (mudou && status === 'OK' && anterior?.status === 'PROBLEMA') {
    // recuperou — avisa que voltou ao normal
    if (email?.emailConfigurado?.() && !dry) {
      await email.enviarEmail({
        para: AVISAR,
        assunto: '✅ Explosão Solar: tudo normalizado',
        html: `<div style="font-family:Arial,sans-serif;padding:24px"><h1 style="font-size:19px">✅ O portal voltou ao normal</h1><p>Todos os problemas anteriores foram resolvidos.</p></div>`,
        texto: 'Explosão Solar voltou ao normal.',
      })
      log('e-mail de recuperação enviado')
    }
  }

  if (gravar && !dry) {
    try {
      await gravar('sistema', 'monitor', {
        status,
        problemas: problemas.join(' | '),
        horasSemNoticia: Math.round(horas),
        ultimoCheckMs: agora,
        ultimoAlertaMs: alertou ? agora : ultimoAlerta,
        atualizado: new Date(agora).toISOString(),
      })
    } catch (e) {
      log('falha ao gravar estado: ' + e.message)
    }
  }
}

main().catch((e) => {
  log('ERRO FATAL: ' + (e.stack || e.message))
  process.exit(0) // monitor nunca derruba o pipeline
})
