import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SIGNOS, signoDe, getHoroscopo } from '@/lib/horoscopo'
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
    title: `Horóscopo de ${s.nome} hoje — previsão do dia`,
    description: `Horóscopo de ${s.nome} para hoje: amor, trabalho, dinheiro e a energia do dia para o signo de ${s.nome} (${s.periodo}).`,
    alternates: { canonical: `/horoscopo/${s.slug}` },
  }
}

export default async function SignoPage({ params }) {
  const { signo } = await params
  const s = signoDe(signo)
  if (!s) notFound()
  const h = getHoroscopo()
  const texto = h?.signos?.[s.slug]

  return (
    <div>
      <section style={{ background: `radial-gradient(120% 160% at 82% -20%, ${s.cor}66, transparent 55%), linear-gradient(140deg, #2b1a5e 0%, #0C0E1A 82%)`, color: '#fff', padding: '40px 0 32px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: t.pad }}>
          <Link href="/horoscopo" className="hoverlink" style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>← Todos os signos</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
            <span style={{ fontSize: 'clamp(50px,10vw,72px)', color: s.cor, lineHeight: 1, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.3))' }}>{s.simbolo}</span>
            <div>
              <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, letterSpacing: -0.6 }}>Horóscopo de {s.nome}</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{s.periodo} · Elemento {s.elemento} · {h?.dataFmt || 'hoje'}</p>
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(20px, 3vw, 48px)' }}>
        <div style={{ background: t.card, border: `1px solid ${t.line}`, borderLeft: `5px solid ${s.cor}`, borderRadius: t.radius, padding: 'clamp(20px,3vw,30px)', boxShadow: t.shadow }}>
          <p style={{ fontSize: 'clamp(16px,2.4vw,19px)', lineHeight: 1.75, color: t.ink, fontFamily: 'var(--font-serif), Georgia, serif', margin: 0 }}>
            {texto || 'A previsão de hoje está chegando — volte em instantes.'}
          </p>
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
