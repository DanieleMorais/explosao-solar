import Link from 'next/link'
import { ESTADOS } from '@/lib/brasil'
import { previsaoPontos, wmo } from '@/lib/clima'
import { t } from '@/lib/tokens'
import { withLang } from '@/lib/site'
import BuscaClima from '@/components/clima/BuscaClima'

export const revalidate = 1800

const TXT = {
  pt: { kicker: 'Brasil · tempo real', titulo: 'Clima nos estados do Brasil', intro: 'Escolha um estado para ver a capital e todas as cidades — ou busque direto sua cidade ou bairro.', capital: 'Capital', buscaTitulo: 'Busca rápida', regioes: { Norte: 'Norte', Nordeste: 'Nordeste', 'Centro-Oeste': 'Centro-Oeste', Sudeste: 'Sudeste', Sul: 'Sul' }, atualizado: 'Em tempo real · Fonte: Open-Meteo' },
  en: { kicker: 'Brazil · live', titulo: 'Weather across Brazil', intro: 'Pick a state to see its capital and every city — or search your city or neighborhood directly.', capital: 'Capital', buscaTitulo: 'Quick search', regioes: { Norte: 'North', Nordeste: 'Northeast', 'Centro-Oeste': 'Midwest', Sudeste: 'Southeast', Sul: 'South' }, atualizado: 'Real-time data · Source: Open-Meteo' },
  es: { kicker: 'Brasil · en vivo', titulo: 'Clima en los estados de Brasil', intro: 'Elige un estado para ver la capital y todas las ciudades — o busca tu ciudad o barrio directamente.', capital: 'Capital', buscaTitulo: 'Búsqueda rápida', regioes: { Norte: 'Norte', Nordeste: 'Nordeste', 'Centro-Oeste': 'Centro-Oeste', Sudeste: 'Sudeste', Sul: 'Sur' }, atualizado: 'En tiempo real · Fuente: Open-Meteo' },
}

const REGIOES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']

export default async function BrasilClimaView({ lang = 'pt' }) {
  const L = TXT[lang] || TXT.pt
  const clima = await previsaoPontos(ESTADOS)
  const porUf = Object.fromEntries(clima.map((c) => [c.uf, c]))

  return (
    <div>
      <section style={{ background: t.dark, color: '#fff', padding: '42px 0 38px' }}>
        <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: t.pad }}>
          <p style={{ fontSize: 12, letterSpacing: 2.4, textTransform: 'uppercase', color: '#FFB300', marginBottom: 8, fontWeight: 700 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 999, background: '#22C55E', marginRight: 7 }} />
            {L.kicker}
          </p>
          <h1 style={{ fontSize: 'clamp(28px, 4.6vw, 40px)', fontWeight: 900, letterSpacing: -0.7 }}>{L.titulo}</h1>
          <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.75)', maxWidth: 660, lineHeight: 1.6, marginTop: 12 }}>{L.intro}</p>
        </div>
      </section>

      <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: 'clamp(20px, 3vw, 56px)' }}>
        <div style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, padding: 'clamp(18px,3vw,26px)', boxShadow: t.shadow, marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, color: t.ink }}>🔎 {L.buscaTitulo}</h2>
          <BuscaClima lang={lang} />
        </div>

        {REGIOES.map((reg) => {
          const doReg = ESTADOS.filter((e) => e.regiao === reg)
          return (
            <section key={reg} style={{ marginBottom: 34 }}>
              <h2 style={{ fontSize: 14, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase', color: t.muted, borderBottom: `2px solid ${t.line}`, paddingBottom: 8, marginBottom: 16 }}>{L.regioes[reg]}</h2>
              <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
                {doReg.map((e) => {
                  const c = porUf[e.uf]
                  const w = c && c.agora ? wmo(c.agora.code, lang) : null
                  return (
                    <Link
                      key={e.uf}
                      href={withLang(lang, `/clima/brasil/${e.uf.toLowerCase()}`)}
                      className="card"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radiusSm, padding: '16px 18px', boxShadow: t.shadow }}
                    >
                      <div>
                        <div style={{ fontSize: 15.5, fontWeight: 800, color: t.ink }}>{e.nome}</div>
                        <div style={{ fontSize: 12, color: t.muted }}>{L.capital}: {e.capital}</div>
                      </div>
                      {w && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 24, lineHeight: 1 }}>{w.emoji}</div>
                          <div style={{ fontSize: 18, fontWeight: 900, color: t.ink }}>{c.agora.temp}°</div>
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}

        <p style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', marginTop: 20 }}>{L.atualizado}</p>
      </div>
    </div>
  )
}
