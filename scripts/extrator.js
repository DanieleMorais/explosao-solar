// Extrai o texto integral de uma matéria a partir da URL.
// Sem texto real da fonte, a IA preenche o vazio inventando — este módulo é a
// diferença entre reportagem e ficção.

const MIN_PARAGRAFO = 90

const LIXO = /^(A\+|A-|Copyright|Assine|Compartilhe|Publicidade|Leia (também|mais)|Siga o|Receba|Cadastre|Aceitar|Este site|Todos os direitos|Foto:|Crédito:|Imagem:|Getty|Reuters$|AFP$)/i

function limparHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/<figure[\s\S]*?<\/figure>/gi, '')
}

function decodificar(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
}

// JSON-LD articleBody é a fonte mais limpa quando o site publica.
function doJsonLd(html) {
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let dados
    try {
      dados = JSON.parse(m[1].trim())
    } catch {
      continue
    }
    const nos = Array.isArray(dados) ? dados : dados['@graph'] || [dados]
    for (const n of nos) {
      if (n && typeof n.articleBody === 'string' && n.articleBody.split(/\s+/).length > 120) {
        return n.articleBody.replace(/\s+/g, ' ').trim()
      }
    }
  }
  return null
}

function doCorpo(html) {
  const limpo = limparHtml(html)
  const escopos = []
  for (const re of [/<article[\s\S]*?<\/article>/gi, /<main[\s\S]*?<\/main>/gi]) {
    for (const m of limpo.matchAll(re)) escopos.push(m[0])
  }
  if (!escopos.length) escopos.push(limpo)

  let melhor = ''
  for (const escopo of escopos) {
    const paras = [...escopo.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => decodificar(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim())
      .filter((p) => p.length >= MIN_PARAGRAFO && !LIXO.test(p))
    const texto = paras.join('\n\n')
    if (texto.length > melhor.length) melhor = texto
  }
  return melhor
}

async function extrair(url, { minPalavras = 220, timeoutMs = 30000 } = {}) {
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ExplosaoSolarBot/1.0; +https://explosaosolar.com)',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const html = await r.text()

  const texto = doJsonLd(html) || doCorpo(html)
  const palavras = texto ? texto.split(/\s+/).filter(Boolean).length : 0
  if (palavras < minPalavras) throw new Error(`texto insuficiente (${palavras} palavras)`)

  const tituloM = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i) || html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const dataM =
    html.match(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)/i) ||
    html.match(/<time[^>]+datetime=["']([^"']+)/i)

  return {
    texto: texto.slice(0, 12000),
    palavras,
    titulo: tituloM ? decodificar(tituloM[1]).trim() : null,
    publicadoEm: dataM ? dataM[1] : null,
    url: r.url || url,
  }
}

module.exports = { extrair }
