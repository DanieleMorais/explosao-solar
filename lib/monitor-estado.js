// Estado do vigia dos sites. O robô (scripts/monitor-sites.js) roda no GitHub Actions
// a cada 30 min e versiona o resultado em config/monitor-estado.json — sem banco,
// sem chave, sem cota. Lemos pelo endereço público do GitHub para ter sempre o
// dado mais novo (o arquivo do build congela no deploy).
const FONTE = process.env.MONITOR_ESTADO_URL
  || 'https://raw.githubusercontent.com/DanieleMorais/explosao-solar/main/config/monitor-estado.json'

export async function lerEstado() {
  const r = await fetch(FONTE, { cache: 'no-store' })
  if (!r.ok) throw new Error(`não consegui baixar o estado do vigia (HTTP ${r.status})`)
  const e = await r.json()

  const sites = (e.sites || []).slice().sort(
    (a, b) => (b.problemas?.length || 0) - (a.problemas?.length || 0) || String(a.nome).localeCompare(b.nome)
  )
  return {
    checadoEm: e.checadoEm || null,
    total: e.total ?? sites.length,
    comProblema: e.comProblema ?? sites.filter((s) => s.status === 'PROBLEMA').length,
    sites,
    historico: e.historico || [],
  }
}
