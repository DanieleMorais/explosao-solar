import Link from 'next/link'
import { carregarTerremotos } from '@/lib/terremotos'
import { getAllArticles, SITE } from '@/lib/content'
import { t } from '@/lib/tokens'

export const revalidate = 900

export const metadata = {
  title: 'Terremotos hoje — atividade sísmica ao vivo no mundo',
  description:
    'Terremotos de hoje em tempo real: últimos abalos sísmicos de magnitude 4,5 ou mais no mundo, com magnitude, local, profundidade e horário. Dados oficiais do USGS, atualizados a cada 15 minutos.',
  alternates: { canonical: '/terremotos' },
}

const ALERTAS = {
  green: { txt: 'Impacto pequeno', cor: '#16A34A' },
  yellow: { txt: 'Impacto local', cor: '#D97706' },
  orange: { txt: 'Impacto alto', cor: '#EA580C' },
  red: { txt: 'Impacto severo', cor: '#DC2626' },
}

function Bola({ mag, cor, tam = 56 }) {
  return (
    <span style={{ flexShrink: 0, width: tam, height: tam, borderRadius: 999, background: cor, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.18)' }}>
      <span style={{ fontSize: tam * 0.34, fontWeight: 900 }}>{mag}</span>
      <span style={{ fontSize: tam * 0.15, opacity: 0.85, marginTop: 2 }}>mag</span>
    </span>
  )
}

function CardTremor({ q }) {
  return (
    <a href={q.url} target="_blank" rel="noopener noreferrer" className="card" style={{ display: 'flex', gap: 14, alignItems: 'center', textDecoration: 'none', background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, padding: '14px 16px', boxShadow: t.shadow }}>
      <Bola mag={q.magFmt} cor={q.cor} />
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, color: q.cor }}>{q.rotulo}</span>
          {q.tsunami && <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: '#0891B2', borderRadius: 999, padding: '2px 8px' }}>🌊 Alerta de tsunami</span>}
          {q.alert && ALERTAS[q.alert] && <span style={{ fontSize: 11, fontWeight: 700, color: ALERTAS[q.alert].cor }}>● {ALERTAS[q.alert].txt}</span>}
        </span>
        <span style={{ display: 'block', fontSize: 15.5, fontWeight: 800, color: t.ink, lineHeight: 1.3, margin: '3px 0' }}>{q.local}</span>
        <span style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12.5, color: t.muted }}>
          <span>🕒 {q.tempo}</span>
          {q.prof != null && <span>⬇ {q.prof} km de profundidade</span>}
          {q.felt > 0 && <span>👥 {q.felt.toLocaleString('pt-BR')} relatos</span>}
        </span>
      </span>
    </a>
  )
}

function StatBox({ titulo, valor, sub, cor }) {
  return (
    <div style={{ flex: 1, minWidth: 180, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: t.radius, padding: '16px 18px' }}>
      <div style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.6, color: 'rgba(255,255,255,0.65)', fontWeight: 700 }}>{titulo}</div>
      <div style={{ fontSize: 'clamp(24px,3.4vw,32px)', fontWeight: 900, color: cor || '#fff', marginTop: 4, lineHeight: 1.1 }}>{valor}</div>
      {sub && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function Info({ titulo, children }) {
  return (
    <div style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, padding: '18px 20px' }}>
      <h3 style={{ fontSize: 15.5, fontWeight: 900, color: t.ink, marginBottom: 6 }}>{titulo}</h3>
      <p style={{ fontSize: 13.5, lineHeight: 1.7, color: t.inkSoft, margin: 0 }}>{children}</p>
    </div>
  )
}

export default async function TerremotosPage() {
  const { recentes, maiores, stats } = await carregarTerremotos()

  const relacionadas = getAllArticles('pt')
    .filter((a) => /terremoto|sismo|tremor|abalo s[íi]smico|r[ée]plica/i.test(`${a.title} ${(a.tags || []).join(' ')}`))
    .slice(0, 6)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Terremotos recentes no mundo',
    itemListElement: recentes.slice(0, 10).map((q, i) => ({
      '@type': 'ListItem', position: i + 1, name: `Magnitude ${q.magFmt} — ${q.local}`,
    })),
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section style={{ background: 'radial-gradient(120% 160% at 85% -20%, #DC262655, transparent 55%), linear-gradient(140deg, #3b0d0d 0%, #0C0E1A 82%)', color: '#fff', padding: '40px 0 34px' }}>
        <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: t.pad }}>
          <p style={{ fontSize: 12, letterSpacing: 2, color: '#fca5a5', fontWeight: 800, textTransform: 'uppercase' }}>🌎 Sismologia · ao vivo</p>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, letterSpacing: -0.8, marginTop: 8 }}>Terremotos hoje no mundo</h1>
          <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.82)', marginTop: 6, maxWidth: 640 }}>
            Últimos abalos de magnitude 4,5 ou mais, em tempo real. Dados oficiais do USGS (Serviço Geológico dos EUA), atualizados a cada 15 minutos.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
            <StatBox titulo="Maior nas últimas 24h" valor={stats.maiorDia ? `M${stats.maiorDia.magFmt}` : '—'} sub={stats.maiorDia ? stats.maiorDia.local : 'sem registros fortes'} cor="#fca5a5" />
            <StatBox titulo="Tremores (24h) · M4,5+" valor={stats.total24h} sub="registrados no mundo" />
            <StatBox titulo="Maior do mês" valor={stats.maiorMes ? `M${stats.maiorMes.magFmt}` : '—'} sub={stats.maiorMes ? stats.maiorMes.local : ''} cor="#fca5a5" />
          </div>
        </div>
      </section>

      <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: 'clamp(20px, 3vw, 48px)' }}>
        <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)', gap: 34, alignItems: 'start' }}>
          {/* RECENTES */}
          <main>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, borderLeft: '4px solid #DC2626', paddingLeft: 10 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', color: t.ink }}>Terremotos recentes</h2>
              <span style={{ fontSize: 12, color: t.muted }}>fonte: USGS</span>
            </div>
            {recentes.length === 0 ? (
              <p style={{ fontSize: 15, color: t.muted }}>Não conseguimos carregar os dados sísmicos agora. Tente daqui a pouco.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                {recentes.map((q) => <CardTremor key={q.id} q={q} />)}
              </div>
            )}

            {/* ENTENDA — profundidade SEO */}
            <h2 style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', color: t.ink, margin: '38px 0 14px', borderLeft: '4px solid #DC2626', paddingLeft: 10 }}>Entenda os terremotos</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              <Info titulo="O que é a magnitude?">
                A magnitude mede a energia liberada no epicentro. A escala é logarítmica: cada ponto a mais representa cerca de 32 vezes mais energia. Um tremor M6 libera aproximadamente mil vezes mais energia que um M4.
              </Info>
              <Info titulo="Por que a profundidade importa?">
                Terremotos rasos (menos de 70 km) costumam causar mais estragos na superfície, mesmo com magnitude menor, porque a energia chega mais concentrada às construções. Abalos profundos são sentidos numa área maior, porém com menos intensidade.
              </Info>
              <Info titulo="O Brasil tem terremotos?">
                Sim, mas quase sempre fracos. O país fica no meio da placa Sul-Americana, longe das bordas onde a atividade é intensa. Os maiores registrados por aqui raramente passam de magnitude 6 e são pouco frequentes.
              </Info>
              <Info titulo="O que fazer durante um tremor?">
                A orientação internacional é "abaixar, proteger e segurar": agachar, proteger a cabeça sob um móvel firme e aguardar o tremor passar. Evite portas, janelas e elevadores; se estiver na rua, afaste-se de fachadas, postes e fios.
              </Info>
            </div>

            {relacionadas.length > 0 && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', color: t.ink, margin: '38px 0 14px', borderLeft: '4px solid #DC2626', paddingLeft: 10 }}>Cobertura da redação</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {relacionadas.map((a) => (
                    <Link key={a.slug} href={`/noticia/${a.slug}`} className="card" style={{ display: 'flex', gap: 12, textDecoration: 'none', background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radiusSm, padding: '12px 14px' }}>
                      {a.imagem && <span style={{ flexShrink: 0, width: 76, height: 56, borderRadius: 7, overflow: 'hidden', background: '#E7E4DB' }}><img src={a.imagem} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /></span>}
                      <span style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.35, color: t.ink }}>{a.title}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </main>

          {/* MAIORES DO MÊS */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, padding: '16px 18px', boxShadow: t.shadow }}>
              <h2 style={{ fontSize: 15, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 12, color: t.ink }}>💥 Maiores do mês</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {maiores.map((q) => (
                  <a key={q.id} href={q.url} target="_blank" rel="noopener noreferrer" className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none', paddingBottom: 10, borderBottom: `1px solid ${t.line}` }}>
                    <Bola mag={q.magFmt} cor={q.cor} tam={44} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: t.ink, lineHeight: 1.3 }}>{q.local}</span>
                      <span style={{ display: 'block', fontSize: 12, color: t.muted, marginTop: 2 }}>{q.dataFmt}{q.tsunami ? ' · 🌊 tsunami' : ''}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div style={{ background: 'linear-gradient(140deg, #161A2C, #0C0E1A)', color: '#fff', borderRadius: t.radius, padding: '18px 20px' }}>
              <h2 style={{ fontSize: 14.5, fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>Como lemos esses dados</h2>
              <p style={{ fontSize: 12.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.78)', margin: 0 }}>
                Cada abalo vem da rede global de sismógrafos do USGS. A cor da bolinha indica a força: verde e amarelo são tremores leves; laranja e vermelho, os mais intensos. O selo 🌊 aparece quando há alerta de tsunami associado.
              </p>
            </div>
          </aside>
        </div>

        <p style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', marginTop: 30 }}>
          Dados sísmicos atualizados a cada 15 minutos · Fonte oficial: USGS (United States Geological Survey) · {SITE.name}
        </p>
      </div>
    </div>
  )
}
