import { Suspense } from 'react'
import MinhasCidades from '@/components/MinhasCidades'
import { verificarUnsub } from '@/lib/email'
import { t } from '@/lib/tokens'

export const metadata = { title: 'Minhas cidades', robots: { index: false } }

export default async function Page({ searchParams }) {
  const sp = await searchParams
  const email = String(sp?.e || '').trim().toLowerCase()
  const token = String(sp?.t || '')
  const valido = email && verificarUnsub(email, token)

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(28px,5vw,56px) 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 34 }}>☀️</div>
        <h1 style={{ fontSize: 'clamp(24px,4vw,32px)', fontWeight: 900, letterSpacing: -0.5, marginTop: 8 }}>Seu resumo, do seu jeito</h1>
        <p style={{ fontSize: 15, color: t.muted, lineHeight: 1.6, marginTop: 10, maxWidth: 480, marginInline: 'auto' }}>
          Escolha as cidades e bairros que você quer no seu resumo diário. Todo dia de manhã você recebe o clima de cada um deles + as últimas notícias.
        </p>
      </div>

      {valido ? (
        <Suspense>
          <MinhasCidades email={email} token={token} />
        </Suspense>
      ) : (
        <p style={{ textAlign: 'center', fontSize: 15, color: t.muted }}>
          Este link não é válido ou expirou. Abra o link direto do seu e-mail do Explosão Solar, ou escreva para contato@explosaosolar.com.
        </p>
      )}
    </div>
  )
}
