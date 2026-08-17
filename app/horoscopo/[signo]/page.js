import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SIGNOS, signoDe, getHoroscopo, numeroSorte } from '@/lib/horoscopo'
import { t } from '@/lib/tokens'
import { SITE } from '@/lib/content'

export const revalidate = 3600

export function generateStaticParams() {
  return SIGNOS.map((s) => ({ signo: s.slug }))
}

export async function generateMetadata({ params }) {
  const { signo } = await params
  const s = signoDe(signo)
  if (!s) return {}
  return {
    title: `Horóscopo de ${s.nome} hoje — amor, trabalho e número da sorte`,
    description: `Horóscopo de ${s.nome} para hoje: previsão de amor, trabalho e dinheiro, número da sorte, características, compatibilidade e a energia do dia do signo de ${s.nome} (${s.periodo}).`,
    alternates: { canonical: `/horoscopo/${s.slug}` },
  }
}

function Bloco({ emoji, titulo, texto, cor }) {
  if (!texto) return null
  return (
    <div style={{ background: t.card, border: `1px solid ${t.line}`, borderLeft: `4px solid ${cor}`, borderRadius: t.radiusSm, padding: '16px 18px' }}>
      <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: cor, marginBottom: 6 }}>{emoji} {titulo}</div>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: t.ink, margin: 0 }}>{texto}</p>
    </div>
  )
}

export default async function SignoPage({ params }) {
  const { signo } = await params
  const s = signoDe(signo)
  if (!s) notFound()
  const h = getHoroscopo()
  const raw = h?.signos?.[s.slug]
  const dia = typeof raw === 'object' ? raw : { geral: raw }
  const sorte = numeroSorte(s.slug, h?.data || '')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Horóscopo de ${s.nome} hoje`,
    datePublished: h?.data,
    inLanguage: 'pt-BR',
    articleBody: [dia.geral, dia.amor, dia.trabalho].filter(Boolean).join(' '),
    author: { '@type': 'Organization', name: SITE.name },
  }

  const ficha = [
    { r: 'Elemento', v: s.elemento },
    { r: 'Regente', v: s.regente },
    { r: 'Pedra', v: s.pedra },
    { r: 'Cor da sorte', v: s.corSorte },
    { r: 'Número da sorte', v: sorte },
  ]

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section style={{ background: `radial-gradient(120% 160% at 82% -20%, ${s.cor}66, transparent 55%), linear-gradient(140deg, #2b1a5e 0%, #0C0E1A 82%)`, color: '#fff', padding: '40px 0 32px' }}>
        <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: t.pad }}>
          <Link href="/horoscopo" className="hoverlink" style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>← Todos os signos</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
            <span style={{ fontSize: 'clamp(50px,10vw,72px)', color: s.cor, lineHeight: 1, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.3))' }}>{s.simbolo}</span>
            <div>
              <h1 style={{ fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 900, letterSpacing: -0.6 }}>Horóscopo de {s.nome}</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{s.periodo} · Elemento {s.elemento} · {h?.dataFmt || 'hoje'}</p>
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: 'clamp(20px, 3vw, 44px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Bloco emoji="✨" titulo="Energia do dia" texto={dia.geral || 'A previsão de hoje está chegando — volte em instantes.'} cor={s.cor} />
          <Bloco emoji="❤️" titulo="Amor" texto={dia.amor} cor="#DB2777" />
          <Bloco emoji="💼" titulo="Trabalho e dinheiro" texto={dia.trabalho} cor="#16A34A" />
        </div>

        {/* Ficha do signo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: 22 }}>
          {ficha.map((f) => (
            <div key={f.r} style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radiusSm, padding: '12px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{f.r}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: t.ink, marginTop: 3 }}>{f.v}</div>
            </div>
          ))}
        </div>

        {/* Características */}
        <h2 style={{ fontSize: 16, fontWeight: 800, color: t.ink, margin: '26px 0 10px' }}>Como é o signo de {s.nome}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {s.tracos.map((tr) => (
            <span key={tr} style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: s.cor, borderRadius: 999, padding: '6px 14px' }}>{tr}</span>
          ))}
        </div>

        {/* Compatibilidade */}
        <h2 style={{ fontSize: 16, fontWeight: 800, color: t.ink, margin: '26px 0 10px' }}>{s.nome} combina com</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {s.combina.map((slug) => {
            const c = signoDe(slug)
            return (
              <Link key={slug} href={`/horoscopo/${slug}`} className="hoverlink" style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${t.line}`, borderRadius: 999, padding: '8px 16px', fontSize: 14, fontWeight: 700, color: t.inkSoft, textDecoration: 'none' }}>
                <span style={{ color: c.cor, fontSize: 18 }}>{c.simbolo}</span> {c.nome}
              </Link>
            )
          })}
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 800, color: t.ink, margin: '30px 0 12px' }}>Outros signos</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SIGNOS.filter((x) => x.slug !== s.slug).map((x) => (
            <Link key={x.slug} href={`/horoscopo/${x.slug}`} className="hoverlink" style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${t.line}`, borderRadius: 999, padding: '7px 14px', fontSize: 13.5, fontWeight: 700, color: t.inkSoft, textDecoration: 'none' }}>
              <span style={{ color: x.cor }}>{x.simbolo}</span> {x.nome}
            </Link>
          ))}
        </div>
        <p style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', marginTop: 26 }}>Horóscopo atualizado diariamente · {SITE.name}</p>
      </div>
    </div>
  )
}
