import { headers } from 'next/headers'
import { lerEstado } from '@/lib/monitor-estado'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const metadata = { title: 'Painel de Saúde', robots: { index: false, follow: false } }

function quando(iso) {
  try {
    return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

const C = { bg: '#0C0E1A', card: '#161A2C', line: 'rgba(255,255,255,0.10)', ink: '#fff', mut: '#9aa0b4', ok: '#16A34A', bad: '#DC2626', sun: '#FFB300' }
const box = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 }

export default async function Painel({ searchParams }) {
  const sp = await searchParams
  // No subdomínio próprio (saude.*) o endereço já é privado — abre sem token.
  const host = (await headers()).get('host') || ''
  const noSubdominio = host.startsWith('saude.')
  const esperado = process.env.PAINEL_SAUDE_TOKEN
  if (!noSubdominio && (!esperado || sp?.t !== esperado)) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui,sans-serif' }}>
        <p style={{ color: C.mut }}>Acesso restrito. Link com token inválido.</p>
      </div>
    )
  }

  let e = null
  let falha = null
  try {
    e = await lerEstado()
  } catch (err) {
    falha = err.message
  }

  const sites = e?.sites || []
  const comProblema = (e?.comProblema || 0) + (e?.robosComProblema || 0)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif', padding: '28px 18px 60px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 2, color: C.sun, fontWeight: 800, textTransform: 'uppercase' }}>Fada Madrinha</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, margin: '4px 0 0' }}>Painel de Saúde dos Sites</h1>
            {e && <div style={{ fontSize: 13, color: C.mut, marginTop: 4 }}>{e.total} sites e {e.robos?.length || 0} robôs vigiados, 24 horas por dia</div>}
          </div>
          <div style={{ textAlign: 'right', fontSize: 13, color: C.mut }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: falha ? C.sun : comProblema ? C.bad : C.ok }}>
              {falha ? 'sem leitura' : comProblema === 0 ? 'Tudo no ar' : `${comProblema} com problema`}
            </div>
            {e?.checadoEm && <div>última checagem: {quando(e.checadoEm)}</div>}
          </div>
        </header>

        {falha && (
          <div style={{ ...box, borderLeft: `4px solid ${C.sun}`, marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Não consegui ler o vigia</div>
            <div style={{ fontSize: 12.5, color: C.mut, marginTop: 6 }}>
              Este painel não sabe dizer se os sites estão no ar — o que não é a mesma coisa que estarem bem. Motivo: {falha}
            </div>
          </div>
        )}

        {!falha && sites.length === 0 && (
          <div style={{ ...box, textAlign: 'center', color: C.mut }}>Aguardando a primeira checagem do robô (roda a cada 30 min)…</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 30 }}>
          {sites.map((s) => {
            const ruim = s.status === 'PROBLEMA'
            return (
              <a key={s.id} href={s.url} target="_blank" rel="noreferrer" style={{ ...box, textDecoration: 'none', color: C.ink, borderLeft: `4px solid ${ruim ? C.bad : C.ok}`, display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: ruim ? C.bad : C.ok, boxShadow: `0 0 8px ${ruim ? C.bad : C.ok}`, flexShrink: 0 }} />
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{s.nome}</span>
                </div>

                {ruim ? (
                  <ul style={{ margin: '10px 0 0', padding: '0 0 0 16px', color: '#FCA5A5', fontSize: 12.5, lineHeight: 1.6 }}>
                    {s.problemas.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                ) : (
                  <div style={{ fontSize: 12.5, color: C.mut, marginTop: 8 }}>
                    tudo certo{typeof s.ms === 'number' ? ` · respondeu em ${(s.ms / 1000).toFixed(1)}s` : ''}
                  </div>
                )}

                {s.notas?.length > 0 && (
                  <div style={{ fontSize: 11.5, color: C.sun, marginTop: 8, lineHeight: 1.5 }}>
                    {s.notas.map((n, i) => <div key={i}>{n}</div>)}
                  </div>
                )}

                <div style={{ fontSize: 11, color: C.mut, marginTop: 10, opacity: 0.7 }}>{String(s.url).replace(/^https?:\/\//, '')}</div>
              </a>
            )
          })}
        </div>

        {e?.robos?.length > 0 && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, borderBottom: `1px solid ${C.line}`, paddingBottom: 8 }}>Robôs de conteúdo</h2>
            <p style={{ fontSize: 12.5, color: C.mut, margin: '8px 0 14px' }}>
              Robô que para de publicar não derruba site nenhum — some calado. Aqui a conta é a data do último artigo que foi ao ar.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 30 }}>
              {e.robos.map((r) => {
                const parado = r.status === 'PROBLEMA'
                return (
                  <a key={r.id} href={r.url} target="_blank" rel="noreferrer" style={{ ...box, textDecoration: 'none', color: C.ink, borderLeft: `4px solid ${parado ? C.bad : C.ok}`, display: 'block' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: parado ? C.bad : C.ok, boxShadow: `0 0 8px ${parado ? C.bad : C.ok}`, flexShrink: 0 }} />
                      <span style={{ fontWeight: 800, fontSize: 15 }}>{r.nome}</span>
                    </div>

                    {parado ? (
                      <ul style={{ margin: '10px 0 0', padding: '0 0 0 16px', color: '#FCA5A5', fontSize: 12.5, lineHeight: 1.6 }}>
                        {r.problemas.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    ) : (
                      <div style={{ fontSize: 12.5, color: C.mut, marginTop: 8 }}>
                        {r.diasSemPublicar === 0 ? 'publicou hoje' : `último artigo há ${r.diasSemPublicar} dia(s)`}
                        {r.totalArtigos ? ` · ${r.totalArtigos} artigos no total` : ''}
                      </div>
                    )}

                    {r.tituloUltimo && (
                      <div style={{ fontSize: 11.5, color: C.mut, marginTop: 8, opacity: 0.85 }}>último: {r.tituloUltimo}</div>
                    )}

                    {r.notas?.length > 0 && (
                      <div style={{ fontSize: 11.5, color: C.sun, marginTop: 8, lineHeight: 1.5 }}>
                        {r.notas.map((n, i) => <div key={i}>{n}</div>)}
                      </div>
                    )}
                  </a>
                )
              })}
            </div>
          </>
        )}

        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, borderBottom: `1px solid ${C.line}`, paddingBottom: 8 }}>Histórico de erros e consertos</h2>
        {!e?.historico?.length ? (
          <p style={{ color: C.mut, fontSize: 13.5 }}>Nenhum evento registrado ainda — o que é ótimo.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {e.historico.slice(0, 40).map((l, i) => {
              const conserto = l.tipo === 'conserto'
              return (
                <div key={i} style={{ ...box, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', borderLeft: `4px solid ${conserto ? C.ok : C.bad}` }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: conserto ? C.ok : C.bad, width: 14, textAlign: 'center' }}>{conserto ? '✓' : '!'}</span>
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

        <p style={{ color: C.mut, fontSize: 12, marginTop: 26 }}>
          O robô checa a cada 30 minutos e manda e-mail para fadamadrinhadm@gmail.com sempre que algo quebra ou volta.
        </p>
      </div>
    </div>
  )
}
