// Diagnóstico de indexação no Google Search Console + inspeção das últimas matérias.
// Uso: node scripts/seo-check.js
const fs = require('fs')
const path = require('path')
const { api } = require('./google')

const PT_DIR = path.join(__dirname, '..', 'content', 'articles')
const SITE = 'https://explosaosolar.com'

function ultimas(n) {
  return fs
    .readdirSync(PT_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => { try { return JSON.parse(fs.readFileSync(path.join(PT_DIR, f), 'utf8')) } catch { return null } })
    .filter((a) => a && a.slug)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, n)
}

async function main() {
  // 1) propriedades verificadas
  const sites = await api('https://www.googleapis.com/webmasters/v3/sites')
  if (!sites.ok) return console.log('ERRO ao listar sites:', sites.status, JSON.stringify(sites.data).slice(0, 200))
  const props = (sites.data.siteEntry || []).map((s) => `${s.siteUrl} (${s.permissionLevel})`)
  console.log('=== Propriedades no Search Console ===')
  props.forEach((p) => console.log('  ' + p))

  // escolhe a propriedade do explosaosolar
  const entry = (sites.data.siteEntry || []).find((s) => /explosaosolar\.com($|\/|["']?$)/.test(s.siteUrl) && !/com\.br/.test(s.siteUrl))
  const siteUrl = entry?.siteUrl
  if (!siteUrl) {
    console.log('\n⚠️ explosaosolar.com NÃO está entre as propriedades verificadas — Google não indexa sem isso.')
    return
  }
  console.log('\nusando propriedade:', siteUrl)

  // 2) sitemaps
  const sm = await api(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`)
  console.log('\n=== Sitemaps ===')
  if (sm.ok && (sm.data.sitemap || []).length) {
    for (const s of sm.data.sitemap) {
      const c = (s.contents || []).map((x) => `${x.type}:${x.submitted}`).join(' ')
      console.log(`  ${s.path}\n    último download: ${s.lastDownloaded || 'nunca'} | erros: ${s.errors || 0} | avisos: ${s.warnings || 0} | ${c}`)
    }
  } else {
    console.log('  (nenhum sitemap enviado!)', sm.ok ? '' : sm.status)
  }

  // 3) inspeção das últimas matérias
  console.log('\n=== Inspeção das últimas matérias ===')
  for (const a of ultimas(4)) {
    const url = `${SITE}/noticia/${a.slug}`
    const r = await api('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST',
      body: { inspectionUrl: url, siteUrl, languageCode: 'pt-BR' },
    })
    if (!r.ok) { console.log(`  ✗ ${a.slug}: ${r.status} ${JSON.stringify(r.data).slice(0, 120)}`); continue }
    const idx = r.data.inspectionResult?.indexStatusResult || {}
    console.log(`  ${a.slug}`)
    console.log(`     veredito: ${idx.verdict} | cobertura: ${idx.coverageState}`)
    console.log(`     robots: ${idx.robotsTxtState} | indexável: ${idx.indexingState} | último crawl: ${idx.lastCrawlTime || 'nunca'}`)
    if (idx.pageFetchState && idx.pageFetchState !== 'SUCCESSFUL') console.log(`     ⚠️ fetch: ${idx.pageFetchState}`)
    await new Promise((s) => setTimeout(s, 800))
  }
}

main().catch((e) => console.error('ERRO:', e.stack || e.message))
