// Vigia 24h de TODOS os sites da Dani. Roda na nuvem (GitHub Actions) a cada 30 min.
// Checa o site por vários ângulos, guarda o estado em config/monitor-estado.json
// (versionado — sem banco, sem chave, sem cota) e MANDA E-MAIL a cada mudança.
// Uso: node scripts/monitor-sites.js [--dry] [--email-teste]
const fs = require('fs')
const path = require('path')
const tls = require('tls')

const RAIZ = path.join(__dirname, '..')
const SITES = JSON.parse(fs.readFileSync(path.join(RAIZ, 'config', 'sites.json'), 'utf8'))
const ARQ_ESTADO = path.join(RAIZ, 'config', 'monitor-estado.json')

const UA = { 'User-Agent': 'FadaMonitor/1.0 (+https://explosaosolar.com)' }
const LENTO_MS = 8000
const SSL_DIAS_MIN = 15
const HISTORICO_MAX = 200

const log = (m) => console.log(`[${new Date().toISOString()}] ${m}`)
const idDe = (nome) => nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function carregarEnv() {
  const f = path.join(RAIZ, '.env.robo')
  if (!fs.existsSync(f)) return
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/^([A-Z_0-9]+)=(.*)$/gm)) {
    if (m[2].trim()) process.env[m[1]] = process.env[m[1]] || m[2].trim()
  }
}

// ── checagens ────────────────────────────────────────────────────────────────

function diasDeSSL(hostname) {
  return new Promise((resolve) => {
    const s = tls.connect({ host: hostname, port: 443, servername: hostname, timeout: 12000 }, () => {
      const cert = s.getPeerCertificate()
      s.end()
      if (!cert || !cert.valid_to) return resolve(null)
      resolve(Math.round((new Date(cert.valid_to) - Date.now()) / 86400000))
    })
    s.on('error', () => resolve(null))
    s.on('timeout', () => { s.destroy(); resolve(null) })
  })
}

const pausa = (ms) => new Promise((r) => setTimeout(r, ms))

// 429 NÃO é site fora do ar: o servidor respondeu, só está limitando nosso robô.
// O Blogger/Google faz isso com IP de datacenter (o do GitHub Actions). Chamar
// isso de queda gera alarme falso — e alarme falso faz a Dani parar de ler o e-mail.
const ehLimite = (s) => s === 429 || s === 999

async function checarUrl(url, rotulo) {
  // devolve { problemas[], notas[], html, ms, status } — rotulo entra na mensagem
  const problemas = []
  const notas = []
  const t0 = Date.now()
  let ultimo = { status: 0, motivo: '' }

  // até 3 tentativas: erro de rede, 5xx e 429 costumam ser passageiros.
  // Só reclama depois de insistir — assim o e-mail só sai de problema de verdade.
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    if (tentativa > 1) await pausa(tentativa * 4000)
    try {
      const r = await fetch(url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(25000) })
      const html = await r.text()
      if (r.ok) return { problemas, notas, html, ms: Date.now() - t0, status: r.status, final: r.url }
      ultimo = { status: r.status, motivo: `HTTP ${r.status}` }
      if (!ehLimite(r.status) && r.status < 500) break // 404, 403… não melhora tentando de novo
    } catch (e) {
      ultimo = { status: 0, motivo: e.name === 'TimeoutError' ? 'demorou demais (mais de 25s)' : e.message }
    }
  }

  if (ehLimite(ultimo.status)) {
    notas.push(`${rotulo} respondeu ${ultimo.status} (o Google está limitando nosso robô) — o site está no ar para quem visita`)
  } else if (ultimo.status) {
    problemas.push(`${rotulo} fora do ar (${ultimo.motivo})`)
  } else {
    problemas.push(`${rotulo} inacessível (${ultimo.motivo})`)
  }
  return { problemas, notas, html: '', ms: Date.now() - t0, status: ultimo.status, final: url }
}

async function checar(site) {
  const problemas = []
  const notas = []
  const r = await checarUrl(site.url, 'site')
  problemas.push(...r.problemas)
  notas.push(...r.notas)

  if (r.status && r.status < 400) {
    if (r.html.length < 400) problemas.push(`página praticamente vazia (${r.html.length} bytes)`)
    if (r.ms > LENTO_MS) problemas.push(`site lento (${(r.ms / 1000).toFixed(1)}s para responder)`)

    const titulo = (r.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]
    if (!titulo || !titulo.trim()) problemas.push('página sem título (ruim para o Google)')

    const sinais = [
      [/This Serverless Function has crashed/i, 'função do servidor quebrou'],
      [/DEPLOYMENT_NOT_FOUND|NOT_FOUND.*vercel/i, 'deploy não encontrado na Vercel'],
      [/Application error: a (client|server)-side exception/i, 'erro de aplicação no navegador'],
      [/<title[^>]*>\s*(500|502|503|404)\b/i, 'página devolvendo erro'],
    ]
    for (const [re, msg] of sinais) if (re.test(r.html)) problemas.push(msg)

    try {
      const alvo = new URL(r.final), origem = new URL(site.url)
      const raiz = (h) => h.replace(/^www\./, '').split('.').slice(-2).join('.')
      if (raiz(alvo.hostname) !== raiz(origem.hostname)) problemas.push(`redirecionando para outro domínio (${alvo.hostname})`)
    } catch {}
  }

  // certificado
  try {
    const dias = await diasDeSSL(new URL(site.url).hostname)
    if (dias !== null && dias < 0) problemas.push('certificado de segurança VENCIDO')
    else if (dias !== null && dias < SSL_DIAS_MIN) problemas.push(`certificado vence em ${dias} dia(s)`)
  } catch {}

  // sitemap (só quando o site declara ter um)
  if (site.sitemap) {
    await pausa(800) // não atropelar o mesmo servidor — é o que dispara o 429
    const s = await checarUrl(site.sitemap, 'sitemap')
    problemas.push(...s.problemas)
    notas.push(...s.notas)
    if (s.status && s.status < 400 && !/<(urlset|sitemapindex)/i.test(s.html)) {
      problemas.push('sitemap inválido (sem <urlset>)')
    }
  }

  // robots.txt — erro de servidor conta; 404 é só ausência e 429 é limite, não quebra
  try {
    await pausa(800)
    const u = new URL('/robots.txt', site.url).href
    const rb = await fetch(u, { headers: UA, signal: AbortSignal.timeout(15000) })
    if (rb.status >= 500) problemas.push(`robots.txt com erro (HTTP ${rb.status})`)
  } catch {}

  return { problemas, notas, ms: r.ms }
}

// ── robôs de conteúdo ────────────────────────────────────────────────────────
// Robô que para de publicar não derruba site nenhum — some em silêncio. Por isso
// medimos o RESULTADO (data do último artigo), não só se a engrenagem rodou.

const ROBOS = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(RAIZ, 'config', 'robos.json'), 'utf8')) } catch { return [] }
})()

async function ultimoPostPorFeed(feed) {
  const r = await fetch(`${feed}?alt=json&max-results=1&orderby=published`, { headers: UA, signal: AbortSignal.timeout(25000) })
  if (!r.ok) throw new Error(`feed HTTP ${r.status}`)
  const j = await r.json()
  const e = (j.feed.entry || [])[0]
  if (!e) throw new Error('feed sem artigo')
  return { data: e.published.$t, titulo: e.title?.$t || '', total: Number(j.feed.openSearch$totalResults?.$t) || null }
}

async function ultimoPostPorSitemap(sitemap) {
  const pegar = async (u) => {
    const r = await fetch(u, { headers: UA, signal: AbortSignal.timeout(25000) })
    if (!r.ok) throw new Error(`sitemap HTTP ${r.status}`)
    return r.text()
  }
  let xml = await pegar(sitemap)
  if (/<sitemapindex/i.test(xml)) {
    const filho = (xml.match(/<loc>([^<]+)<\/loc>/i) || [])[1]
    if (filho) xml = await pegar(filho)
  }
  const datas = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/gi)].map((m) => new Date(m[1])).filter((d) => !isNaN(d))
  if (!datas.length) throw new Error('sitemap sem lastmod')
  const max = new Date(Math.max(...datas))
  return { data: max.toISOString(), titulo: '', total: (xml.match(/<loc>/g) || []).length }
}

// repo público: leitura sem token. Se o GitHub limitar, devolve null e NÃO vira alarme.
async function ultimaExecucao(repo, workflow) {
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${workflow}/runs?per_page=1`, {
      headers: { 'User-Agent': 'FadaMonitor/1.0', Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(20000),
    })
    if (!r.ok) return null
    const j = await r.json()
    const run = (j.workflow_runs || [])[0]
    if (!run) return null
    return { conclusao: run.conclusion, quando: run.created_at, url: run.html_url }
  } catch { return null }
}

async function checarRobos() {
  const out = []
  for (const robo of ROBOS) {
    const problemas = []
    const notas = []
    let ultimo = null
    try {
      ultimo = robo.feed ? await ultimoPostPorFeed(robo.feed) : await ultimoPostPorSitemap(robo.sitemap)
    } catch (e) {
      problemas.push(`não consegui ver os artigos (${e.message})`)
    }

    let dias = null
    if (ultimo) {
      dias = Math.floor((Date.now() - new Date(ultimo.data)) / 86400000)
      if (dias > robo.maxDias) {
        problemas.push(`parou de publicar: último artigo há ${dias} dias (o esperado é no máximo ${robo.maxDias})`)
      }
    }

    const exec = await ultimaExecucao(robo.repo, robo.workflow)
    if (exec && exec.conclusao && exec.conclusao !== 'success') {
      // a última execução falhar não quer dizer que parou — mas é o aviso antes do prejuízo
      notas.push(`a última execução do robô terminou em "${exec.conclusao}"`)
    }

    const status = problemas.length ? 'PROBLEMA' : 'OK'
    log(`${status.padEnd(8)} [robô] ${robo.nome}${ultimo ? ` — último artigo há ${dias} dia(s)` : ''}${problemas.length ? ' — ' + problemas.join('; ') : ''}`)
    out.push({
      id: idDe(robo.nome), nome: robo.nome, url: robo.blog, tipo: 'robo', status, problemas, notas,
      ultimoArtigo: ultimo?.data || null, diasSemPublicar: dias, tituloUltimo: ultimo?.titulo || '',
      totalArtigos: ultimo?.total ?? null,
      ultimaExecucao: exec || null, checadoEm: new Date().toISOString(),
    })
    await pausa(600)
  }
  return out
}

// ── e-mail ───────────────────────────────────────────────────────────────────

const PARA = process.env.MONITOR_EMAIL_PARA || 'fadamadrinhadm@gmail.com'
const DE = process.env.MONITOR_EMAIL_DE || 'Vigia Fada Madrinha <vigia@universidadefadamadrinha.com>'
const PAINEL = 'https://saude.agenciafadamadrinha.com'

async function mandarEmail(assunto, html, texto) {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, erro: 'RESEND_API_KEY ausente' }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: DE, to: [PARA], reply_to: 'fadamadrinhadm@gmail.com', subject: assunto, html, text: texto }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) return { ok: false, erro: data?.message || `HTTP ${r.status}` }
  return { ok: true, id: data.id }
}

function montarEmail(quebrou, voltou) {
  const linha = (t) => `<div style="padding:12px 14px;border-radius:10px;margin-bottom:8px;${t.tipo === 'conserto'
    ? 'background:#ecfdf5;border-left:4px solid #16A34A'
    : 'background:#fef2f2;border-left:4px solid #DC2626'}">
    <div style="font-weight:700;font-size:15px;color:#131417">${t.nome}</div>
    <div style="font-size:13.5px;color:#4b5563;margin-top:3px">${t.descricao}</div>
    <a href="${t.url}" style="font-size:12px;color:#6b7280">${t.url.replace(/^https?:\/\//, '')}</a>
  </div>`

  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f4f0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#0C0E1A;border-radius:14px 14px 0 0;padding:22px 26px">
      <div style="color:#FFB300;font-size:11px;letter-spacing:2px;font-weight:800;text-transform:uppercase">Vigia dos Sites</div>
      <div style="color:#fff;font-size:19px;font-weight:900;margin-top:4px">
        ${quebrou.length ? `${quebrou.length} site(s) com problema` : 'Tudo voltou ao normal'}
      </div>
    </div>
    <div style="background:#fff;border:1px solid #e9e6df;border-top:none;border-radius:0 0 14px 14px;padding:22px 24px">
      ${quebrou.length ? `<div style="font-size:13px;font-weight:800;color:#DC2626;margin:0 0 10px">DEU PROBLEMA</div>${quebrou.map(linha).join('')}` : ''}
      ${voltou.length ? `<div style="font-size:13px;font-weight:800;color:#16A34A;margin:${quebrou.length ? '18px' : '0'} 0 10px">VOLTOU AO NORMAL</div>${voltou.map(linha).join('')}` : ''}
      <a href="${PAINEL}" style="display:inline-block;margin-top:18px;background:#0C0E1A;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;font-size:14px">Abrir o painel</a>
      <p style="font-size:12px;color:#9ca3af;margin:16px 0 0">Checagem automática a cada 30 minutos.</p>
    </div>
  </div></body></html>`

  const texto = [
    ...quebrou.map((t) => `[PROBLEMA] ${t.nome}: ${t.descricao} (${t.url})`),
    ...voltou.map((t) => `[OK] ${t.nome}: ${t.descricao} (${t.url})`),
    '', PAINEL,
  ].join('\n')

  const assunto = quebrou.length
    ? `⚠️ ${quebrou.length === 1 ? quebrou[0].nome + ' com problema' : quebrou.length + ' sites com problema'}`
    : `✅ ${voltou.length === 1 ? voltou[0].nome + ' voltou' : voltou.length + ' sites voltaram'} ao normal`

  return { assunto, html, texto }
}

// ── principal ────────────────────────────────────────────────────────────────

async function main() {
  carregarEnv()
  const dry = process.argv.includes('--dry')
  const agora = new Date().toISOString()

  let antes = { sites: [], historico: [] }
  try { antes = JSON.parse(fs.readFileSync(ARQ_ESTADO, 'utf8')) } catch {}
  const anteriores = Object.fromEntries((antes.sites || []).map((s) => [s.id, s]))

  const sites = []
  const quebrou = []
  const voltou = []
  const eventos = []

  for (const site of SITES) {
    const { problemas, notas, ms } = await checar(site)
    const id = idDe(site.nome)
    const status = problemas.length ? 'PROBLEMA' : 'OK'
    const antesDele = anteriores[id]
    const problemasAntes = antesDele ? antesDele.problemas || [] : null

    log(`${status.padEnd(8)} ${site.nome}${problemas.length ? ' — ' + problemas.join('; ') : ''}${notas.length ? ' (aviso: ' + notas.join('; ') + ')' : ''}`)
    sites.push({ id, nome: site.nome, url: site.url, status, problemas, notas, ms, checadoEm: agora })

    // primeira vez que vejo o site: só avisa se já nasce quebrado
    const novos = problemasAntes === null ? problemas : problemas.filter((p) => !problemasAntes.includes(p))
    const resolvidos = problemasAntes === null ? [] : problemasAntes.filter((p) => !problemas.includes(p))

    if (novos.length) {
      const desc = novos.join(' · ')
      quebrou.push({ nome: site.nome, url: site.url, descricao: desc, tipo: 'erro' })
      eventos.push({ site: site.nome, tipo: 'erro', descricao: desc, quando: agora })
    }
    if (resolvidos.length) {
      const desc = problemas.length ? `resolvido: ${resolvidos.join(' · ')}` : 'voltou ao normal'
      voltou.push({ nome: site.nome, url: site.url, descricao: desc, tipo: 'conserto' })
      eventos.push({ site: site.nome, tipo: 'conserto', descricao: desc, quando: agora })
    }
  }

  // robôs de conteúdo — mesma régua de aviso dos sites
  const robos = await checarRobos()
  const robosAntes = Object.fromEntries((antes.robos || []).map((r) => [r.id, r]))
  for (const r of robos) {
    const antesDele = robosAntes[r.id]
    const problemasAntes = antesDele ? antesDele.problemas || [] : null
    const novos = problemasAntes === null ? r.problemas : r.problemas.filter((p) => !problemasAntes.includes(p))
    const resolvidos = problemasAntes === null ? [] : problemasAntes.filter((p) => !r.problemas.includes(p))
    if (novos.length) {
      const desc = novos.join(' · ')
      quebrou.push({ nome: r.nome, url: r.url, descricao: desc, tipo: 'erro' })
      eventos.push({ site: r.nome, tipo: 'erro', descricao: desc, quando: agora })
    }
    if (resolvidos.length) {
      const desc = r.problemas.length ? `resolvido: ${resolvidos.join(' · ')}` : 'voltou a publicar'
      voltou.push({ nome: r.nome, url: r.url, descricao: desc, tipo: 'conserto' })
      eventos.push({ site: r.nome, tipo: 'conserto', descricao: desc, quando: agora })
    }
  }

  const comProblema = sites.filter((s) => s.status === 'PROBLEMA').length
  const robosComProblema = robos.filter((r) => r.status === 'PROBLEMA').length
  const estado = {
    checadoEm: agora,
    total: sites.length,
    comProblema,
    sites,
    robos,
    robosComProblema,
    historico: [...eventos, ...(antes.historico || [])].slice(0, HISTORICO_MAX),
  }

  if (!dry) fs.writeFileSync(ARQ_ESTADO, JSON.stringify(estado, null, 2) + '\n')

  if ((quebrou.length || voltou.length) && !dry) {
    const { assunto, html, texto } = montarEmail(quebrou, voltou)
    const env = await mandarEmail(assunto, html, texto)
    // e-mail que falha em silêncio é pior que não ter e-mail: falha o job
    if (!env.ok) { log('ERRO ao enviar e-mail: ' + env.erro); process.exitCode = 1 }
    else log(`e-mail enviado para ${PARA} (${env.id})`)
  }

  log(`fim: ${sites.length} sites (${comProblema} com problema), ${robos.length} robôs (${robosComProblema} com problema), ${quebrou.length} novo(s) erro(s), ${voltou.length} conserto(s)`)
}

main().catch((e) => { log('ERRO FATAL: ' + (e.stack || e.message)); process.exit(1) })
