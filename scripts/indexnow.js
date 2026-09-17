// Avisa Bing/Edge, Yandex, Seznam e Naver (protocolo IndexNow) sobre o que mudou.
// O robô de notícias já pinga o que ele mesmo publica; este aqui cobre o RESTO:
// horóscopo, tendências, terremotos, Colômbia, aprofundamentos e as páginas fixas.
// Uso: node scripts/indexnow.js [--horas 3] [--tudo] [--seco]

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const RAIZ = path.join(__dirname, '..')
const BASE = 'https://explosaosolar.com'
const CHAVE = 'a7f3e9c14b2d4868a1c5f0e6d9b3a2c7'
const LOTE = 10000 // teto do protocolo por requisição

const arg = (nome, padrao) => {
  const i = process.argv.indexOf(nome)
  return i === -1 ? padrao : process.argv[i + 1]
}
const tem = (nome) => process.argv.includes(nome)

// Quem mudou de verdade vem do HISTÓRICO do git, não da data do arquivo: no
// GitHub Actions o checkout é novo e TODO arquivo teria a data da rodada.
function arquivosMudados(horas) {
  try {
    const ref = arg('--ref', '') // no GitHub o HEAD já é o main; local dá pra apontar origin/main
    const saida = execSync(`git log ${ref} --since="${horas} hours ago" --name-only --pretty=format: -- content/`, {
      cwd: RAIZ,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return new Set(saida.split('\n').map((l) => l.trim().replace(/\\/g, '/')).filter(Boolean))
  } catch {
    return null // sem git (ou histórico raso): cai no caminho do --tudo
  }
}

function caminhoArtigo(lang, arquivo) {
  return lang === 'pt' ? `content/articles/${arquivo}` : `content/${lang}/articles/${arquivo}`
}

function artigosRecentes(mudados) {
  const urls = []
  for (const lang of ['pt', 'en', 'es']) {
    const dir = lang === 'pt' ? path.join(RAIZ, 'content', 'articles') : path.join(RAIZ, 'content', lang, 'articles')
    if (!fs.existsSync(dir)) continue
    const prefixo = lang === 'pt' ? '' : `/${lang}`
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json')) continue
      if (!tem('--tudo') && !(mudados && mudados.has(caminhoArtigo(lang, f)))) continue
      urls.push(`${BASE}${prefixo}/noticia/${f.replace('.json', '')}`)
    }
  }
  return urls
}

function paginasFixas() {
  const urls = []
  for (const p of ['', '/en', '/es']) {
    urls.push(BASE + (p || '/'))
    urls.push(`${BASE}${p}/horoscopo`)
    urls.push(`${BASE}${p}/clima`)
    urls.push(`${BASE}${p}/horoscopo/combinacao`)
  }
  return urls
}

// Horóscopo e combinações mudam o conteúdo sem mudar o arquivo do artigo:
// entram sempre que o JSON foi reescrito dentro da janela.
function paginasDeDados(mudados) {
  const urls = []
  if (tem('--tudo') || (mudados && mudados.has('content/horoscopo.json'))) {
    for (const p of ['', '/en', '/es']) urls.push(`${BASE}${p}/horoscopo`)
  }
  const dirComb = path.join(RAIZ, 'content', 'combinacoes')
  if (fs.existsSync(dirComb)) {
    for (const f of fs.readdirSync(dirComb)) {
      if (!f.endsWith('.json')) continue
      if (!tem('--tudo') && !(mudados && mudados.has(`content/combinacoes/${f}`))) continue
      for (const p of ['', '/en', '/es']) urls.push(`${BASE}${p}/horoscopo/combinacao/${f.replace('.json', '')}`)
    }
  }
  return urls
}

async function enviar(urls) {
  const alvos = ['https://api.indexnow.org/indexnow', 'https://www.bing.com/indexnow', 'https://yandex.com/indexnow']
  const resultados = []
  for (let i = 0; i < urls.length; i += LOTE) {
    const fatia = urls.slice(i, i + LOTE)
    for (const alvo of alvos) {
      try {
        const r = await fetch(alvo, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ host: 'explosaosolar.com', key: CHAVE, keyLocation: `${BASE}/${CHAVE}.txt`, urlList: fatia }),
          signal: AbortSignal.timeout(30000),
        })
        resultados.push(`${alvo.replace('https://', '').split('/')[0]} HTTP ${r.status} (${fatia.length})`)
      } catch (e) {
        resultados.push(`${alvo.replace('https://', '').split('/')[0]} ERRO ${e.message}`)
      }
    }
  }
  return resultados
}

async function main() {
  const horas = Number(arg('--horas', 3)) || 3
  const mudados = tem('--tudo') ? null : arquivosMudados(horas)
  if (!tem('--tudo') && mudados === null) {
    console.log('IndexNow: sem histórico do git para saber o que mudou — nada enviado (rode com --tudo se for de propósito).')
    return
  }
  const urls = [...new Set([...artigosRecentes(mudados), ...paginasDeDados(mudados), ...(tem('--tudo') ? paginasFixas() : [])])]
  if (!urls.length) {
    console.log(`IndexNow: nada mudou nas últimas ${horas}h.`)
    return
  }
  if (tem('--seco')) {
    console.log(`IndexNow (simulação): ${urls.length} URLs\n  ` + urls.slice(0, 10).join('\n  '))
    return
  }
  const res = await enviar(urls)
  console.log(`IndexNow: ${urls.length} URLs\n  ` + res.join('\n  '))
}

main().catch((e) => {
  console.error('IndexNow falhou:', e.message)
  process.exit(0) // nunca derrubar o robô por causa do ping
})
