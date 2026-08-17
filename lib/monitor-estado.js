// Estado do vigia dos sites. O robô roda no GitHub Actions (repo explosao-solar) a
// cada 30 min e versiona o resultado num JSON — sem banco, sem chave, sem cota.
// Aqui só lemos esse arquivo pelo endereço público do GitHub.
const FONTE = process.env.MONITOR_ESTADO_URL
  || 'https://raw.githubusercontent.com/DanieleMorais/explosao-solar/main/config/monitor-estado.json'

export async function lerEstado() {
  const r = await fetch(FONTE, { cache: 'no-store' })
  if (!r.ok) throw new Error(`não consegui baixar o estado do vigia (HTTP ${r.status})`)
  const e = await r.json()

  const sites = (e.sites || []).slice().sort(
    (a, b) => (b.problemas?.length || 0) - (a.problemas?.length || 0) || String(a.nome).localeCompare(b.nome)
  )
  const robos = (e.robos || []).slice().sort(
    (a, b) => (b.problemas?.length || 0) - (a.problemas?.length || 0) || String(a.nome).localeCompare(b.nome)
  )
  return {
    checadoEm: e.checadoEm || null,
    total: e.total ?? sites.length,
    comProblema: e.comProblema ?? sites.filter((s) => s.status === 'PROBLEMA').length,
    sites,
    robos,
    robosComProblema: e.robosComProblema ?? robos.filter((r) => r.status === 'PROBLEMA').length,
    historico: e.historico || [],
  }
}
