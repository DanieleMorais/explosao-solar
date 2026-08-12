import Link from 'next/link'
import { notFound } from 'next/navigation'
import { estado, geocodificar } from '@/lib/brasil'
import { previsaoPonto } from '@/lib/clima'
import { t } from '@/lib/tokens'
import { withLang } from '@/lib/site'
import { CardClima } from '@/components/clima/ClimaBits'
import BuscaClima from '@/components/clima/BuscaClima'

export const revalidate = 1800

function titulo(slug) {
  return slug
    .split('-')
    .map((p) => (p.length <= 2 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ')
}

const TXT = {
  pt: { voltar: (nome) => `← ${nome}`, bairros: 'Clima por bairro', bairrosIntro: 'Digite o nome do seu bairro para ver a previsão exata da sua região.', semDados: 'Não conseguimos carregar o clima desta cidade agora.', atualizado: 'Atualizado a cada 30 min · Fonte: Open-Meteo' },
  en: { voltar: (nome) => `← ${nome}`, bairros: 'Weather by neighborhood', bairrosIntro: 'Type your neighborhood to see the exact forecast for your area.', semDados: "We couldn't load this city's weather right now.", atualizado: 'Updated every 30 min · Source: Open-Meteo' },
  es: { voltar: (nome) => `← ${nome}`, bairros: 'Clima por barrio', bairrosIntro: 'Escribe tu barrio para ver el pronóstico exacto de tu zona.', semDados: 'No pudimos cargar el clima de esta ciudad ahora.', atualizado: 'Actualizado cada 30 min · Fuente: Open-Meteo' },
}

export default async function CidadeClimaView({ lang = 'pt', uf, cidade }) {
  const e = estado(uf)
  if (!e) notFound()
  const L = TXT[lang] || TXT.pt
  const nomeCidade = titulo(cidade)

  const local = await geocodificar(nomeCidade, e.uf)
  const clima = local ? await previsaoPonto(local.lat, local.lon) : null

  return (
    <div>
      <section style={{ background: `radial-gradient(110% 160% at 85% -20%, ${t.sun}55, transparent 55%), linear-gradient(135deg, ${t.sun} 0%, #101322 80%)`, color: '#fff', padding: '40px 0 36px' }}>
        <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: t.pad }}>
          <Link href={withLang(lang, `/clima/brasil/${e.uf.toLowerCase()}`)} className="hoverlink" style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{L.voltar(e.nome)}</Link>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, letterSpacing: -0.8, marginTop: 10 }}>{nomeCidade}</h1>
          <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>{e.nome} · {e.uf}</p>
        </div>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(20px, 3vw, 56px)' }}>
        {clima ? (
          <CardClima titulo={nomeCidade} subtitulo={local.rotulo} clima={clima} lang={lang} destaque />
        ) : (
          <p style={{ fontSize: 15, color: t.muted }}>{L.semDados}</p>
        )}

        <div style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, padding: 'clamp(18px,3vw,26px)', boxShadow: t.shadow, marginTop: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: t.ink, marginBottom: 4 }}>🏘️ {L.bairros}</h2>
          <p style={{ fontSize: 13.5, color: t.muted, marginBottom: 14 }}>{L.bairrosIntro}</p>
          <BuscaClima lang={lang} uf={e.uf} placeholder={{ pt: `Ex.: seu bairro em ${nomeCidade}`, en: `e.g. your neighborhood in ${nomeCidade}`, es: `Ej.: tu barrio en ${nomeCidade}` }[lang]} />
        </div>

        <p style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', marginTop: 28 }}>{L.atualizado}</p>
      </div>
    </div>
  )
}
