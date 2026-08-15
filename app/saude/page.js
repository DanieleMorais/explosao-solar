import crypto from 'crypto'
import { listar } from '@/lib/firestore-rest'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const metadata = { title: 'Painel de Saúde', robots: { index: false, follow: false } }

function tokenValido(t) {
  const secret = process.env.FIREBASE_SA_B64 || ''
  const esperado = crypto.createHash('sha256').update(secret + 'painel-saude-v1').digest('hex').slice(0, 20)
  return t && t === esperado
}

function quando(iso) {
  try {
    return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

const C = { bg: '#0C0E1A', card: '#161A2C', line: 'rgba(255,255,255,0.10)', ink: '#fff', mut: '#9aa0b4', ok: '#16A34A', bad: '#DC2626', sun: '#FFB300' }

export default async function Painel({ searchParams }) {
  const sp = await searchParams
  if (!tokenValido(sp?.t)) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui,sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>🔒</div>
          <p style={{ color: C.mut }}>Acesso restrito. Link com token inválido.</p>
        </div>
      </div>
    )
  }

  let sites = []
  let logs = []
  try {
    sites = await listar('monitor_sites')
    logs = await listar('monitor_log')
  } catch {}
  sites.sort((a, b) => (b.qtdProblemas || 0) - (a.qtdProblemas || 0) || String(a.nome).localeCompare(b.nome))
  logs.sort((a, b) => new Date(b.quando) - new Date(a.quando))
  logs = logs.slice(0, 40)

  const comProblema = sites.filter((s) => s.status === 'PROBLEMA').length
  const ultima = sites[0]?.checadoEm

  const box = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', padding: '28px 18px 60px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 2, color: C.sun, fontWeight: 800, textTransform: 'uppercase' }}>☀ Fada Madrinha</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, margin: '4px 0 0' }}>Painel de Saúde dos Sites</h1>
          </div>
          <div style={{ textAlign: 'right', fontSize: 13, color: C.mut }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: comProblema ? C.bad : C.ok }}>{comProblema === 0 ? '✓ Tudo no ar' : `${comProblema} com problema`}</div>
            {ultima && <div>última checagem: {quando(ultima)}</div>}
          </div>
        </header>

        {sites.length === 0 && (
          <div style={{ ...box, textAlign: 'center', color: C.mut }}>Aguardando a primeira checagem do robô (roda a cada 30 min)…</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 30 }}>
          {sites.map((s) => {
            const bad = s.status === 'PROBLEMA'
            return (
              <a key={s.id} href={s.url} target="_blank" rel="noreferrer" style={{ ...box, textDecoration: 'none', color: C.ink, borderLeft: `4px solid ${bad ? C.bad : C.ok}`, display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: bad ? C.bad : C.ok, boxShadow: `0 0 8px ${bad ? C.bad : C.ok}` }} />
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{s.nome}</span>
                </div>
                <div style={{ fontSize: 12.5, color: C.mut, marginTop: 8, minHeight: 18 }}>{bad ? `⚠️ ${s.problemas}` : 'tudo certo'}</div>
                <div style={{ fontSize: 11, color: C.mut, marginTop: 8, opacity: 0.7 }}>{String(s.url).replace(/^https?:\/\//, '')}</div>
              </a>
            )
          })}
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, borderBottom: `1px solid ${C.line}`, paddingBottom: 8 }}>📋 Histórico de erros e consertos</h2>
        {logs.length === 0 ? (
          <p style={{ color: C.mut, fontSize: 13.5 }}>Nenhum evento registrado ainda — o que é ótimo. 💛</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {logs.map((l, i) => {
              const conserto = l.tipo === 'conserto'
              return (
                <div key={i} style={{ ...box, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', borderLeft: `4px solid ${conserto ? C.ok : C.bad}` }}>
                  <span style={{ fontSize: 18 }}>{conserto ? '✅' : '⚠️'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{l.site}</div>
                    <div style={{ fontSize: 12.5, color: C.mut }}>{l.descricao}</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: C.mut, whiteSpace: 'nowrap' }}>{quando(l.quando)}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
