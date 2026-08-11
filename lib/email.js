// Envio de e-mail via Resend. Usado pela API da newsletter (boas-vindas) e pelo
// robô de alertas (broadcast). Sem SDK — chamada REST direta.

const FROM = 'Explosão Solar <contato@explosaosolar.com>'
const REPLY_TO = 'contato@explosaosolar.com'

function apiKey() {
  return process.env.RESEND_API_KEY || ''
}

export function emailConfigurado() {
  return Boolean(apiKey())
}

// Envia um e-mail. destinatarios: string ou array. Retorna { ok, id?, erro? }.
export async function enviarEmail({ para, assunto, html, texto }) {
  const key = apiKey()
  if (!key) return { ok: false, erro: 'RESEND_API_KEY ausente' }

  const to = Array.isArray(para) ? para : [para]
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, reply_to: REPLY_TO, subject: assunto, html, text: texto }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) return { ok: false, erro: data?.message || `HTTP ${r.status}` }
  return { ok: true, id: data.id }
}

const WRAP = (conteudo) => `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f4f0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#131417">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#0C0E1A;border-radius:14px 14px 0 0;padding:26px 28px;text-align:center">
      <span style="font-size:22px;font-weight:900;letter-spacing:-.3px;background:linear-gradient(100deg,#FF6B00,#FFB300);-webkit-background-clip:text;background-clip:text;color:transparent;text-transform:uppercase">☀ Explosão Solar</span>
    </div>
    <div style="background:#fff;border:1px solid #e9e6df;border-top:none;border-radius:0 0 14px 14px;padding:30px 28px;line-height:1.65;font-size:15px">
      ${conteudo}
    </div>
    <p style="text-align:center;color:#8a8f98;font-size:12px;margin-top:18px">
      Explosão Solar · explosaosolar.com<br>
      Você recebe este e-mail porque se inscreveu no nosso portal.
    </p>
  </div>
</body></html>`

export function emailBoasVindas() {
  return {
    assunto: 'Bem-vindo ao Explosão Solar ☀️',
    html: WRAP(`
      <h1 style="font-size:20px;margin:0 0 14px">Você está dentro.</h1>
      <p style="margin:0 0 14px">Obrigado por assinar o <strong>Explosão Solar</strong>. Toda semana você recebe as matérias que explicam o que está por trás das manchetes — com profundidade e contexto, sem pressa.</p>
      <p style="margin:0 0 20px">Enquanto isso, dá uma olhada no que já está no ar:</p>
      <a href="https://explosaosolar.com" style="display:inline-block;background:linear-gradient(100deg,#FF6B00,#FFB300);color:#131417;font-weight:800;text-decoration:none;padding:12px 24px;border-radius:999px">Ler agora →</a>`),
    texto: 'Você está dentro! Obrigado por assinar o Explosão Solar. Leia agora em https://explosaosolar.com',
  }
}

// Alerta de desastre para broadcast. lang = pt/en/es.
export function emailAlerta({ titulo, resumo, url, lang = 'pt' }) {
  const cta = { pt: 'Ver a cobertura completa →', en: 'See full coverage →', es: 'Ver la cobertura completa →' }[lang] || 'Ver →'
  const tag = { pt: 'ALERTA', en: 'ALERT', es: 'ALERTA' }[lang] || 'ALERTA'
  return {
    assunto: `⚠️ ${titulo}`,
    html: WRAP(`
      <span style="display:inline-block;background:#DC2626;color:#fff;font-size:11px;font-weight:800;letter-spacing:1.5px;padding:4px 12px;border-radius:999px;margin-bottom:14px">${tag}</span>
      <h1 style="font-size:20px;margin:0 0 12px;line-height:1.3">${titulo}</h1>
      <p style="margin:0 0 20px;color:#3d4149">${resumo}</p>
      <a href="${url}" style="display:inline-block;background:linear-gradient(100deg,#FF6B00,#FFB300);color:#131417;font-weight:800;text-decoration:none;padding:12px 24px;border-radius:999px">${cta}</a>`),
    texto: `${titulo}\n\n${resumo}\n\n${url}`,
  }
}
