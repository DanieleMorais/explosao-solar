import crypto from 'crypto'
import { verificarUnsub } from '@/lib/email'
import { remover } from '@/lib/firestore-rest'
import { t } from '@/lib/tokens'

export const metadata = { title: 'Descadastrar', robots: { index: false } }

export default async function Page({ searchParams }) {
  const sp = await searchParams
  const email = String(sp?.e || '').trim().toLowerCase()
  const token = String(sp?.t || '')

  let estado = 'invalido'
  if (email && verificarUnsub(email, token)) {
    const id = crypto.createHash('sha256').update(email).digest('hex').slice(0, 40)
    try {
      await remover('newsletter', id)
      await remover('alertas_email', id)
      estado = 'ok'
    } catch {
      estado = 'erro'
    }
  }

  const msg =
    estado === 'ok'
      ? { titulo: 'Pronto, você saiu. 💛', texto: `O e-mail ${email} não receberá mais nossas mensagens. Sentiremos sua falta — você pode voltar quando quiser.` }
      : estado === 'erro'
        ? { titulo: 'Algo deu errado', texto: 'Não conseguimos processar agora. Tente novamente em instantes ou escreva para contato@explosaosolar.com.' }
        : { titulo: 'Link inválido', texto: 'Este link de descadastro não é válido ou expirou. Escreva para contato@explosaosolar.com que resolvemos.' }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>☀️</div>
      <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 12 }}>{msg.titulo}</h1>
      <p style={{ fontSize: 15.5, color: t.muted, lineHeight: 1.6, marginBottom: 26 }}>{msg.texto}</p>
      <a href="/" style={{ display: 'inline-block', background: t.sunGrad, color: '#131417', fontWeight: 800, fontSize: 14.5, padding: '12px 26px', borderRadius: 999 }}>
        Voltar ao Explosão Solar
      </a>
    </div>
  )
}
