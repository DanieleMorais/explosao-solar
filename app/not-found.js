import Link from 'next/link'
import SunLogo from '@/components/SunLogo'
import { t } from '@/lib/tokens'

export default function NotFound() {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <SunLogo size={56} />
      </div>
      <h1 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -0.6, marginBottom: 12 }}>Página não encontrada</h1>
      <p style={{ fontSize: 15.5, color: t.muted, lineHeight: 1.6, marginBottom: 26 }}>
        Essa página saiu de órbita — mas as notícias continuam brilhando na nossa home.
      </p>
      <Link
        href="/"
        className="btn"
        style={{ display: 'inline-block', background: t.sunGrad, color: '#131417', fontWeight: 800, fontSize: 14.5, padding: '13px 28px', borderRadius: 999 }}
      >
        Voltar ao início
      </Link>
    </div>
  )
}
