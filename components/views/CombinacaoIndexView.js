import Link from 'next/link'
import { SIGNOS } from '@/lib/signos'
import { pontuar, parDoSlug, rotulo, todosOsPares } from '@/lib/combinacoes'
import { withLang } from '@/lib/site'
import { alternates } from '@/lib/seo'
import { t } from '@/lib/tokens'
import { SITE } from '@/lib/content'
import SeletorCombinacao from '@/components/horoscopo/SeletorCombinacao'

const STRINGS = {
  pt: {
    kicker: 'Astrologia',
    title: 'Combinação de signos',
    intro: 'Escolha o seu signo e o da outra pessoa e veja, na hora, a compatibilidade de vocês no amor, na amizade, no trabalho e na intimidade — com a explicação completa de cada par.',
    voltar: '← Horóscopo do dia',
    todas: 'Todas as 78 combinações',
    todasIntro: 'Cada par tem uma página própria com a dinâmica entre os dois signos: pontos fortes, desafios, dica prática e perguntas frequentes.',
    geral: 'compatibilidade',
    rodape: 'Compatibilidade calculada a partir do elemento, da modalidade e da regência de cada signo',
    metaTitle: 'Combinação de signos: descubra se vocês combinam no amor, amizade e trabalho',
    metaDescription: 'Ferramenta de combinação de signos: escolha dois signos e veja a compatibilidade no amor, na amizade, no trabalho e na intimidade, com explicação completa das 78 combinações do zodíaco.',
  },
  en: {
    kicker: 'Astrology',
    title: 'Zodiac sign compatibility',
    intro: 'Pick your sign and theirs to see instantly how well you match in love, friendship, work and intimacy — with a full breakdown of every pair.',
    voltar: '← Daily horoscope',
    todas: 'All 78 combinations',
    todasIntro: 'Every pair has its own page covering the dynamic between the two signs: strengths, challenges, a practical tip and common questions.',
    geral: 'compatibility',
    rodape: 'Compatibility calculated from each sign’s element, modality and ruling planet',
    metaTitle: 'Zodiac compatibility: find out if you match in love, friendship and work',
    metaDescription: 'Zodiac compatibility tool: pick two signs and see how well they match in love, friendship, work and intimacy, with a full breakdown of all 78 zodiac pairings.',
  },
  es: {
    kicker: 'Astrología',
    title: 'Compatibilidad de signos',
    intro: 'Elige tu signo y el de la otra persona y descubre al instante su compatibilidad en el amor, la amistad, el trabajo y la intimidad, con la explicación completa de cada pareja.',
    voltar: '← Horóscopo del día',
    todas: 'Las 78 combinaciones',
    todasIntro: 'Cada pareja tiene su propia página con la dinámica entre los dos signos: puntos fuertes, desafíos, un consejo práctico y preguntas frecuentes.',
    geral: 'compatibilidad',
    rodape: 'Compatibilidad calculada a partir del elemento, la modalidad y el regente de cada signo',
    metaTitle: 'Compatibilidad de signos: descubre si son compatibles en el amor, la amistad y el trabajo',
    metaDescription: 'Herramienta de compatibilidad de signos: elige dos signos y mira su compatibilidad en el amor, la amistad, el trabajo y la intimidad, con la explicación completa de las 78 combinaciones del zodíaco.',
  },
}

export function combinacaoIndexMeta(lang) {
  const s = STRINGS[lang]
  return { title: s.metaTitle, description: s.metaDescription, alternates: alternates(lang, '/horoscopo/combinacao') }
}

const signo = (slug) => SIGNOS.find((s) => s.slug === slug)

export default function CombinacaoIndexView({ lang = 'pt' }) {
  const s = STRINGS[lang] || STRINGS.pt
  const pares = todosOsPares().map((slug) => {
    const { a, b } = parDoSlug(slug)
    return { slug, a: signo(a), b: signo(b), rotulo: rotulo(a, b, lang), geral: pontuar(a, b).geral }
  })

  return (
    <div>
      <section style={{ background: 'radial-gradient(120% 160% at 80% -20%, #7C3AED66, transparent 55%), linear-gradient(140deg, #2b1a5e 0%, #0C0E1A 80%)', color: '#fff', padding: '40px 0 34px' }}>
        <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: t.pad }}>
          <Link href="/horoscopo" className="hoverlink" style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{s.voltar}</Link>
          <p style={{ fontSize: 12, letterSpacing: 2, color: '#c9b6ff', fontWeight: 800, textTransform: 'uppercase', marginTop: 14 }}>{s.kicker}</p>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, letterSpacing: -0.8, marginTop: 8 }}>{s.title}</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 8, maxWidth: 720, lineHeight: 1.6 }}>{s.intro}</p>
        </div>
      </section>

      <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: 'clamp(20px, 3vw, 48px)' }}>
        <SeletorCombinacao lang={lang} />

        <h2 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 900, color: t.ink, margin: '40px 0 6px', letterSpacing: -0.4 }}>{s.todas}</h2>
        <p style={{ fontSize: 14.5, color: t.muted, margin: '0 0 18px', maxWidth: 720, lineHeight: 1.6 }}>{s.todasIntro}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
          {pares.map((p) => (
            <Link
              key={p.slug}
              href={withLang(lang, `/horoscopo/combinacao/${p.slug}`)}
              className="card"
              style={{ display: 'block', background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radiusSm, padding: '14px 12px', textAlign: 'center' }}
            >
              <div style={{ fontSize: 24, lineHeight: 1, display: 'flex', justifyContent: 'center', gap: 6 }}>
                <span style={{ color: p.a.cor }}>{p.a.simbolo}</span>
                <span style={{ color: p.b.cor }}>{p.b.simbolo}</span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: t.ink, marginTop: 8, lineHeight: 1.3 }}>{p.rotulo}</div>
              <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>
                <strong style={{ color: t.sun, fontSize: 14 }}>{p.geral}%</strong> {s.geral}
              </div>
            </Link>
          ))}
        </div>
        <p style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', marginTop: 26 }}>{s.rodape} · {SITE.name}</p>
      </div>
    </div>
  )
}
