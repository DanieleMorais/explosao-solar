// Pingador de indexação genérico p/ QUALQUER site verificado no Search Console.
// Lê o sitemap (segue índice), pega as N URLs mais recentes, pinga o Indexing API
// e submete o sitemap. Uso: node scripts/indexar-site.js <sitemapUrl> [N] [sc-property]
const { api } = require('./google')

async function locs(url, prof = 0) {
  if (prof > 3) return []
  const r = await fetch(url, { headers: { 'User-Agent': 'ExplosaoBot/1.0' }, signal: AbortSignal.timeout(20000) })
  if (!r.ok) return []
  const xml = await r.text()
  if (/<sitemapindex/i.test(xml)) {
    const filhos = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1].trim())
    let all = []
    for (const f of filhos.slice(0, 8)) all = all.concat(await locs(f, prof + 1))
    return all
  }
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1].trim())
}

async function main() {
  const sitemap = process.argv[2]
  const N = parseInt(process.argv[3] || '20', 10)
  const prop = process.argv[4]
  if (!sitemap) throw new Error('informe a URL do sitemap')

  let urls = await locs(sitemap)
  // remove a própria home/estáticas óbvias, mantém páginas/posts
  urls = [...new Set(urls)].filter((u) => !/\.(xml|txt|jpg|png|css|js)$/i.test(u))
  const alvo = urls.slice(0, N)
  console.log(`${sitemap}\n  ${urls.length} URLs no sitemap → pingando ${alvo.length}`)

  let ok = 0, falha = 0
  for (const url of alvo) {
    const r = await api('https://indexing.googleapis.com/v3/urlNotifications:publish', { method: 'POST', body: { url, type: 'URL_UPDATED' } })
    r.ok ? ok++ : (falha++, falha <= 2 && console.log(`   ✗ ${r.status} ${url} ${JSON.stringify(r.data).slice(0, 90)}`))
    await new Promise((s) => setTimeout(s, 250))
  }
  console.log(`  ping: ${ok} ok, ${falha} falha`)

  if (prop) {
    const s = await api(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(prop)}/sitemaps/${encodeURIComponent(sitemap)}`, { method: 'PUT' })
    console.log(`  sitemap submetido: ${s.ok ? 'OK' : s.status}`)
  }
}

main().catch((e) => console.error('ERRO:', e.message))
