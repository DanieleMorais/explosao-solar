import { loterias, brl } from '@/lib/loterias'
import { t } from '@/lib/tokens'
import { SITE } from '@/lib/content'

export const revalidate = 1800

export const metadata = {
  title: 'Resultado das loterias hoje — Mega-Sena, Lotofácil, Quina e mais',
  description:
    'Resultado das loterias da Caixa hoje: Mega-Sena, Lotofácil, Quina, Lotomania, Dia de Sorte e Timemania. Números sorteados, se acumulou e o prêmio estimado do próximo concurso.',
  alternates: { canonical: '/loterias' },
}

function Bolas({ dezenas, cor }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
      {dezenas.map((d, i) => (
        <span
          key={i}
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            background: cor,
            color: '#fff',
            fontWeight: 800,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {String(d).padStart(2, '0')}
        </span>
      ))}
    </div>
  )
}

export default async function LoteriasPage() {
  const jogos = await loterias()

  return (
    <div>
      <section style={{ background: `radial-gradient(120% 160% at 85% -20%, ${t.sun}44, transparent 55%), linear-gradient(135deg, #1a6b3f 0%, #0C0E1A 78%)`, color: '#fff', padding: '40px 0 34px' }}>
        <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: t.pad }}>
          <p style={{ fontSize: 12, letterSpacing: 2, color: '#9ff0c0', fontWeight: 800, textTransform: 'uppercase' }}>🍀 Loterias · resultados</p>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, letterSpacing: -0.8, marginTop: 8 }}>Resultado das loterias</h1>
          <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>Últimos sorteios da Caixa — números, prêmios e o próximo concurso.</p>
        </div>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(20px, 3vw, 48px)' }}>
        {jogos.length === 0 ? (
          <p style={{ fontSize: 15, color: t.muted }}>Não conseguimos carregar os resultados agora. Tente daqui a pouco.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {jogos.map((g) => (
              <div key={g.slug} style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, boxShadow: t.shadow, overflow: 'hidden' }}>
                <div style={{ background: g.cor, color: '#fff', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 900, fontSize: 16 }}>{g.nome}</span>
                  <span style={{ fontSize: 12, opacity: 0.9 }}>Concurso {g.concurso} · {g.data}</span>
                </div>
                <div style={{ padding: '14px 18px 18px' }}>
                  <Bolas dezenas={g.dezenas} cor={g.cor} />
                  {g.extra && <div style={{ fontSize: 12.5, color: t.muted, marginTop: 10 }}>⭐ {g.extra}</div>}
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.line}`, fontSize: 13 }}>
                    {g.ganhadores > 0 ? (
                      <div style={{ color: '#16A34A', fontWeight: 700 }}>
                        🎉 {g.ganhadores} ganhador{g.ganhadores > 1 ? 'es' : ''} · {brl(g.premio)}
                      </div>
                    ) : (
                      <div style={{ color: t.inkSoft, fontWeight: 700 }}>Acumulou!</div>
                    )}
                    {g.proxValor > 0 && (
                      <div style={{ color: t.muted, marginTop: 4 }}>
                        Próximo{g.proxData ? ` (${g.proxData})` : ''}: <strong style={{ color: t.ink }}>{brl(g.proxValor)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', marginTop: 26 }}>
          Resultados atualizados após cada sorteio · Fonte oficial: Caixa Econômica Federal · {SITE.name} não vende apostas.
        </p>
      </div>
    </div>
  )
}
