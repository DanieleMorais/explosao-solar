// Envio de e-mail via Resend. Usado pela API da newsletter (boas-vindas) e pelo
// robô de alertas (broadcast). Sem SDK — chamada REST direta.

import crypto from 'crypto'

const SITE_URL = 'https://explosaosolar.com'

// Token de descadastro: HMAC do e-mail com um segredo do servidor (sempre presente).
function segredoUnsub() {
  return (process.env.FIREBASE_SA_B64 || process.env.RESEND_API_KEY || 'explosao-solar-fallback').slice(0, 48)
}
export function unsubToken(email) {
  return crypto.createHmac('sha256', segredoUnsub()).update(String(email).toLowerCase()).digest('hex').slice(0, 24)
}
export function verificarUnsub(email, token) {
  return Boolean(token) && token === unsubToken(email)
}
export function unsubUrl(email) {
  return `${SITE_URL}/descadastrar?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`
}

// Envia pelo domínio já verificado na Resend (universidadefadamadrinha.com);
// o nome exibido é "Explosão Solar" e as respostas caem no Gmail da Dani.
// Trocar para contato@explosaosolar.com quando o domínio próprio for verificado
// (exige plano Resend com 2+ domínios).
const FROM = process.env.EMAIL_FROM || 'Explosão Solar <explosaosolar@universidadefadamadrinha.com>'
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'fadamadrinhadm@gmail.com'

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

const WRAP = (conteudo, email) => `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f4f0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#131417">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#0C0E1A;border-radius:14px 14px 0 0;padding:26px 28px;text-align:center">
      <span style="font-size:22px;font-weight:900;letter-spacing:-.3px;background:linear-gradient(100deg,#FF6B00,#FFB300);-webkit-background-clip:text;background-clip:text;color:transparent;text-transform:uppercase">☀ Explosão Solar</span>
    </div>
    <div style="background:#fff;border:1px solid #e9e6df;border-top:none;border-radius:0 0 14px 14px;padding:30px 28px;line-height:1.65;font-size:15px">
      ${conteudo}
    </div>
    <p style="text-align:center;color:#8a8f98;font-size:12px;margin-top:18px">
      Explosão Solar · explosaosolar.com<br>
      Você recebe este e-mail porque se inscreveu no nosso portal.${email ? ` · <a href="${unsubUrl(email)}" style="color:#8a8f98">Descadastrar</a>` : ''}
    </p>
  </div>
</body></html>`

export function emailBoasVindas(email) {
  const cidades = email ? `${SITE_URL}/minhas-cidades?e=${encodeURIComponent(email)}&t=${unsubToken(email)}` : `${SITE_URL}/clima/brasil`
  return {
    assunto: 'Bem-vindo ao Explosão Solar ☀️',
    html: WRAP(
      `
      <h1 style="font-size:20px;margin:0 0 14px">Você está dentro. 💛</h1>
      <p style="margin:0 0 14px">Obrigado por assinar o <strong>Explosão Solar</strong>. Todo dia de manhã você recebe um resumo com o <strong>clima da sua cidade</strong> e as <strong>últimas notícias</strong> — direto no seu e-mail.</p>
      <p style="margin:0 0 18px">Comece escolhendo as cidades e bairros que você quer acompanhar:</p>
      <a href="${cidades}" style="display:inline-block;background:linear-gradient(100deg,#FF6B00,#FFB300);color:#131417;font-weight:800;text-decoration:none;padding:12px 24px;border-radius:999px">Escolher minhas cidades →</a>
      <p style="margin:20px 0 0;font-size:13px;color:#8a8f98">Ou <a href="${SITE_URL}" style="color:#FF6B00">explore o portal agora</a>.</p>`,
      email
    ),
    texto: `Você está dentro! Todo dia você recebe o clima da sua cidade + as últimas notícias. Escolha suas cidades: ${cidades}`,
  }
}

// Resumo diário personalizado: bom dia + clima das cidades do inscrito + notícias.
// cidades = [{ rotulo, emoji, texto, temp, max, min, chuva }]
export function emailDigest({ dataFmt, cidades, noticias, email, semanal = false }) {
  const cartoesClima = (cidades || [])
    .map(
      (c) => `
      <tr><td style="padding:6px 0">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F6F0;border-radius:12px;border-left:4px solid #FF6B00">
          <tr>
            <td style="padding:14px 16px;vertical-align:middle">
              <div style="font-size:15px;font-weight:700;color:#131417;line-height:1.2">${c.rotulo}</div>
              <div style="font-size:12.5px;color:#8a8f98;margin-top:2px">${c.emoji} ${c.texto}${c.chuva >= 50 ? ` · 💧 ${c.chuva}% de chuva` : ''}</div>
            </td>
            <td style="padding:14px 16px;text-align:right;vertical-align:middle;white-space:nowrap">
              <span style="font-size:30px;font-weight:900;color:#131417">${c.temp}°</span>
              <div style="font-size:12px;color:#8a8f98">${c.min}° / ${c.max}°</div>
            </td>
          </tr>
        </table>
      </td></tr>`
    )
    .join('')

  const semCidades = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7ED;border:1px solid #FFD8A8;border-radius:12px;margin-bottom:6px">
      <tr><td style="padding:16px 18px">
        <div style="font-size:14px;font-weight:700;color:#131417">📍 Escolha suas cidades</div>
        <div style="font-size:13px;color:#8a5a2b;margin-top:4px">Você ainda não marcou nenhuma. Escolha suas cidades e bairros para receber o clima do seu lugar todo dia.</div>
        <a href="${SITE_URL}/minhas-cidades?e=${encodeURIComponent(email)}&t=${unsubToken(email)}" style="display:inline-block;margin-top:12px;background:#131417;color:#fff;text-decoration:none;font-weight:700;font-size:13px;padding:10px 18px;border-radius:999px">Escolher minhas cidades →</a>
      </td></tr>
    </table>`

  const destaque = (noticias || [])[0]
  const destaqueHtml = destaque
    ? `<tr><td style="padding:2px 0 14px">
        <a href="${SITE_URL}/noticia/${destaque.slug}" style="text-decoration:none;color:inherit;display:block">
          ${destaque.imagem ? `<img src="${destaque.imagem}" width="540" alt="" style="width:100%;max-width:540px;height:auto;border-radius:12px;display:block;margin-bottom:12px" />` : ''}
          ${destaque.category ? `<div style="font-size:11px;color:#FF6B00;text-transform:uppercase;letter-spacing:.8px;font-weight:800;margin-bottom:5px">${destaque.category}</div>` : ''}
          <div style="font-size:19px;font-weight:900;color:#131417;line-height:1.28;letter-spacing:-.3px">${destaque.title}</div>
          ${destaque.excerpt ? `<div style="font-size:13.5px;color:#5b616b;line-height:1.5;margin-top:7px">${String(destaque.excerpt).slice(0, 140)}${String(destaque.excerpt).length > 140 ? '…' : ''}</div>` : ''}
        </a>
      </td></tr>`
    : ''

  const linhasNews = (noticias || [])
    .slice(1)
    .map(
      (a) => `
      <tr><td style="padding:10px 0;border-top:1px solid #eee">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          ${a.imagem ? `<td width="78" style="vertical-align:top;padding-right:12px"><a href="${SITE_URL}/noticia/${a.slug}"><img src="${a.imagem}" width="78" height="56" alt="" style="width:78px;height:56px;object-fit:cover;border-radius:8px;display:block" /></a></td>` : ''}
          <td style="vertical-align:top"><a href="${SITE_URL}/noticia/${a.slug}" style="color:#131417;text-decoration:none;font-weight:700;font-size:14px;line-height:1.35">${a.title}</a>${a.category ? `<div style="font-size:10.5px;color:#8a8f98;text-transform:uppercase;letter-spacing:.5px;margin-top:4px">${a.category}</div>` : ''}</td>
        </tr></table>
      </td></tr>`
    )
    .join('')

  const gerir = `${SITE_URL}/minhas-cidades?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`

  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:0;background:#f4f4f0">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0"><tr><td align="center" style="padding:24px 12px">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif">
      <tr><td style="background:#0C0E1A;border-radius:16px 16px 0 0;padding:28px 30px;text-align:center">
        <div style="font-size:23px;font-weight:900;letter-spacing:-.4px;color:#FFB300;text-transform:uppercase">☀ Explosão Solar</div>
        <div style="font-size:11px;letter-spacing:2px;color:rgba(255,255,255,.5);text-transform:uppercase;margin-top:6px">${semanal ? 'Seu resumo da semana' : 'Seu resumo diário'}</div>
      </td></tr>
      <tr><td style="background:#ffffff;padding:30px 30px 24px">
        <div style="font-size:22px;font-weight:900;color:#131417;letter-spacing:-.4px">${semanal ? 'Seu resumo da semana ☀️' : 'Bom dia! ☀️'}</div>
        <div style="font-size:13px;color:#8a8f98;text-transform:capitalize;margin:4px 0 24px">${dataFmt}</div>

        <div style="font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#8a8f98;font-weight:700;margin-bottom:10px">🌤️ O tempo onde você está</div>
        <table width="100%" cellpadding="0" cellspacing="0">${cidades && cidades.length ? cartoesClima : semCidades}</table>
        ${cidades && cidades.length ? `<div style="margin:8px 0 26px"><a href="${gerir}" style="color:#FF6B00;text-decoration:none;font-size:12.5px;font-weight:600">Gerenciar minhas cidades →</a></div>` : '<div style="height:20px"></div>'}

        ${noticias && noticias.length ? `<div style="font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#8a8f98;font-weight:700;margin-bottom:10px">📰 As últimas notícias</div><table width="100%" cellpadding="0" cellspacing="0">${destaqueHtml}${linhasNews}</table>` : ''}

        <div style="text-align:center;margin-top:28px">
          <a href="${SITE_URL}" style="display:inline-block;background:#FF6B00;color:#fff;text-decoration:none;font-weight:800;font-size:15px;padding:14px 32px;border-radius:999px">Ler o portal completo →</a>
        </div>
      </td></tr>
      <tr><td style="background:#ffffff;border-radius:0 0 16px 16px;border-top:1px solid #eee;padding:20px 30px;text-align:center">
        <div style="font-size:12px;color:#8a8f98;line-height:1.6">
          Explosão Solar · explosaosolar.com<br>
          <a href="${gerir}" style="color:#8a8f98">Escolher cidades</a> · <a href="${unsubUrl(email)}" style="color:#8a8f98">Descadastrar</a>
        </div>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`

  return {
    assunto: semanal ? `☀️ Seu resumo da semana — Explosão Solar` : `☀️ Bom dia! Seu resumo — ${dataFmt.split(',')[0]}`,
    html,
    texto: `Bom dia! ${dataFmt}\n\n${(cidades || []).map((c) => `${c.rotulo}: ${c.temp}° (${c.min}-${c.max})`).join('\n')}\n\nÚltimas notícias:\n${(noticias || []).map((a, i) => `${i + 1}. ${a.title} — ${SITE_URL}/noticia/${a.slug}`).join('\n')}\n\n${SITE_URL}\nGerenciar cidades: ${gerir}`,
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
