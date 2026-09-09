'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SIGNOS } from '@/lib/signos'
import { pontuar, slugPar, rotulo, nomeSigno } from '@/lib/combinacoes'
import { withLang } from '@/lib/site'
import { t } from '@/lib/tokens'
import BarrasCompat, { ScoreGeral } from './BarrasCompat'

const TXT = {
  pt: { seu: 'Seu signo', outro: 'O signo dele(a)', escolha: 'Escolha os dois signos para ver o resultado na hora.', falta: 'Agora escolha o segundo signo.', ver: 'Ver a combinação completa', trocar: 'Trocar' },
  en: { seu: 'Your sign', outro: 'Their sign', escolha: 'Pick both signs to see the result instantly.', falta: 'Now pick the second sign.', ver: 'See the full match', trocar: 'Swap' },
  es: { seu: 'Tu signo', outro: 'El signo de él/ella', escolha: 'Elige los dos signos para ver el resultado al instante.', falta: 'Ahora elige el segundo signo.', ver: 'Ver la combinación completa', trocar: 'Cambiar' },
}

function GrupoSignos({ titulo, lang, valor, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: t.muted, marginBottom: 10 }}>{titulo}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))', gap: 8 }}>
        {SIGNOS.map((s) => {
          const ativo = valor === s.slug
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() => onChange(s.slug)}
              aria-pressed={ativo}
              className="chipnav"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '10px 4px',
                borderRadius: t.radiusSm,
                border: ativo ? '1px solid transparent' : `1px solid ${t.line}`,
                background: ativo ? 'linear-gradient(135deg, #FFB300, #7C3AED)' : t.card,
                color: ativo ? '#fff' : t.inkSoft,
                boxShadow: ativo ? '0 6px 18px rgba(124,58,237,0.28)' : 'none',
                fontWeight: 700,
                fontSize: 12.5,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 1, color: ativo ? '#fff' : s.cor }}>{s.simbolo}</span>
              {nomeSigno(s.slug, lang)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function SeletorCombinacao({ lang = 'pt' }) {
  const L = TXT[lang] || TXT.pt
  const [a, setA] = useState(null)
  const [b, setB] = useState(null)
  const pronto = a && b
  const pontos = pronto ? pontuar(a, b) : null

  return (
    <div style={{ background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, boxShadow: t.shadow, padding: 'clamp(16px, 3vw, 28px)' }}>
      <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(16px, 3vw, 32px)' }}>
        <GrupoSignos titulo={L.seu} lang={lang} valor={a} onChange={setA} />
        <GrupoSignos titulo={L.outro} lang={lang} valor={b} onChange={setB} />
      </div>

      <div style={{ marginTop: 24, borderTop: `1px solid ${t.line}`, paddingTop: 22 }}>
        {!pronto && (
          <p style={{ fontSize: 14.5, color: t.muted, textAlign: 'center', margin: 0 }}>{a || b ? L.falta : L.escolha}</p>
        )}
        {pronto && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'clamp(18px, 3vw, 36px)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: '0 0 auto', margin: '0 auto' }}>
              <div style={{ fontSize: 38, lineHeight: 1, display: 'flex', gap: 10 }}>
                <span style={{ color: SIGNOS.find((s) => s.slug === a).cor }}>{SIGNOS.find((s) => s.slug === a).simbolo}</span>
                <span style={{ color: SIGNOS.find((s) => s.slug === b).cor }}>{SIGNOS.find((s) => s.slug === b).simbolo}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: t.ink }}>{rotulo(a, b, lang)}</div>
              <ScoreGeral valor={pontos.geral} lang={lang} />
            </div>
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <BarrasCompat pontos={pontos} lang={lang} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
                <Link
                  href={withLang(lang, `/horoscopo/combinacao/${slugPar(a, b)}`)}
                  className="btn"
                  style={{ flex: '1 1 230px', textAlign: 'center', background: t.sunGrad, color: '#131417', fontWeight: 800, fontSize: 15, padding: '13px 20px', borderRadius: 999, whiteSpace: 'nowrap' }}
                >
                  {L.ver} →
                </Link>
                <button
                  type="button"
                  onClick={() => { setA(null); setB(null) }}
                  className="hoverlink"
                  style={{ flex: '0 0 auto', border: `1px solid ${t.line}`, borderRadius: 999, padding: '12px 18px', fontSize: 14, fontWeight: 700, color: t.inkSoft }}
                >
                  {L.trocar}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
