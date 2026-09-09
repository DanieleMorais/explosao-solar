import Link from 'next/link'
import { SIGNOS } from '@/lib/signos'
import { ORDEM, pontuar, parDoSlug, slugPar, rotulo, nomeSigno } from '@/lib/combinacoes'
import { getCombinacao, SITE } from '@/lib/content'
import { withLang } from '@/lib/site'
import { alternates, OG_LOCALE } from '@/lib/seo'
import { t } from '@/lib/tokens'
import BarrasCompat, { ScoreGeral, ROTULOS_EIXOS } from '@/components/horoscopo/BarrasCompat'

const STRINGS = {
  pt: {
    voltar: '← Combinação de signos',
    elemento: 'Elemento',
    regente: 'Regente',
    fortes: 'Pontos fortes',
    desafios: 'Desafios',
    dica: 'Dica para os dois',
    faq: 'Perguntas frequentes',
    vejaTambem: 'Veja também',
    outras: (nome) => `Outras combinações de ${nome}`,
    paginaSigno: (nome) => `Horóscopo de ${nome}`,
    ferramenta: 'Testar outra combinação',
    rodape: 'Compatibilidade calculada a partir do elemento, da modalidade e da regência de cada signo',
  },
  en: {
    voltar: '← Zodiac compatibility',
    elemento: 'Element',
    regente: 'Ruler',
    fortes: 'Strengths',
    desafios: 'Challenges',
    dica: 'Tip for the two of you',
    faq: 'Frequently asked questions',
    vejaTambem: 'See also',
    outras: (nome) => `Other ${nome} pairings`,
    paginaSigno: (nome) => `${nome} horoscope`,
    ferramenta: 'Try another pairing',
    rodape: 'Compatibility calculated from each sign’s element, modality and ruling planet',
  },
  es: {
    voltar: '← Compatibilidad de signos',
    elemento: 'Elemento',
    regente: 'Regente',
    fortes: 'Puntos fuertes',
    desafios: 'Desafíos',
    dica: 'Consejo para los dos',
    faq: 'Preguntas frecuentes',
    vejaTambem: 'Ver también',
    outras: (nome) => `Otras combinaciones de ${nome}`,
    paginaSigno: (nome) => `Horóscopo de ${nome}`,
    ferramenta: 'Probar otra combinación',
    rodape: 'Compatibilidad calculada a partir del elemento, la modalidad y el regente de cada signo',
  },
}

const ELEMENTO = {
  pt: { Fogo: 'Fogo', Terra: 'Terra', Ar: 'Ar', Água: 'Água' },
  en: { Fogo: 'Fire', Terra: 'Earth', Ar: 'Air', Água: 'Water' },
  es: { Fogo: 'Fuego', Terra: 'Tierra', Ar: 'Aire', Água: 'Agua' },
}

const signo = (slug) => SIGNOS.find((s) => s.slug === slug)

function truncar(texto, max = 155) {
  const s = String(texto || '').trim()
  if (s.length <= max) return s
  return s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…'
}

export function combinacaoMeta(lang, slug) {
  const dados = getCombinacao(slug)
  const c = dados?.[lang] || dados?.pt
  if (!c) return {}
  return {
    title: c.titulo,
    description: truncar(c.resumo),
    alternates: alternates(lang, `/horoscopo/combinacao/${slug}`),
    openGraph: { type: 'article', locale: OG_LOCALE[lang], title: c.titulo, description: truncar(c.resumo) },
  }
}

function Bloco({ titulo, texto, cor }) {
  return (
    <section style={{ background: t.card, border: `1px solid ${t.line}`, borderLeft: `4px solid ${cor}`, borderRadius: t.radiusSm, padding: '18px 20px', boxShadow: t.shadow }}>
      <h2 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, color: cor, marginBottom: 8 }}>{titulo}</h2>
      <p style={{ fontSize: 15.5, lineHeight: 1.7, color: t.ink, margin: 0 }}>{texto}</p>
    </section>
  )
}

function Lista({ titulo, itens, cor }) {
  return (
    <div style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radiusSm, padding: '18px 20px' }}>
      <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, color: cor, marginBottom: 10 }}>{titulo}</h3>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {itens.map((x) => (
          <li key={x} style={{ display: 'flex', gap: 10, fontSize: 14.5, lineHeight: 1.55, color: t.inkSoft }}>
            <span aria-hidden style={{ flex: '0 0 8px', height: 8, borderRadius: 999, background: cor, marginTop: 7 }} />
            {x}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Pill({ href, simbolo, cor, children }) {
  return (
    <Link href={href} className="hoverlink" style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${t.line}`, borderRadius: 999, padding: '7px 14px', fontSize: 13.5, fontWeight: 700, color: t.inkSoft, background: t.card }}>
      <span style={{ color: cor }}>{simbolo}</span> {children}
    </Link>
  )
}

export default function CombinacaoView({ lang = 'pt', slug }) {
  const s = STRINGS[lang] || STRINGS.pt
  const L = ROTULOS_EIXOS[lang] || ROTULOS_EIXOS.pt
  const dados = getCombinacao(slug)
  const c = dados?.[lang] || dados?.pt
  const { a, b } = parDoSlug(slug)
  const sa = signo(a)
  const sb = signo(b)
  const pontos = pontuar(a, b)
  const mesmo = a === b
  const nomeA = nomeSigno(a, lang)
  const nomeB = nomeSigno(b, lang)
  const el = ELEMENTO[lang] || ELEMENTO.pt

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faq.map((f) => ({
      '@type': 'Question',
      name: f.pergunta,
      acceptedAnswer: { '@type': 'Answer', text: f.resposta },
    })),
  }

  const outrasDe = (x) => ORDEM.filter((y) => slugPar(x, y) !== slug)

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section style={{ background: `radial-gradient(90% 140% at 10% -10%, ${sa.cor}55, transparent 55%), radial-gradient(90% 140% at 90% -10%, ${sb.cor}55, transparent 55%), linear-gradient(140deg, #2b1a5e 0%, #0C0E1A 82%)`, color: '#fff', padding: '40px 0 36px' }}>
        <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: t.pad }}>
          <Link href={withLang(lang, '/horoscopo/combinacao')} className="hoverlink" style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{s.voltar}</Link>
          <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'clamp(20px, 4vw, 48px)', alignItems: 'center', marginTop: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 8, fontSize: 'clamp(46px, 9vw, 68px)', lineHeight: 1, filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.35))' }}>
                  <span style={{ color: sa.cor }}>{sa.simbolo}</span>
                  <span style={{ color: sb.cor }}>{sb.simbolo}</span>
                </div>
                <ScoreGeral valor={pontos.geral} lang={lang} escuro />
              </div>
              <h1 style={{ fontSize: 'clamp(24px, 4.4vw, 38px)', fontWeight: 900, letterSpacing: -0.6, marginTop: 16, lineHeight: 1.15 }}>{c.titulo}</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                {(mesmo ? [sa] : [sa, sb]).map((x) => (
                  <span key={x.slug} style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 999, padding: '6px 12px' }}>
                    <span style={{ color: x.cor }}>{x.simbolo}</span> {nomeSigno(x.slug, lang)} · {s.elemento} {el[x.elemento]} · {s.regente} {x.regente}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: t.radius, padding: 'clamp(16px, 2.5vw, 24px)', backdropFilter: 'blur(8px)' }}>
              <BarrasCompat pontos={pontos} lang={lang} escuro />
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: 'clamp(20px, 3vw, 44px)' }}>
        <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', lineHeight: 1.65, color: t.ink, fontWeight: 500, maxWidth: 900, margin: '0 0 24px' }}>{c.resumo}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Bloco titulo={L.amor} texto={c.amor} cor="#DB2777" />
          <Bloco titulo={L.amizade} texto={c.amizade} cor="#F59E0B" />
          <Bloco titulo={L.trabalho} texto={c.trabalho} cor="#16A34A" />
          <Bloco titulo={L.intimidade} texto={c.intimidade} cor="#7C3AED" />
        </div>

        <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
          <Lista titulo={s.fortes} itens={c.pontosFortes} cor="#16A34A" />
          <Lista titulo={s.desafios} itens={c.desafios} cor="#DC2626" />
        </div>

        <div style={{ marginTop: 24, background: 'linear-gradient(135deg, #2b1a5e 0%, #0C0E1A 100%)', color: '#fff', borderRadius: t.radius, padding: 'clamp(18px, 3vw, 28px)', boxShadow: t.shadow, borderLeft: '4px solid #FFB300' }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#FFB300', marginBottom: 8 }}>{s.dica}</div>
          <p style={{ fontSize: 16.5, lineHeight: 1.6, margin: 0, fontWeight: 600 }}>{c.dica}</p>
        </div>

        <h2 style={{ fontSize: 'clamp(19px, 2.6vw, 24px)', fontWeight: 900, color: t.ink, margin: '36px 0 14px', letterSpacing: -0.3 }}>{s.faq}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {c.faq.map((f, i) => (
            <details key={i} style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radiusSm, padding: '16px 20px', boxShadow: t.shadow }}>
              <summary style={{ fontWeight: 800, fontSize: 15.5, cursor: 'pointer', color: t.ink, lineHeight: 1.4 }}>{f.pergunta}</summary>
              <p style={{ marginTop: 12, fontSize: 14.5, lineHeight: 1.7, color: t.inkSoft }}>{f.resposta}</p>
            </details>
          ))}
        </div>

        <h2 style={{ fontSize: 'clamp(19px, 2.6vw, 24px)', fontWeight: 900, color: t.ink, margin: '36px 0 14px', letterSpacing: -0.3 }}>{s.vejaTambem}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          <Link href={withLang(lang, '/horoscopo/combinacao')} className="btn" style={{ background: t.sunGrad, color: '#131417', fontWeight: 800, fontSize: 14, padding: '10px 18px', borderRadius: 999, whiteSpace: 'nowrap' }}>{s.ferramenta} →</Link>
          <Pill href={`/horoscopo/${a}`} simbolo={sa.simbolo} cor={sa.cor}>{s.paginaSigno(nomeA)}</Pill>
          {!mesmo && <Pill href={`/horoscopo/${b}`} simbolo={sb.simbolo} cor={sb.cor}>{s.paginaSigno(nomeB)}</Pill>}
        </div>

        {(mesmo ? [a] : [a, b]).map((x) => (
          <div key={x} style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: t.ink, margin: '0 0 10px' }}>{s.outras(nomeSigno(x, lang))}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {outrasDe(x).map((y) => {
                const sy = signo(y)
                return (
                  <Pill key={y} href={withLang(lang, `/horoscopo/combinacao/${slugPar(x, y)}`)} simbolo={sy.simbolo} cor={sy.cor}>
                    {rotulo(x, y, lang)} · <span style={{ color: t.sun }}>{pontuar(x, y).geral}%</span>
                  </Pill>
                )
              })}
            </div>
          </div>
        ))}

        <p style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', marginTop: 26 }}>{s.rodape} · {SITE.name}</p>
      </div>
    </div>
  )
}
