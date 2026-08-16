import { feriados } from '@/lib/feriados'
import { t } from '@/lib/tokens'
import { SITE } from '@/lib/content'

export const revalidate = 86400

export async function generateMetadata() {
  const ano = new Date().getFullYear()
  return {
    title: `Feriados ${ano} — calendário de feriados nacionais no Brasil`,
    description: `Calendário de feriados nacionais de ${ano} no Brasil: datas, dia da semana e quantos dias faltam para o próximo feriado e emendas.`,
    alternates: { canonical: '/feriados' },
  }
}

export default async function FeriadosPage() {
  const { ano, lista } = await feriados()
  const proximo = lista.find((f) => f.dias >= 0)

  return (
    <div>
      <section style={{ background: `radial-gradient(120% 160% at 85% -20%, ${t.sun}55, transparent 55%), linear-gradient(135deg, ${t.sun} 0%, #101322 80%)`, color: '#fff', padding: '40px 0 34px' }}>
        <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: t.pad }}>
          <p style={{ fontSize: 12, letterSpacing: 2, color: '#ffd98a', fontWeight: 800, textTransform: 'uppercase' }}>📅 Calendário</p>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, letterSpacing: -0.8, marginTop: 8 }}>Feriados {ano}</h1>
          {proximo && (
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)', marginTop: 8 }}>
              Próximo: <strong>{proximo.nome}</strong> — {proximo.dataFmt} ({proximo.semana}), {proximo.dias === 0 ? 'é hoje!' : `faltam ${proximo.dias} dias`}
            </p>
          )}
        </div>
      </section>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(20px, 3vw, 48px)' }}>
        {lista.length === 0 ? (
          <p style={{ fontSize: 15, color: t.muted }}>Não conseguimos carregar os feriados agora.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lista.map((f) => (
              <div
                key={f.data}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: t.card,
                  border: `1px solid ${t.line}`,
                  borderRadius: t.radiusSm,
                  padding: '14px 18px',
                  boxShadow: t.shadow,
                  opacity: f.passou ? 0.55 : 1,
                  borderLeft: proximo && f.data === proximo.data ? `4px solid ${t.sun}` : `1px solid ${t.line}`,
                }}
              >
                <div style={{ textAlign: 'center', minWidth: 52 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: t.ink, lineHeight: 1 }}>{f.data.slice(8, 10)}</div>
                  <div style={{ fontSize: 11, color: t.muted, textTransform: 'uppercase' }}>{f.dataFmt.split(' ')[2]?.slice(0, 3) || f.dataFmt.split(' ').pop().slice(0, 3)}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: t.ink }}>{f.nome}</div>
                  <div style={{ fontSize: 12.5, color: t.muted, textTransform: 'capitalize' }}>{f.semana}</div>
                </div>
                {!f.passou && <div style={{ fontSize: 12, color: t.muted, whiteSpace: 'nowrap' }}>{f.dias === 0 ? 'hoje' : `${f.dias}d`}</div>}
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', marginTop: 24 }}>Feriados nacionais · Fonte: BrasilAPI · {SITE.name}</p>
      </div>
    </div>
  )
}
