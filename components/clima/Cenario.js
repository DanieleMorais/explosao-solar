'use client'

import Link from 'next/link'
import { temaClima, iconeClima } from '@/lib/clima'

// Cenário animado que muda conforme a condição do tempo + dia/noite.
export default function Cenario({ code, isDia = true, temp, sensacao, texto, nome, sub, voltarHref, voltarLabel, lang = 'pt' }) {
  const tema = temaClima(code, isDia)
  const emoji = iconeClima(code, isDia)
  const p = tema.particula
  const ink = tema.escuro ? '#10233a' : '#fff'
  const soft = tema.escuro ? 'rgba(16,35,58,0.72)' : 'rgba(255,255,255,0.82)'

  const gerar = (n, fn) => Array.from({ length: n }, (_, i) => fn(i))

  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: tema.grad, color: ink, padding: '40px 0 44px', minHeight: 300 }}>
      <style>{CSS}</style>

      {/* camada de partículas */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {p === 'sol' && (
          <>
            <div className="ceu-raios" />
            <div className="ceu-sol" />
          </>
        )}
        {p === 'estrela' && (
          <>
            <div className="ceu-lua" />
            {gerar(26, (i) => (
              <span key={i} className="ceu-estrela" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 23) % 70}%`, animationDelay: `${(i % 7) * 0.4}s`, transform: `scale(${0.6 + ((i % 4) * 0.25)})` }} />
            ))}
          </>
        )}
        {(p === 'nuvem') &&
          gerar(4, (i) => <div key={i} className="ceu-nuvem" style={{ top: `${12 + i * 18}%`, animationDuration: `${26 + i * 9}s`, animationDelay: `${-i * 7}s`, transform: `scale(${1.1 - i * 0.12})`, opacity: 0.85 - i * 0.12 }} />)}
        {p === 'chuva' && (
          <>
            {gerar(2, (i) => <div key={'c' + i} className="ceu-nuvem escura" style={{ top: `${6 + i * 12}%`, animationDuration: `${30 + i * 8}s`, animationDelay: `${-i * 6}s` }} />)}
            {gerar(22, (i) => <span key={i} className="ceu-chuva" style={{ left: `${(i * 4.6) % 100}%`, animationDelay: `${(i % 6) * 0.18}s`, animationDuration: `${0.6 + (i % 3) * 0.12}s`, height: `${14 + (i % 3) * 6}px` }} />)}
          </>
        )}
        {p === 'neve' &&
          gerar(24, (i) => <span key={i} className="ceu-neve" style={{ left: `${(i * 4.2) % 100}%`, animationDelay: `${(i % 8) * 0.5}s`, animationDuration: `${5 + (i % 4)}s`, opacity: 0.6 + (i % 4) * 0.12 }} />)}
        {p === 'raio' && (
          <>
            <div className="ceu-flash" />
            {gerar(2, (i) => <div key={i} className="ceu-nuvem escura" style={{ top: `${6 + i * 10}%`, animationDuration: `${34 + i * 8}s`, animationDelay: `${-i * 6}s` }} />)}
            {gerar(14, (i) => <span key={'r' + i} className="ceu-chuva" style={{ left: `${(i * 7.1) % 100}%`, animationDelay: `${(i % 5) * 0.2}s`, animationDuration: `${0.5 + (i % 2) * 0.12}s` }} />)}
          </>
        )}
      </div>

      {/* conteúdo */}
      <div style={{ position: 'relative', maxWidth: 1120, margin: '0 auto', padding: '0 clamp(16px,4vw,32px)' }}>
        {voltarHref && (
          <Link href={voltarHref} className="hoverlink" style={{ fontSize: 13, color: soft }}>
            {voltarLabel}
          </Link>
        )}
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 900, letterSpacing: -0.8, marginTop: 10, textShadow: tema.escuro ? 'none' : '0 2px 12px rgba(0,0,0,0.25)' }}>
          {lang === 'en' ? `Weather in ${nome}` : lang === 'es' ? `Clima en ${nome}` : `Previsão do tempo em ${nome}`}
        </h1>
        {sub && <p style={{ fontSize: 14, color: soft, marginTop: 4 }}>{sub}</p>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px,3vw,28px)', marginTop: 22, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 'clamp(56px,12vw,84px)', lineHeight: 1, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))' }}>{emoji}</div>
          <div>
            <div style={{ fontSize: 'clamp(46px,11vw,72px)', fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}>{temp}°</div>
            <div style={{ fontSize: 'clamp(15px,2.4vw,18px)', fontWeight: 700, marginTop: 6 }}>{texto}</div>
            {typeof sensacao === 'number' && (
              <div style={{ fontSize: 13.5, color: soft, marginTop: 2 }}>
                {lang === 'en' ? 'Feels like' : lang === 'es' ? 'Sensación' : 'Sensação'} {sensacao}°
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

const CSS = `
.ceu-sol{position:absolute;top:-40px;right:8%;width:150px;height:150px;border-radius:50%;
  background:radial-gradient(circle at 50% 50%,#fff8d6 0%,#ffdf7e 45%,rgba(255,200,80,0) 72%);
  filter:drop-shadow(0 0 40px rgba(255,214,120,0.8));animation:pulsar 5s ease-in-out infinite}
.ceu-raios{position:absolute;top:-115px;right:2%;width:340px;height:340px;
  background:repeating-conic-gradient(from 0deg,rgba(255,240,190,0.22) 0deg 6deg,transparent 6deg 20deg);
  border-radius:50%;animation:girar 90s linear infinite}
@keyframes girar{to{transform:rotate(360deg)}}
@keyframes pulsar{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
.ceu-lua{position:absolute;top:22px;right:9%;width:78px;height:78px;border-radius:50%;
  background:radial-gradient(circle at 38% 38%,#fdfbef,#dfe3f0 70%);
  box-shadow:inset -14px -8px 0 -2px rgba(140,150,180,0.35),0 0 34px rgba(230,235,255,0.5)}
.ceu-estrela{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff;
  box-shadow:0 0 6px #fff;animation:brilhar 3s ease-in-out infinite}
@keyframes brilhar{0%,100%{opacity:.25}50%{opacity:1}}
.ceu-nuvem{position:absolute;left:-30%;width:190px;height:56px;border-radius:50px;
  background:rgba(255,255,255,0.85);box-shadow:40px 8px 0 -6px rgba(255,255,255,0.7),-38px 10px 0 -10px rgba(255,255,255,0.6);
  animation:passar linear infinite}
.ceu-nuvem.escura{background:rgba(60,72,88,0.7);box-shadow:40px 8px 0 -6px rgba(60,72,88,0.55),-38px 10px 0 -10px rgba(60,72,88,0.5)}
@keyframes passar{from{transform:translateX(0)}to{transform:translateX(160vw)}}
.ceu-chuva{position:absolute;top:-20px;width:2px;height:16px;border-radius:2px;
  background:linear-gradient(rgba(200,225,255,0),rgba(200,225,255,0.85));animation:cair-chuva linear infinite}
@keyframes cair-chuva{from{transform:translateY(-10px)}to{transform:translateY(320px)}}
.ceu-neve{position:absolute;top:-12px;width:7px;height:7px;border-radius:50%;background:#fff;
  box-shadow:0 0 5px rgba(255,255,255,0.8);animation:cair-neve linear infinite}
@keyframes cair-neve{0%{transform:translateY(-10px) translateX(0)}50%{transform:translateY(150px) translateX(16px)}100%{transform:translateY(320px) translateX(-8px)}}
.ceu-flash{position:absolute;inset:0;background:rgba(255,255,255,0.9);opacity:0;animation:raio 7s linear infinite}
@keyframes raio{0%,92%,100%{opacity:0}93%{opacity:.55}94%{opacity:0}95%{opacity:.7}96%{opacity:0}}
@media (prefers-reduced-motion: reduce){.ceu-raios,.ceu-sol,.ceu-estrela,.ceu-nuvem,.ceu-chuva,.ceu-neve,.ceu-flash{animation:none}}
`
