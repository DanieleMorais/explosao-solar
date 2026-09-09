import { t } from '@/lib/tokens'

export const ROTULOS_EIXOS = {
  pt: { geral: 'Compatibilidade geral', amor: 'Amor', amizade: 'Amizade', trabalho: 'Trabalho', intimidade: 'Intimidade' },
  en: { geral: 'Overall compatibility', amor: 'Love', amizade: 'Friendship', trabalho: 'Work', intimidade: 'Intimacy' },
  es: { geral: 'Compatibilidad general', amor: 'Amor', amizade: 'Amistad', trabalho: 'Trabajo', intimidade: 'Intimidad' },
}

export const EIXOS = ['amor', 'amizade', 'trabalho', 'intimidade']

export const GRAD_BARRA = 'linear-gradient(90deg, #FFB300 0%, #FF6B00 45%, #7C3AED 100%)'

export function ScoreGeral({ valor, lang = 'pt', tamanho = 'clamp(44px, 8vw, 64px)', escuro = false }) {
  const L = ROTULOS_EIXOS[lang] || ROTULOS_EIXOS.pt
  return (
    <div style={{ textAlign: 'center', minWidth: 120 }}>
      <div style={{ fontSize: tamanho, fontWeight: 900, lineHeight: 1, letterSpacing: -2, background: GRAD_BARRA, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
        {valor}%
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: escuro ? 'rgba(255,255,255,0.7)' : t.muted, marginTop: 6 }}>{L.geral}</div>
    </div>
  )
}

export default function BarrasCompat({ pontos, lang = 'pt', escuro = false }) {
  const L = ROTULOS_EIXOS[lang] || ROTULOS_EIXOS.pt
  const texto = escuro ? '#fff' : t.ink
  const trilho = escuro ? 'rgba(255,255,255,0.14)' : t.line
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      {EIXOS.map((k) => (
        <div key={k}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: texto, marginBottom: 5 }}>
            <span>{L[k]}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{pontos[k]}%</span>
          </div>
          <div role="meter" aria-label={L[k]} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pontos[k]} style={{ height: 10, borderRadius: 999, background: trilho, overflow: 'hidden' }}>
            <div style={{ width: `${pontos[k]}%`, height: '100%', borderRadius: 999, background: GRAD_BARRA, transition: 'width 0.45s ease' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
