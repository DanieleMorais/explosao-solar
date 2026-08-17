// Publica as matérias novas no canal do Telegram (Bot API). Seguro por padrão:
// sem TELEGRAM_BOT_TOKEN + TELEGRAM_CHANNEL, só simula (dry-run).
// Estado em scripts/telegram-state.json. Uso: node scripts/telegram.js [--seed] [--max N] [--dry]
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const PT_DIR = path.join(ROOT, 'content', 'articles')
const STATE = path.join(__dirname, 'telegram-state.json')
const SITE = 'https://explosaosolar.com'
const log = (m) => console.log(`[${new Date().toISOString()}] ${m}`)

function carregarEnv() {
  const f = path.join(ROOT, '.env.robo')
  if (!fs.existsSync(f)) return
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/^([A-Z_0-9]+)=(.+)$/gm)) process.env[m[1]] = process.env[m[1]] || m[2].trim()
}

const HASHTAGS = {
  mundo: '#mundo', brasil: '#brasil', politica: '#política', economia: '#economia',
  tecnologia: '#tecnologia', ciencia: '#ciência', esportes: '#esportes', cultura: '#cultura',
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function legenda(a) {
  const link = `${SITE}/noticia/${a.slug}`
  const resumo = a.excerpt ? `\n\n${esc(String(a.excerpt).slice(0, 350))}` : ''
  return `<b>${esc(a.title)}</b>${resumo}\n\n🔗 <a href="${link}">Leia a matéria completa</a>\n\n${HASHTAGS[a.categorySlug] || ''} #explosãosolar ☀️`
}

const carregar = () => { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')) } catch { return { postados: [] } } }
const salvar = (e) => fs.writeFileSync(STATE, JSON.stringify(e, null, 2))

function novos(estado, max) {
  const jaFoi = new Set(estado.postados)
  return fs.readdirSync(PT_DIR).filter((f) => f.endsWith('.json'))
    .map((f) => { try { return JSON.parse(fs.readFileSync(path.join(PT_DIR, f), 'utf8')) } catch { return null } })
    .filter((a) => a && a.slug && !jaFoi.has(a.slug))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, max)
}

async function enviar(a, token, canal) {
  const url = a.imagem ? `https://api.telegram.org/bot${token}/sendPhoto` : `https://api.telegram.org/bot${token}/sendMessage`
  const body = a.imagem
    ? { chat_id: canal, photo: a.imagem, caption: legenda(a), parse_mode: 'HTML' }
    : { chat_id: canal, text: legenda(a), parse_mode: 'HTML', disable_web_page_preview: false }
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => ({}))
  return j.ok ? { ok: true } : { ok: false, erro: j.description || `HTTP ${r.status}` }
}

async function main() {
  carregarEnv()
  const dry = process.argv.includes('--dry')
  const seed = process.argv.includes('--seed')
  const max = process.argv.includes('--max') ? parseInt(process.argv[process.argv.indexOf('--max') + 1], 10) : 3
  const token = process.env.TELEGRAM_BOT_TOKEN
  const canal = process.env.TELEGRAM_CHANNEL
  const ligado = token && canal && !dry

  const estado = carregar()
  if (seed) {
    const todas = fs.readdirSync(PT_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
    estado.postados = [...new Set([...estado.postados, ...todas])].slice(-3000)
    salvar(estado)
    return log(`seed: ${estado.postados.length} marcadas`)
  }

  const lista = novos(estado, max)
  log(`${lista.length} matéria(s) nova(s)${ligado ? '' : ' (DRY — sem token, nada enviado)'}`)
  let ok = 0
  for (const a of lista) {
    if (!ligado) { log(`DRY: ${a.title.slice(0, 70)}`); continue }
    const r = await enviar(a, token, canal)
    if (r.ok) { ok++; estado.postados.push(a.slug); log(`✓ ${a.slug}`) }
    else log(`✗ ${a.slug}: ${r.erro}`)
    await new Promise((s) => setTimeout(s, 3000))
  }
  if (ligado) { estado.postados = estado.postados.slice(-3000); salvar(estado); log(`fim: ${ok} enviados`) }
}

main().catch((e) => { log('ERRO: ' + (e.stack || e.message)); process.exit(0) })
