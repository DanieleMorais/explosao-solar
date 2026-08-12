import Link from 'next/link'
import { notFound } from 'next/navigation'
import { estado, municipios } from '@/lib/brasil'
import { previsaoPonto } from '@/lib/clima'
import { t } from '@/lib/tokens'
import { withLang } from '@/lib/site'
import { CardClima } from '@/components/clima/ClimaBits'
import BuscaClima from '@/components/clima/BuscaClima'

export const revalidate = 1800

const TXT = {
  pt: { voltar: '← Clima nos estados', capital: 'Capital', cidades: 'Todas as cidades', buscaTitulo: 'Buscar cidade ou bairro de', total: (n) => `${n} municípios`, atualizado: 'Clima atualizado a cada 30 min · Fonte: Open-Meteo' },
  en: { voltar: '← Weather by state', capital: 'Capital', cidades: 'All cities', buscaTitulo: 'Search a city or neighborhood in', total: (n) => `${n} municipalities`, atualizado: 'Weather updated every 30 min · Source: Open-Meteo' },
  es: { voltar: '← Clima por estado', capital: 'Capital', cidades: 'Todas las ciudades', buscaTitulo: 'Buscar ciudad o barrio de', total: (n) => `${n} municipios`, atualizado: 'Clima actualizado cada 30 min · Fuente: Open-Meteo' },
}

export default async function EstadoClimaView({ lang = 'pt', uf }) {
  const e = estado(uf)
  if (!e) notFound()
  const L = TXT[lang] || TXT.pt

  const [clima, cidades] = await Promise.all([previsaoPonto(e.lat, e.lon), municipios(e.uf)])

  return (
    <div>
      <section style={{ background: `radial-gradient(110% 160% at 85% -20%, ${t.sun}55, transparent 55%), linear-gradient(135deg, ${t.sun} 0%, #101322 80%)`, color: '#fff', padding: '40px 0 36px' }}>
        <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: t.pad }}>
          <Link href={withLang(lang, '/clima/brasil')} className="hoverlink" style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{L.voltar}</Link>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, letterSpacing: -0.8, marginTop: 10 }}>{e.nome}</h1>
          <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>{e.regiao} · {L.total(cidades.length)}</p>
        </div>
      </section>

      <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: 'clamp(20px, 3vw, 56px)' }}>
        <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 22, marginBottom: 34, alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: t.muted, marginBottom: 12 }}>{L.capital} · {e.capital}</h2>
            <CardClima titulo={e.capital} subtitulo={e.nome} clima={clima} lang={lang} destaque />
          </div>
          <div style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, padding: 'clamp(18px,3vw,24px)', boxShadow: t.shadow }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12, color: t.ink }}>🔎 {L.buscaTitulo} {e.nome}</h2>
            <BuscaClima lang={lang} uf={e.uf} />
          </div>
        </div>

        <h2 style={{ fontSize: 14, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: t.muted, borderBottom: `2px solid ${t.line}`, paddingBottom: 8, marginBottom: 16 }}>{L.cidades}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 4 }}>
          {cidades.map((c) => (
            <Link
              key={c.slug}
              href={withLang(lang, `/clima/brasil/${e.uf.toLowerCase()}/${c.slug}`)}
              className="hoverlink"
              style={{ fontSize: 13.5, color: t.inkSoft, padding: '7px 10px', borderRadius: 7, display: 'block' }}
            >
              {c.nome}
            </Link>
          ))}
        </div>

        <p style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', marginTop: 28 }}>{L.atualizado}</p>
      </div>
    </div>
  )
}
