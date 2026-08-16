import { cotacoes, formatarBRL } from '@/lib/cotacoes'
import { t } from '@/lib/tokens'
import { SITE } from '@/lib/content'

export const revalidate = 600

export const metadata = {
  title: 'Cotação do dólar hoje, euro e bitcoin — ao vivo em reais',
  description:
    'Cotação do dólar hoje, euro, libra, peso argentino, bitcoin e ethereum em reais, ao vivo e atualizada a cada 10 minutos. Veja a variação do dia e máxima e mínima.',
  alternates: { canonical: '/cotacoes' },
}

function Variacao({ pct }) {
  const sobe = pct >= 0
  const cor = sobe ? '#16A34A' : '#DC2626'
  return (
    <span style={{ color: cor, fontWeight: 800, fontSize: 14 }}>
      {sobe ? '▲' : '▼'} {Math.abs(pct).toFixed(2).replace('.', ',')}%
    </span>
  )
}

export default async function CotacoesPage() {
  const lista = await cotacoes()
  const atualizado = lista[0]?.atualizado

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: lista.slice(0, 3).map((c) => ({
      '@type': 'Question',
      name: `Qual a cotação do ${c.nome.toLowerCase()} hoje?`,
      acceptedAnswer: { '@type': 'Answer', text: `${c.nome} está R$ ${formatarBRL(c.valor, c.casas)} — variação de ${c.pct.toFixed(2)}% no dia.` },
    })),
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section style={{ background: `radial-gradient(120% 160% at 85% -20%, ${t.sun}44, transparent 55%), linear-gradient(135deg, #0d5b3a 0%, #0C0E1A 78%)`, color: '#fff', padding: '40px 0 34px' }}>
        <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: t.pad }}>
          <p style={{ fontSize: 12, letterSpacing: 2, color: '#8ff0be', fontWeight: 800, textTransform: 'uppercase' }}>💵 Mercado · ao vivo</p>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, letterSpacing: -0.8, marginTop: 8 }}>Cotações de hoje</h1>
          <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>
            Dólar, euro, bitcoin e mais — em reais. {atualizado ? `Atualizado às ${atualizado.slice(11, 16)}.` : ''}
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(20px, 3vw, 48px)' }}>
        {lista.length === 0 ? (
          <p style={{ fontSize: 15, color: t.muted }}>Não conseguimos carregar as cotações agora. Tente daqui a pouco.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {lista.map((c) => (
              <div key={c.code} style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, padding: '18px 20px', boxShadow: t.shadow }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24 }}>{c.emoji}</span>
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 800, color: t.ink, lineHeight: 1.1 }}>{c.nome}</div>
                      <div style={{ fontSize: 11.5, color: t.muted }}>{c.code} → BRL</div>
                    </div>
                  </div>
                  <Variacao pct={c.pct} />
                </div>
                <div style={{ fontSize: 'clamp(24px,4vw,30px)', fontWeight: 900, color: t.ink, letterSpacing: -0.5 }}>
                  R$ {formatarBRL(c.valor, c.casas)}
                </div>
                <div style={{ fontSize: 11.5, color: t.muted, marginTop: 8, display: 'flex', gap: 12 }}>
                  <span>máx R$ {formatarBRL(c.alta, c.casas)}</span>
                  <span>mín R$ {formatarBRL(c.baixa, c.casas)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: 13.5, lineHeight: 1.7, color: t.inkSoft, marginTop: 28 }}>
          As cotações do <strong>dólar</strong>, euro e demais moedas são atualizadas a cada 10 minutos com base no mercado à vista (fonte: AwesomeAPI). Os valores de{' '}
          <strong>bitcoin</strong> e ethereum refletem a média das principais corretoras. Use como referência — para operações, consulte sua instituição financeira.
        </p>
        <p style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', marginTop: 24 }}>Cotações atualizadas a cada 10 min · {SITE.name}</p>
      </div>
    </div>
  )
}
