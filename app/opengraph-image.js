import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Explosão Solar — Profundidade antes da pressa'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0C0E1A 0%, #1A1030 100%)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -180,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: 'radial-gradient(circle, rgba(255,179,0,0.45) 0%, rgba(255,107,0,0.12) 55%, transparent 75%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            fontSize: 92,
            fontWeight: 900,
            letterSpacing: -3,
            background: 'linear-gradient(100deg, #FF6B00, #FFB300)',
            backgroundClip: 'text',
            color: 'transparent',
            display: 'flex',
            textTransform: 'uppercase',
          }}
        >
          Explosão Solar
        </div>
        <div style={{ fontSize: 30, color: 'rgba(255,255,255,0.72)', letterSpacing: 10, textTransform: 'uppercase', marginTop: 18, display: 'flex' }}>
          Profundidade antes da pressa
        </div>
        <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)', marginTop: 46, display: 'flex' }}>explosaosolar.com</div>
      </div>
    ),
    size
  )
}
