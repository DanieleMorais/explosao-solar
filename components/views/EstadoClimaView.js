import Link from 'next/link'
import { notFound } from 'next/navigation'
import { estado } from '@/lib/brasil'
import { TOP_CIDADES } from '@/lib/cidades-br'
import { previsaoPonto, previsaoPontos, wmo, iconeClima } from '@/lib/clima'
import { t } from '@/lib/tokens'
import { withLang } from '@/lib/site'
import { CardClima } from '@/components/clima/ClimaBits'
import BuscaClima from '@/components/clima/BuscaClima'
import Cenario from '@/components/clima/Cenario'
import FaixaHoras from '@/components/clima/FaixaHoras'

export const revalidate = 1800

const TXT = {
  pt: { voltar: '← Clima nos estados', capital: 'Capital', principais: 'Principais cidades de', busca: 'Buscar cidade ou bairro de', atualizado: 'Clima em tempo real · Fonte: Open-Meteo' },
  en: { voltar: '← Weather by state', capital: 'Capital', principais: 'Main cities in', busca: 'Search a city or neighborhood in', atualizado: 'Real-time weather · Source: Open-Meteo' },
  es: { voltar: '← Clima por estado', capital: 'Capital', principais: 'Principales ciudades de', busca: 'Buscar ciudad o barrio de', atualizado: 'Clima en tiempo real · Fuente: Open-Meteo' },
}

export default async function EstadoClimaView({ lang = 'pt', uf }) {
  const e = estado(uf)
  if (!e) notFound()
  const L = TXT[lang] || TXT.pt

  const principais = TOP_CIDADES.filter((c) => c.uf === e.uf).slice(0, 15)

  const [clima, prevPrincipais] = await Promise.all([
    previsaoPonto(e.lat, e.lon),
    principais.length ? previsaoPontos(principais.map((c) => ({ lat: c.lat, lon: c.lon }))) : Promise.resolve([]),
  ])

  const cond = clima ? wmo(clima.agora.code, lang) : null
  const voltarHref = withLang(lang, '/clima/brasil')

  return (
    <div>
      {clima ? (
        <Cenario
          code={clima.agora.code}
          isDia={clima.agora.isDia}
          temp={clima.agora.temp}
          sensacao={clima.agora.sensacao}
          texto={cond.texto}
          nome={e.capital}
          sub={`${e.nome} · ${e.regiao}`}
          voltarHref={voltarHref}
          voltarLabel={L.voltar}
          lang={lang}
        />
      ) : (
        <section style={{ background: `linear-gradient(135deg, ${t.sun} 0%, #101322 80%)`, color: '#fff', padding: '40px 0 36px' }}>
          <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: t.pad }}>
            <Link href={voltarHref} className="hoverlink" style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{L.voltar}</Link>
            <h1 style={{ fontSize: 'clamp(28px,5vw,42px)', fontWeight: 900, marginTop: 10 }}>{e.nome}</h1>
          </div>
        </section>
      )}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(20px, 3vw, 56px)' }}>
        {clima && <FaixaHoras horas={clima.horas} lang={lang} />}

        {clima && (
          <div style={{ marginTop: 22 }}>
            <CardClima titulo={e.capital} subtitulo={`${L.capital} · ${e.nome}`} clima={clima} lang={lang} destaque />
          </div>
        )}

        <div style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, padding: 'clamp(18px,3vw,24px)', boxShadow: t.shadow, marginTop: 22 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12, color: t.ink }}>🔎 {L.busca} {e.nome}</h2>
          <BuscaClima lang={lang} uf={e.uf} />
        </div>

        {principais.length > 0 && (
          <div style={{ marginTop: 30 }}>
            <h2 style={{ fontSize: 'clamp(17px,3vw,22px)', fontWeight: 900, letterSpacing: -0.3, marginBottom: 14 }}>
              {L.principais} {e.nome}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {principais.map((c, i) => {
                const p = prevPrincipais[i]
                const temp = p && !p.erro && p.agora ? p.agora.temp : null
                const ic = p && !p.erro && p.agora ? iconeClima(p.agora.code, true) : '🌡️'
                return (
                  <Link
                    key={c.slug}
                    href={withLang(lang, `/clima/brasil/${e.uf.toLowerCase()}/${c.slug}`)}
                    className="card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      background: t.card,
                      border: `1px solid ${t.line}`,
                      borderRadius: t.radiusSm,
                      padding: '14px 16px',
                      boxShadow: t.shadow,
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: t.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nome}</div>
                      <div style={{ fontSize: 11.5, color: t.muted }}>{e.uf}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 20 }}>{ic}</span>
                      {temp !== null && <span style={{ fontSize: 18, fontWeight: 900, color: t.ink }}>{temp}°</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        <p style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', marginTop: 28 }}>{L.atualizado}</p>
      </div>
    </div>
  )
}
