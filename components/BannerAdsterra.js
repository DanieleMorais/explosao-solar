'use client'

import { useEffect, useState } from 'react'

// Banners da Adsterra (domínio explosaosolar.com, 5956905), criados em 15/10 a pedido da Dani: banners + janela do canto, sem o
// anúncio que abre outro site no clique. Cada banner roda num iframe isolado (srcDoc): o atOptions da Adsterra é global, então
// dois banners na mesma página se atropelariam; o sandbox (sem allow-top-navigation) não deixa o anúncio sequestrar a aba.
const CHAVES = { '728x90': 'e953417ae1849a55ad059f676c0b9bc2', '320x50': 'be9ce9de790aa8d4d5a2789b463d5a7c', '300x250': '582926a9e2eb0d0e47be231bc0d8a92b' }
const ROTULO = {
  pt: 'Publicidade', en: 'Advertisement', es: 'Publicidad',
  // blog em 12 idiomas (16/10): a matéria traduzida não pode ter nada em português
  fr: 'Publicité', de: 'Anzeige', it: 'Pubblicità', nl: 'Advertentie', ru: 'Реклама', zh: '广告', ja: '広告', ko: '광고', ar: 'إعلان',
}

// formato "faixa": 728x90 no computador, 320x50 no celular (a largura só é conhecida no navegador). "quadrado": 300x250.
export default function BannerAdsterra({ formato = 'faixa', lang = 'pt' }) {
  const [tamanho, setTamanho] = useState(null)
  useEffect(() => {
    setTamanho(formato === 'quadrado' ? '300x250' : window.innerWidth < 760 ? '320x50' : '728x90')
  }, [formato])

  const rotulo = ROTULO[lang] || ROTULO.pt
  // espaço reservado antes de escolher o tamanho, para o texto da página não pular quando o banner chega
  if (!tamanho) return <div aria-hidden="true" style={{ minHeight: (formato === 'quadrado' ? 250 : 50) + 22, margin: '26px auto' }} />

  const [w, h] = tamanho.split('x').map(Number)
  const chave = CHAVES[tamanho]
  const html =
    '<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body>' +
    `<script>atOptions={'key':'${chave}','format':'iframe','height':${h},'width':${w},'params':{}};</script>` +
    `<script src="https://www.highperformanceformat.com/${chave}/invoke.js"></script></body></html>`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, margin: '26px auto', maxWidth: '100%' }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 2, color: '#8A8577', textTransform: 'uppercase' }}>{rotulo}</span>
      <iframe
        title={rotulo}
        srcDoc={html}
        width={w}
        height={h}
        scrolling="no"
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-popups"
        style={{ border: 0, maxWidth: '100%', display: 'block' }}
      />
    </div>
  )
}
