// Monitor de saúde de TODOS os sites da Dani. Checa no ar + sitemap, grava o
// estado no Firestore (coleção monitor_sites) e registra erros/consertos num
// histórico (monitor_log). Roda na nuvem a cada 30 min. Uso: node scripts/monitor-sites.js [--dry]
const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')

const SITES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'sites.json'), 'utf8'))
const UA = { 'User-Agent': 'FadaMonitor/1.0 (+https://explosaosolar.com)' }
const log = (m) => console.log(`[${new Date().toISOString()}] ${m}`)

function carregarEnv() {
  const f = path.join(__dirname, '..', '.env.robo')
  if (!fs.existsSync(f)) return
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/^([A-Z_0-9]+)=(.+)$/gm)) process.env[m[1]] = process.env[m[1]] || m[2].trim()
}

const idDe = (nome) => nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function checar(site) {
  const problemas = []
  // 1) home no ar
  try {
    const r = await fetch(site.url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(20000) })
    if (!r.ok) problemas.push(`site fora do ar (HTTP ${r.status})`)
    else {
      const txt = await r.text()
      if (txt.length < 400) problemas.push('página praticamente vazia')
    }
  } catch (e) {
    problemas.push(`site inacessível (${e.name === 'TimeoutError' ? 'timeout' : e.message})`)
  }
  // 2) sitemap
  if (site.sitemap) {
    try {
      const r = await fetch(site.sitemap, { headers: UA, signal: AbortSignal.timeout(20000) })
      if (!r.ok) problemas.push(`sitemap com erro (HTTP ${r.status})`)
      else {
        const x = await r.text()
        if (!/<(urlset|sitemapindex)/i.test(x)) problemas.push('sitemap inválido (sem <urlset>)')
      }
    } catch {
      problemas.push('sitemap inacessível')
    }
  }
  return problemas
}

async function main() {
  carregarEnv()
  const dry = process.argv.includes('--dry')
  const agora = new Date().toISOString()

  let gravar, listar
  if (!dry) {
    const fr = await import(pathToFileURL(path.join(__dirname, '..', 'lib', 'firestore-rest.js')).href)
    gravar = fr.gravar
    listar = fr.listar
  }

  let anteriores = {}
  try {
    if (listar) for (const d of await listar('monitor_sites')) anteriores[d.id] = d
  } catch {}

  const logs = []
  let comProblema = 0
  for (const site of SITES) {
    const problemas = await checar(site)
    const status = problemas.length ? 'PROBLEMA' : 'OK'
    if (problemas.length) comProblema++
    const id = idDe(site.nome)
    const antes = anteriores[id]

    // registra mudança de estado no histórico
    if (antes && antes.status !== status) {
      if (status === 'PROBLEMA') logs.push({ site: site.nome, tipo: 'erro', descricao: problemas.join(' · '), quando: agora })
      else logs.push({ site: site.nome, tipo: 'conserto', descricao: 'voltou ao normal', quando: agora })
    } else if (!antes && problemas.length) {
      logs.push({ site: site.nome, tipo: 'erro', descricao: problemas.join(' · '), quando: agora })
    }

    log(`${status.padEnd(8)} ${site.nome}${problemas.length ? ' — ' + problemas.join('; ') : ''}`)
    if (gravar) {
      await gravar('monitor_sites', id, {
        nome: site.nome, url: site.url, status,
        problemas: problemas.join(' · '),
        qtdProblemas: problemas.length,
        checadoEm: agora,
      })
    }
  }

  // grava os novos itens de histórico
  if (gravar && logs.length) {
    for (const l of logs) {
      const key = idDe(l.site) + '-' + Date.now() + '-' + Math.round(performance.now())
      await gravar('monitor_log', key, l)
    }
  }
  log(`fim: ${SITES.length} sites, ${comProblema} com problema, ${logs.length} evento(s) no histórico`)
}

main().catch((e) => { log('ERRO FATAL: ' + (e.stack || e.message)); process.exit(0) })
