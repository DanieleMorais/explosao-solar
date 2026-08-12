// Robô de redes sociais: publica as matérias novas no Instagram e no Facebook
// (Meta Graph API). Seguro por padrão: sem os tokens, só simula (dry-run) e não
// posta nada. Guarda o que já foi postado em scripts/social-state.json.
// Uso: node scripts/social.js [--dry] [--max 3]
//
// Para ligar de verdade, defina no ambiente (secrets do GitHub):
//   META_TOKEN     -> token de acesso de longa duração (Page/IG)
//   META_PAGE_ID   -> ID da Página do Facebook
//   META_IG_ID     -> ID da conta Instagram Business ligada à Página

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const PT_DIR = path.join(ROOT, 'content', 'articles')
const STATE = path.join(__dirname, 'social-state.json')
const SITE = 'https://explosaosolar.com'
const GRAPH = 'https://graph.facebook.com/v20.0'

const log = (m) => console.log(`[${new Date().toISOString()}] ${m}`)

function carregarEnv() {
  const f = path.join(ROOT, '.env.robo')
  if (!fs.existsSync(f)) return
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/^([A-Z_0-9]+)=(.+)$/gm)) process.env[m[1]] = process.env[m[1]] || m[2].trim()
}

const HASHTAGS = {
  mundo: '#noticias #mundo #atualidades',
  brasil: '#brasil #noticias #brasilnews',
  politica: '#politica #brasil #noticias',
  economia: '#economia #dinheiro #mercado',
  tecnologia: '#tecnologia #inovacao #ia',
  ciencia: '#ciencia #descobertas #conhecimento',
  esportes: '#esportes #futebol #esporte',
  cultura: '#cultura #arte #entretenimento',
}

function carregarEstado() {
  try {
    return JSON.parse(fs.readFileSync(STATE, 'utf8'))
  } catch {
    return { postados: [] }
  }
}

function salvarEstado(e) {
  fs.writeFileSync(STATE, JSON.stringify(e, null, 2))
}

function novos(estado, max) {
  const jaFoi = new Set(estado.postados)
  return fs
    .readdirSync(PT_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(PT_DIR, f), 'utf8'))
      } catch {
        return null
      }
    })
    .filter((a) => a && a.slug && a.imagem && !jaFoi.has(a.slug))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, max)
}

function legenda(a) {
  const tags = HASHTAGS[a.categorySlug] || '#noticias'
  const resumo = a.excerpt ? `\n\n${String(a.excerpt).slice(0, 220)}` : ''
  return `${a.title}${resumo}\n\n📲 Notícia completa no link da bio\n\n${tags} #explosaosolar`
}

// Renova a janela de acesso do token de longa duração (usa app id + secret).
// Mantém o token vivo indefinidamente enquanto o robô rodar. Falha = usa o atual.
async function renovarToken(token) {
  const id = process.env.META_APP_ID
  const secret = process.env.META_APP_SECRET
  if (!id || !secret) return token
  try {
    const j = await fetch(
      `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${id}&client_secret=${secret}&fb_exchange_token=${token}`,
      { signal: AbortSignal.timeout(15000) }
    ).then((r) => r.json())
    return j.access_token || token
  } catch {
    return token
  }
}

// form-encoded (x-www-form-urlencoded) — mais confiável que JSON com a Graph API
async function form(url, campos) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(campos).toString(),
  })
  const j = await r.json().catch(() => ({}))
  return { ok: r.ok, j }
}

async function postarFacebook(a, token, pageId) {
  const { ok, j } = await form(`${GRAPH}/${pageId}/feed`, {
    message: `${a.title}\n\n${a.excerpt ? String(a.excerpt).slice(0, 240) : ''}`,
    link: `${SITE}/noticia/${a.slug}`,
    access_token: token,
  })
  if (!ok) throw new Error(`FB: ${j?.error?.error_user_msg || j?.error?.message || ''}`)
  return j.id
}

async function postarInstagram(a, token, igId) {
  // 1) cria o container com a imagem + legenda
  const c = await form(`${GRAPH}/${igId}/media`, { image_url: a.imagem, caption: legenda(a), access_token: token })
  if (!c.ok || !c.j.id) throw new Error(`IG media: ${c.j?.error?.error_user_msg || c.j?.error?.message || ''}`)
  // 2) publica o container
  const p = await form(`${GRAPH}/${igId}/media_publish`, { creation_id: c.j.id, access_token: token })
  if (!p.ok || !p.j.id) throw new Error(`IG publish: ${p.j?.error?.error_user_msg || p.j?.error?.message || ''}`)
  return p.j.id
}

async function main() {
  carregarEnv()
  const dry = process.argv.includes('--dry')
  const seed = process.argv.includes('--seed')
  const max = process.argv.includes('--max') ? parseInt(process.argv[process.argv.indexOf('--max') + 1], 10) : 1

  let token = process.env.META_TOKEN
  const pageId = process.env.META_PAGE_ID
  const igId = process.env.META_IG_ID
  const ligado = token && (pageId || igId) && !dry
  if (ligado) token = await renovarToken(token)

  const estado = carregarEstado()

  // Seed: marca TODAS as matérias atuais como já postadas — ao ligar o robô,
  // ele só publica as que saírem daqui pra frente (não despeja o acervo).
  if (seed) {
    const todas = fs.readdirSync(PT_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
    estado.postados = [...new Set([...estado.postados, ...todas])].slice(-2000)
    salvarEstado(estado)
    return log(`seed: ${estado.postados.length} matérias marcadas como já postadas`)
  }

  const lista = novos(estado, max)
  log(`${lista.length} matéria(s) nova(s) para postar${ligado ? '' : ' (DRY — sem token, nada será postado)'}`)

  for (const a of lista) {
    if (!ligado) {
      log(`DRY postaria: [${a.categorySlug}] ${a.title.slice(0, 70)} — ${legenda(a).length} chars de legenda`)
      continue
    }
    const resultados = []
    if (pageId) {
      try {
        resultados.push('FB:' + (await postarFacebook(a, token, pageId)))
      } catch (e) {
        log(`FB falhou (${a.slug}): ${e.message}`)
      }
    }
    if (igId) {
      try {
        resultados.push('IG:' + (await postarInstagram(a, token, igId)))
      } catch (e) {
        log(`IG falhou (${a.slug}): ${e.message}`)
      }
    }
    if (resultados.length) {
      estado.postados.push(a.slug)
      log(`postado ${a.slug} -> ${resultados.join(' ')}`)
    }
    await new Promise((s) => setTimeout(s, 2000))
  }

  if (ligado) {
    estado.postados = estado.postados.slice(-2000)
    salvarEstado(estado)
    log('estado salvo')
  }
}

main().catch((e) => {
  log('ERRO FATAL: ' + (e.stack || e.message))
  process.exit(0)
})
