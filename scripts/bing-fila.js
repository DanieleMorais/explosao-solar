// Fila do Bing Webmaster para TODOS os sites verificados da Dani (não só o Explosão).
// O Bing aceita ~100 URLs por dia por site: todo dia manda o próximo lote do mapa de
// cada site e guarda o que já foi em data/bing-fila.json. Roda no GitHub porque o
// Bing bloqueia chamadas vindas da Cloudflare ("ThrottleIP").
// Explosão Solar fica de fora: ele já avisa o Bing pelo IndexNow, sem limite.
// Uso: BING_API_KEY=... node scripts/bing-fila.js [--seco]

const fs = require('fs')
const path = require('path')

const KEY = process.env.BING_API_KEY
const API = 'https://ssl.bing.com/webmaster/api.svc/json/'
const ESTADO = path.join(__dirname, '..', 'data', 'bing-fila.json')
const RELATORIO = path.join(__dirname, '..', 'data', 'bing-fila-relatorio.json')
const FORA = ['explosaosolar.com']
const SECO = process.argv.includes('--seco')

async function bing(metodo, query = '', corpo) {
  const r = await fetch(API + metodo + '?apikey=' + KEY + query, corpo
    ? { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(corpo), signal: AbortSignal.timeout(30000) }
    : { signal: AbortSignal.timeout(30000) })
  const t = await r.text()
  if (!r.ok) throw new Error(`${metodo} HTTP ${r.status}: ${t.slice(0, 120)}`)
  try { return JSON.parse(t).d } catch { return null }
}

async function lerMapa(url, prof = 0) {
  if (prof > 2) return []
  try {
    const r = await fetch(url, { headers: { 'user-agent': 'bing-fila (Agencia Fada Madrinha)' }, signal: AbortSignal.timeout(30000) })
    if (!r.ok) return []
    const xml = await r.text()
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, '&'))
    if (!/<sitemapindex/i.test(xml)) return locs
    let todas = []
    for (const filho of locs.slice(0, 20)) todas = todas.concat(await lerMapa(filho, prof + 1))
    return todas
  } catch { return [] }
}

async function mapasDoSite(site) {
  const mapas = new Set()
  try {
    const r = await fetch(site + 'robots.txt', { signal: AbortSignal.timeout(15000) })
    if (r.ok) for (const m of (await r.text()).matchAll(/^\s*sitemap:\s*(\S+)/gim)) mapas.add(m[1].trim())
  } catch {}
  if (!mapas.size) mapas.add(site + 'sitemap.xml')
  return [...mapas]
}

const host = (u) => new URL(u).host.replace(/^www\./, '')

async function main() {
  if (!KEY) throw new Error('falta BING_API_KEY')
  const estado = fs.existsSync(ESTADO) ? JSON.parse(fs.readFileSync(ESTADO, 'utf8')) : {}
  const sites = ((await bing('GetUserSites')) || []).map((s) => s.Url).filter((s) => !FORA.includes(host(s)))
  const rel = { quando: new Date().toISOString(), sites: [] }
  for (const site of sites) {
    const linha = { site, enviadas: 0, faltam: 0, no_mapa: 0, erro: null }
    try {
      const cota = ((await bing('GetUrlSubmissionQuota', '&siteUrl=' + encodeURIComponent(site))) || {}).DailyQuota || 0
      let urls = []
      for (const m of await mapasDoSite(site)) urls = urls.concat(await lerMapa(m))
      // Só páginas do próprio domínio: mapa de outro domínio o Bing recusa (endereços que redirecionam).
      urls = [...new Set(urls)].filter((u) => { try { return host(u) === host(site) } catch { return false } })
      const ja = new Set(estado[host(site)] || [])
      const novas = urls.filter((u) => !ja.has(u))
      const lote = novas.slice(0, Math.max(0, Math.min(cota - 1, 100)))
      if (lote.length && !SECO) {
        await bing('SubmitUrlBatch', '', { siteUrl: site, urlList: lote })
        lote.forEach((u) => ja.add(u))
        estado[host(site)] = [...ja]
      }
      Object.assign(linha, { enviadas: lote.length, faltam: novas.length - lote.length, no_mapa: urls.length })
    } catch (e) {
      linha.erro = e.message
    }
    rel.sites.push(linha)
  }
  if (!SECO) {
    fs.writeFileSync(ESTADO, JSON.stringify(estado))
    fs.writeFileSync(RELATORIO, JSON.stringify(rel, null, 1))
  }
  let env = 0, fal = 0
  for (const l of rel.sites) {
    env += l.enviadas; fal += l.faltam
    console.log(`${host(l.site).padEnd(40)} enviadas ${String(l.enviadas).padStart(3)} | faltam ${String(l.faltam).padStart(5)} | no mapa ${String(l.no_mapa).padStart(5)}${l.erro ? ' | ERRO ' + l.erro : ''}`)
  }
  console.log(`TOTAL: ${env} enviadas hoje, ${fal} na fila${SECO ? ' (simulação: nada foi enviado)' : ''}`)
}

main().catch((e) => { console.error('bing-fila falhou:', e.message); process.exit(1) })
