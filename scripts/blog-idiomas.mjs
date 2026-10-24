// Admin DE ARQUIVO do blog em 12 idiomas do Explosão Solar (regra da Dani, 15/10/2026), no padrão do Cristal Hunter
// (cristal-hunter/scripts/blog-i18n.mjs). O site no ar só LÊ (worker-lang.js + lib/adminArtigos.js, segredo
// PAINEL_SAUDE_TOKEN); aqui, na pasta do projeto, este script grava e publica em content/i18n, e o que vai ao ar é o
// commit + push na main (o deploy-cloudflare.yml builda e publica).
//
//   node scripts/blog-idiomas.mjs estado                          resumo (= GET /api/admin/artigos) + cota do dia + pendências
//   node scripts/blog-idiomas.mjs exportar [--status publicado|rascunho] [--saida arq.json] [--slug x] [--limite n] [--todos]
//                                                                 as matérias PT no contrato da esteira (= GET ?completo=1), sem rede
//   node scripts/blog-idiomas.mjs ingerir <arquivo.json|arquivo.md|pasta>
//                                                                 grava traduções como RASCUNHO, nunca sobrescreve (= POST)
//        aceita { artigos: [...] }, [...] ou um item; pasta com <slugPt>/<idioma>.json (saída da esteira) ou
//        <idioma>/<slugPt>.(json|md). .md = cabeçalho "---" com titulo/descricao/palavrasChave/slugIdioma e o corpo em Markdown
//   node scripts/blog-idiomas.mjs slugs                           preenche slugIdioma onde falta (= POST ?acao=slugs)
//   node scripts/blog-idiomas.mjs publicar [--limite 1] [--slug x]
//                                                                 publica CONJUNTOS (as 11 traduções de uma matéria, mesmo carimbo),
//                                                                 no máximo 1 POR DIA (fuso de Brasília, contando o que já saiu
//                                                                 hoje) (= POST ?acao=publicar)
//   node scripts/blog-idiomas.mjs retirar <slugPt> [--motivo "..."]   tira do ar as traduções de uma matéria, para sempre
//   node scripts/blog-idiomas.mjs conferir                        valida content/i18n inteiro (sai 1 se houver problema)
//   node scripts/blog-idiomas.mjs servir [--porta 7788]           o contrato inteiro em http://127.0.0.1:7788/api/admin/artigos
//   node scripts/blog-idiomas.mjs avisar [--dias 1 | --slug x] [--seco]   IndexNow das traduções no ar (DEPOIS do deploy)
//   opções gerais: --pasta <dir> (outra pasta de traduções) e --raiz <dir> (outra raiz com content/articles): para testar
//   sem tocar no projeto.
//
// FREIO (o site saiu do Google em agosto por conteúdo em escala com tradução automática): só matéria PT NO AR com 600+
// palavras; 1 conjunto por dia; no máximo 7 conjuntos esperando em rascunho (a exportação só entrega o que cabe na fila:
// nada de backfill em massa); nunca sobrescreve. Matéria PT nova não espera tradução aqui (os robôs publicam o português
// direto, scripts/freio.js), então EN/ES novas só saem DENTRO do conjunto. As traduções antigas de content/en e content/es
// (noindex) não são tocadas.
// PT RETIRADO (marcador positivo em content/i18n/_retirados.json, por `retirar` ou porque o arquivo PT sumiu): as traduções
// dele saem do ar, não recebem nada novo e nunca voltam sozinhas, nem se o arquivo PT reaparecer.
// ingerir, slugs, publicar e retirar pegam o trinco <pasta>/_trinco.json (fora do git): dois ao mesmo tempo, o segundo
// sai com 1; quem perde o trinco no meio para antes de gravar. Nada aqui imprime segredo. Sai com 1 quando algo pedido
// não foi feito.
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

// Os módulos de lib/ são ESM em .js num package sem "type": o Node 22+ detecta, mas avisa; relança a si mesmo sem o aviso.
const FLAG = '--disable-warning=MODULE_TYPELESS_PACKAGE_JSON'
if (!process.execArgv.includes(FLAG)) {
  const r = spawnSync(process.execPath, [FLAG, ...process.argv.slice(1)], { stdio: 'inherit' })
  process.exit(r.status ?? 1)
}

const PROJETO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const COM_VALOR = new Set(['--pasta', '--raiz', '--status', '--saida', '--limite', '--slug', '--porta', '--dias', '--motivo'])
const opt = (n, d = null) => {
  const i = args.indexOf(n)
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : d
}
const tem = (n) => args.includes(n)
const livres = args.filter((a, i) => !a.startsWith('--') && !COM_VALOR.has(args[i - 1]))
const [comando, alvo] = livres

// a leitura (lib/traducoes.js) olha estas duas variáveis a cada chamada
process.env.ES_RAIZ = path.resolve(opt('--raiz') || PROJETO)
if (opt('--pasta')) process.env.ES_I18N = path.resolve(opt('--pasta'))

const lib = (n) => import(pathToFileURL(path.join(PROJETO, 'lib', n)).href)
const { IDIOMAS_TRADUCAO: IDIOMAS } = await lib('idiomas.js')
const { slugNoIdioma, SLUG_IDIOMA_OK, caminhoArtigo } = await lib('blogSlug.js')
const { responderAdmin, COMO_INGERIR } = await lib('adminArtigos.js')
const T = await lib('traducoes.js')
const { POR_DIA, MIN_PALAVRAS_TRADUCAO: MIN, FILA_MAX, SLUG_PT_OK } = T

const BASE = 'https://explosaosolar.com'
const CHAVE_INDEXNOW = 'a7f3e9c14b2d4868a1c5f0e6d9b3a2c7' // pública por natureza: o site a serve em /<chave>.txt (scripts/indexnow.js)
const LIMITE = { titulo: 200, descricao: 400, conteudo: 300000, palavraChave: 80, palavrasChave: 15 }
const PASTA = () => T.dirI18n()
const texto = (v) => typeof v === 'string' && v.trim().length > 0
const agoraIso = () => new Date().toISOString()
const ordem = (lista) => IDIOMAS.filter((i) => lista.includes(i))
const lerJson = (arq) => JSON.parse(fs.readFileSync(arq, 'utf8').replace(/^﻿/, ''))
const serializar = (obj) => JSON.stringify(obj, null, 2) + '\n'
const saida = (o) => console.log(JSON.stringify(o, null, 2))

/* ─────────────── trinco (ingerir, slugs, publicar e retirar nunca rodam dois ao mesmo tempo) ─────────────── */

// Criado com 'wx' (atômico: só um cria). Vencido (10 min sem soltar = processo morreu) é apagado e disputado de novo.
// Relido antes de cada gravação: quem perdeu o trinco no meio para, em vez de gravar por cima do outro.
const TRINCO = () => path.join(PASTA(), '_trinco.json')
const TRINCO_MS = 10 * 60000
const MEU_TRINCO = randomUUID()
const trincoMeu = () => {
  try {
    return lerJson(TRINCO()).id === MEU_TRINCO
  } catch {
    return false
  }
}

function pegarTrinco(nome) {
  const meu = JSON.stringify({ id: MEU_TRINCO, pid: process.pid, comando: nome, em: agoraIso(), ate: Date.now() + TRINCO_MS })
  fs.mkdirSync(PASTA(), { recursive: true })
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      fs.writeFileSync(TRINCO(), meu, { encoding: 'utf8', flag: 'wx' })
      return trincoMeu() ? null : 'outro comando pegou o trinco no mesmo instante'
    } catch (e) {
      if (e.code !== 'EEXIST') throw e
      let outro = null
      try {
        outro = lerJson(TRINCO())
      } catch {}
      // ilegível = o outro acabou de criar e ainda está escrevendo: vale a data do arquivo
      const ate = outro ? Number(outro.ate) : fs.statSync(TRINCO()).mtimeMs + TRINCO_MS
      if (ate > Date.now()) return `outro comando em andamento (${outro?.comando || '?'}, pid ${outro?.pid || '?'}, desde ${outro?.em || '?'})`
      fs.rmSync(TRINCO(), { force: true })
    }
  }
  return 'não consegui pegar o trinco'
}
const soltarTrinco = () => {
  if (trincoMeu()) fs.rmSync(TRINCO(), { force: true })
}
const PERDIDO = 'trinco perdido (outro comando assumiu): parei sem gravar'

/* ─────────────── arquivos ─────────────── */

// grava só se o arquivo NÃO existe (link atômico): duas remessas juntas nunca se sobrescrevem
function escreverNovo(arq, obj) {
  fs.mkdirSync(path.dirname(arq), { recursive: true })
  const tmp = `${arq}.${process.pid}.${Date.now()}.tmp`
  fs.writeFileSync(tmp, serializar(obj))
  try {
    fs.linkSync(tmp, arq)
    return true
  } catch (e) {
    if (e.code === 'EEXIST') return false
    if (e.code !== 'EPERM' && e.code !== 'ENOTSUP' && e.code !== 'EXDEV') throw e
    try {
      fs.writeFileSync(arq, serializar(obj), { flag: 'wx' })
      return true
    } catch (e2) {
      if (e2.code === 'EEXIST') return false
      throw e2
    }
  } finally {
    fs.rmSync(tmp, { force: true })
  }
}

// troca o arquivo inteiro de uma vez (nunca fica meio escrito): só para o MESMO documento (status, slugIdioma, registros)
function substituir(arq, obj) {
  fs.mkdirSync(path.dirname(arq), { recursive: true })
  const tmp = `${arq}.${process.pid}.${Date.now()}.tmp`
  fs.writeFileSync(tmp, serializar(obj))
  fs.renameSync(tmp, arq)
}

const lerRetirados = () => (fs.existsSync(T.arquivoRetirados()) ? lerJson(T.arquivoRetirados()) : { retirados: [] })
const lerPublicacoes = () => (fs.existsSync(T.arquivoPublicacoes()) ? lerJson(T.arquivoPublicacoes()) : { publicacoes: [] })

// Matéria com tradução cujo arquivo PT sumiu de content/articles (o robô de duplicatas apaga, por exemplo): vira RETIRADA
// com o marcador, para nunca voltar sozinha se outro texto nascer com o mesmo slug. Só nos comandos que gravam.
function marcarSumidos(docs) {
  const sumidos = [...new Set(docs.map((d) => d.slug))].filter((s) => !T.ptDoSlug(s) && !T.ptRetirado(s))
  if (!sumidos.length) return []
  if (!trincoMeu()) throw new Error(PERDIDO)
  const r = lerRetirados()
  for (const slug of sumidos) r.retirados.push({ slug, em: agoraIso(), motivo: 'o arquivo PT sumiu de content/articles' })
  substituir(T.arquivoRetirados(), r)
  T.limparCache()
  return sumidos
}

/* ─────────────── HTML seguro ─────────────── */

// O conteúdo vai para a página com dangerouslySetInnerHTML: só passam as tags de texto, links http(s) com nofollow e
// tudo fechado na ordem certa (tag aberta sobrando engoliria o resto da página no HTML do servidor).
const PERMITIDAS = new Set(['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'a', 'br', 'blockquote', 'sup', 'sub'])
const BLOCOS = new Set(['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'blockquote'])
const COM_CONTEUDO = /<(script|style|iframe|object|embed|svg|math|template|noscript|form|textarea|select|button|title|head)\b[\s\S]*?<\/\1\s*>/gi
const ESCAPAR_TEXTO = (s) => s.replace(/&(?!(?:[a-z][a-z0-9]{1,31}|#\d{1,7}|#x[0-9a-f]{1,6});)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const ESCAPAR_ATRIBUTO = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const DESFAZER_ENTIDADES = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')

function limparHtml(html) {
  const fonte = String(html || '').replace(/<!--[\s\S]*?-->/g, '').replace(COM_CONTEUDO, '')
  const out = []
  const pilha = []
  const fechar = (nome) => {
    while (pilha.length) {
      const t = pilha.pop()
      out.push(`</${t}>`)
      if (t === nome) break
    }
  }
  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g
  let fim = 0
  for (let m; (m = re.exec(fonte)); ) {
    out.push(ESCAPAR_TEXTO(fonte.slice(fim, m.index)))
    fim = re.lastIndex
    const nome = m[1].toLowerCase()
    if (!PERMITIDAS.has(nome)) continue
    if (m[0].startsWith('</')) {
      if (pilha.includes(nome)) fechar(nome)
      continue
    }
    if (nome === 'br') {
      out.push('<br>')
      continue
    }
    // bloco dentro de parágrafo: o navegador fecharia o <p>; fecha aqui para o HTML do servidor bater com o do navegador
    if (BLOCOS.has(nome) && pilha.includes('p')) fechar('p')
    if (nome === 'li') {
      const lista = Math.max(pilha.lastIndexOf('ul'), pilha.lastIndexOf('ol'))
      if (pilha.lastIndexOf('li') > lista) fechar('li')
    }
    if (nome === 'a') {
      const h = (m[2] || '').match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i)
      const href = h ? DESFAZER_ENTIDADES((h[1] ?? h[2] ?? h[3] ?? '').trim()) : ''
      out.push(/^https?:\/\/[^\s]+$/i.test(href) ? `<a href="${ESCAPAR_ATRIBUTO(href)}" target="_blank" rel="noopener noreferrer nofollow">` : '<a>')
    } else {
      out.push(`<${nome}>`)
    }
    pilha.push(nome)
  }
  out.push(ESCAPAR_TEXTO(fonte.slice(fim)))
  while (pilha.length) out.push(`</${pilha.pop()}>`)
  return out.join('').replace(/<p>\s*<\/p>/g, '').trim()
}

// Markdown simples (o que a esteira devolve): ##/###/####, listas, citação, **negrito**, *itálico* e [link](https://...).
// CADA LINHA não vazia é um parágrafo: a esteira recebe o HTML do PT com um bloco por linha e devolve igual, e o modelo
// não quebra linha no meio do parágrafo (juntar linhas grudaria parágrafos diferentes num só).
function markdownParaHtml(md) {
  const inline = (s) =>
    ESCAPAR_TEXTO(s)
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, t, u) => `<a href="${u}">${t}</a>`)
      .replace(/\[([^\]]+)\]\((\/[^\s)]*)\)/g, '$1') // link interno relativo: o slug muda de idioma para idioma, fica só o texto
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
      .replace(/`([^`]+)`/g, '$1')
  const out = []
  let lista = null
  const fecharLista = () => {
    if (lista) out.push(`<${lista.tipo}>${lista.itens.map((i) => `<li>${inline(i)}</li>`).join('')}</${lista.tipo}>`)
    lista = null
  }
  for (const bruta of String(md || '').replace(/\r\n?/g, '\n').split('\n')) {
    const l = bruta.trim()
    let m
    if (!l) fecharLista()
    else if ((m = l.match(/^(#{1,4})\s+(.*)$/))) {
      fecharLista()
      const n = Math.max(2, m[1].length)
      out.push(`<h${n}>${inline(m[2])}</h${n}>`)
    } else if ((m = l.match(/^(?:[-*+]|(\d+)[.)])\s+(.*)$/))) {
      const tipo = m[1] ? 'ol' : 'ul'
      if (lista && lista.tipo !== tipo) fecharLista()
      if (!lista) lista = { tipo, itens: [] }
      lista.itens.push(m[2])
    } else if ((m = l.match(/^>\s?(.*)$/))) {
      fecharLista()
      out.push(`<blockquote><p>${inline(m[1])}</p></blockquote>`)
    } else {
      fecharLista()
      out.push(`<p>${inline(l)}</p>`)
    }
  }
  fecharLista()
  return out.join('\n')
}

// qualquer tag comum = HTML (um conteúdo só com <script> tem de sumir na limpeza, não virar texto escapado)
const pareceHtml = (s) => /<\/?(p|h[1-6]|ul|ol|li|blockquote|br|div|span|a|strong|em|b|i|script|style|iframe|img|table)\b/i.test(String(s || ''))
const paraHtmlSeguro = (conteudo) => limparHtml(pareceHtml(conteudo) ? conteudo : markdownParaHtml(conteudo))
const textoPuro = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

/* ─────────────── ingestão (= POST) ─────────────── */

// .md: cabeçalho entre linhas "---" (chave: valor) e o corpo em Markdown
function lerMd(arq) {
  const fonte = fs.readFileSync(arq, 'utf8').replace(/^﻿/, '').replace(/\r\n?/g, '\n')
  const m = fonte.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) throw new Error('arquivo .md sem o cabeçalho entre linhas "---"')
  const item = { conteudo: m[2].trim() }
  for (const linha of m[1].split('\n')) {
    const i = linha.indexOf(':')
    if (i <= 0) continue
    const chave = linha.slice(0, i).trim()
    let valor = linha.slice(i + 1).trim().replace(/^(["'])([\s\S]*)\1$/, '$2')
    if (chave === 'palavrasChave') valor = valor.replace(/^\[|\]$/g, '').split(/[,，、،;؛]/).map((s) => s.trim().replace(/^(["'])(.*)\1$/, '$2')).filter(Boolean)
    item[chave] = valor
  }
  return item
}

// Itens de um arquivo ou de uma pasta. Arquivo sem idioma/slug herda do caminho: <slug>/<idioma>.x ou <idioma>/<slug>.x.
function coletarItens(caminho) {
  const itens = []
  const deArquivo = (arq) => {
    const ext = path.extname(arq).toLowerCase()
    let lista
    try {
      const d = ext === '.md' ? lerMd(arq) : lerJson(arq)
      lista = Array.isArray(d) ? d : Array.isArray(d?.artigos) ? d.artigos : [d]
    } catch (e) {
      itens.push({ item: null, origem: arq, erro: `não consegui ler: ${e.message}` })
      return
    }
    const nome = path.basename(arq, ext)
    const pai = path.basename(path.dirname(arq))
    for (const it of lista) {
      if (it && typeof it === 'object' && (!it.idioma || !it.slug)) {
        if (IDIOMAS.includes(nome)) {
          it.idioma ||= nome
          it.slug ||= pai
        } else if (IDIOMAS.includes(pai)) {
          it.idioma ||= pai
          it.slug ||= nome
        }
      }
      itens.push({ item: it, origem: arq })
    }
  }
  if (fs.statSync(caminho).isFile()) {
    deArquivo(caminho)
    return itens
  }
  const andar = (dir) => {
    for (const n of fs.readdirSync(dir).sort()) {
      const p = path.join(dir, n)
      if (fs.statSync(p).isDirectory()) {
        if (!n.startsWith('_') && n !== 'node_modules') andar(p)
        continue
      }
      if (!/\.(json|md)$/i.test(n) || n.startsWith('_') || /\.REPROVADA\.(json|md)$/i.test(n)) continue
      deArquivo(p)
    }
  }
  andar(caminho)
  return itens
}

// null = pode gravar; texto = motivo da recusa
function motivoRecusa(a, docs) {
  if (!a || typeof a !== 'object') return 'item não é um objeto'
  const idioma = a.idioma ? String(a.idioma) : 'pt'
  if (idioma === 'pt') return 'matéria PT não entra por aqui: os robôs escrevem e publicam o português (freio de 3 por dia); esta porta só recebe traduções'
  if (!IDIOMAS.includes(idioma)) return `idioma inválido: ${idioma} (use ${IDIOMAS.join(', ')})`
  const slug = String(a.slug || '')
  if (!SLUG_PT_OK.test(slug)) return 'slug inválido: é o slug da matéria PT (a-z, 0-9 e hífen)'
  if (T.ptRetirado(slug)) return 'matéria PT retirada (content/i18n/_retirados.json): não recebe tradução'
  const pt = T.ptDoSlug(slug)
  if (!pt) return 'slug não existe em português (content/articles)'
  if (!T.ptNoAr(slug)) return 'a matéria PT ainda não está publicada'
  if (pt.palavras < MIN) return `a matéria PT tem ${pt.palavras} palavras; o freio só deixa traduzir com ${MIN} ou mais`
  for (const c of ['titulo', 'descricao', 'conteudo']) if (!texto(a[c])) return `campo obrigatório vazio: ${c}`
  for (const c of ['titulo', 'descricao', 'conteudo']) if (a[c].length > LIMITE[c]) return `${c} com ${a[c].length} caracteres (máximo ${LIMITE[c]})`
  if (a.categoria != null && a.categoria !== '' && String(a.categoria) !== pt.categoria) return `categoria diferente do original (esperado "${pt.categoria}")`
  if (a.palavrasChave != null && !Array.isArray(a.palavrasChave)) return 'palavrasChave deve ser lista'
  const chaves = (a.palavrasChave || []).map((p) => String(p).trim()).filter(Boolean)
  if (chaves.length > LIMITE.palavrasChave || chaves.some((p) => p.length > LIMITE.palavraChave)) return `palavrasChave: no máximo ${LIMITE.palavrasChave}, cada uma com até ${LIMITE.palavraChave} caracteres`
  if (a.titulo.trim() === pt.titulo.trim()) return 'título igual ao português'
  if (a.slugIdioma != null && a.slugIdioma !== '' && !SLUG_IDIOMA_OK.test(String(a.slugIdioma).normalize('NFC'))) return 'slugIdioma inválido (só letras, números e hífen)'
  if (docs.some((d) => d.idioma === idioma && d.slug === slug)) return 'já existe'
  // a fila conta os conjuntos esperando em rascunho; matéria que já está nela pode completar o conjunto
  const naFila = new Set(docs.filter((d) => d.status !== 'publicado' && !T.ptRetirado(d.slug)).map((d) => d.slug))
  if (!naFila.has(slug) && naFila.size >= FILA_MAX) return `fila cheia: ${naFila.size} conjuntos esperando (máximo ${FILA_MAX}; sai ${POR_DIA} por dia). Esta matéria entra depois`
  return null
}

function gravar(lista) {
  T.limparCache()
  const docs = [...T.lerTraducoes()]
  const retiradosAgora = marcarSumidos(docs)
  const resultados = []
  let guardadas = 0
  let repetidos = 0
  for (const { item: a, origem, erro } of lista) {
    const idioma = a?.idioma ? String(a.idioma) : 'pt'
    const id = `${idioma}:${a?.slug || '?'}`
    const motivo = erro || motivoRecusa(a, docs)
    if (motivo === 'já existe') {
      repetidos++
      const ja = docs.find((d) => d.idioma === idioma && d.slug === a.slug)
      resultados.push({ id, ok: false, motivo, slugIdioma: ja?.slugIdioma || null, origem })
      continue
    }
    if (motivo) {
      resultados.push({ id, ok: false, motivo, origem })
      continue
    }
    const pt = T.ptDoSlug(a.slug)
    const conteudo = paraHtmlSeguro(a.conteudo)
    if (!T.contaPalavras(conteudo)) {
      resultados.push({ id, ok: false, motivo: 'conteudo ficou vazio depois de limpar o HTML', origem })
      continue
    }
    if (textoPuro(conteudo) === textoPuro(pt.conteudo)) {
      resultados.push({ id, ok: false, motivo: 'conteúdo igual ao português', origem })
      continue
    }
    // o slug que a esteira manda passa pela MESMA normalização do título (ASCII minúsculo nos idiomas latinos)
    const desejado = slugNoIdioma(texto(a.slugIdioma) ? String(a.slugIdioma) : a.titulo.trim(), idioma, a.slug)
    const doc = {
      idioma,
      slug: a.slug,
      slugIdioma: T.slugIdiomaLivre(idioma, desejado, a.slug, docs),
      titulo: a.titulo.trim(),
      descricao: a.descricao.trim(),
      conteudo,
      formato: 'html',
      palavrasChave: (a.palavrasChave || []).map((p) => String(p).trim()).filter(Boolean),
      categoria: pt.categoria,
      tempoLeitura: Math.round(Number(a.tempoLeitura)) || pt.tempoLeitura,
      status: 'rascunho',
      criadoEm: agoraIso(),
      publicadoEm: null,
    }
    if (!trincoMeu()) {
      resultados.push({ id, ok: false, motivo: PERDIDO, origem })
      break
    }
    if (!escreverNovo(T.arquivoTraducao(idioma, a.slug), doc)) {
      repetidos++
      resultados.push({ id, ok: false, motivo: 'já existe', origem })
      continue
    }
    docs.push(doc)
    guardadas++
    resultados.push({ id, ok: true, motivo: 'guardada como rascunho', slugIdioma: doc.slugIdioma, origem })
  }
  T.limparCache()
  const r = T.resumoConjuntos()
  const falhas = resultados.filter((x) => !x.ok && x.motivo !== 'já existe')
  return { ok: !falhas.length, traducoesGuardadas: guardadas, repetidos, recusadas: falhas.length, resultados, retiradosAgora, traducoesNaFila: r.traducoes.naFila, filaConjuntos: r.freio.filaAtual, filaMax: FILA_MAX }
}

/* ─────────────── slugs (= POST ?acao=slugs) ─────────────── */

function slugs() {
  T.limparCache()
  const docs = T.lerTraducoes().map((d) => ({ ...d }))
  const feitos = []
  // mais antigas primeiro, para ficarem com o slug sem sufixo
  for (const d of [...docs].sort((a, b) => String(a.criadoEm || '').localeCompare(String(b.criadoEm || '')))) {
    if (d.slugIdioma || !texto(d.titulo)) continue
    if (!trincoMeu()) return { ok: false, erro: PERDIDO, preenchidos: feitos.length, slugs: feitos }
    d.slugIdioma = T.slugIdiomaLivre(d.idioma, slugNoIdioma(d.titulo, d.idioma, d.slug), d.slug, docs)
    substituir(T.arquivoTraducao(d.idioma, d.slug), d)
    feitos.push({ id: `${d.idioma}:${d.slug}`, slugIdioma: d.slugIdioma, caminho: caminhoArtigo(d.idioma, d.slugIdioma) })
  }
  T.limparCache()
  return { ok: true, preenchidos: feitos.length, slugs: feitos }
}

/* ─────────────── publicar (= POST ?acao=publicar&limite=1) ─────────────── */

// Publica até `limite` CONJUNTOS (o freio é 1 por dia, contando o que já saiu hoje no fuso de Brasília pelo carimbo das
// traduções E pelo _publicacoes.json): as 11 traduções em rascunho de uma matéria PT no ar, todas com o mesmo carimbo,
// a mais antiga da fila primeiro. Conjunto que caiu no meio HOJE termina com o carimbo dele, sem gastar outra cota.
function publicar({ limite = POR_DIA, soSlug = null, agora = new Date() } = {}) {
  T.limparCache()
  const pedido = Math.max(1, Math.min(POR_DIA, Number(limite) || POR_DIA))
  const retiradosAgora = marcarSumidos(T.lerTraducoes())
  const docs = T.lerTraducoes().map((d) => ({ ...d }))
  const dia = T.diaBrasilia(agora)
  const saiuHoje = T.conjuntosDoDia(dia, docs)
  const cota = Math.max(0, Math.min(pedido, POR_DIA - saiuHoje.size))

  const porSlug = new Map()
  for (const d of docs) {
    const r = porSlug.get(d.slug) || { rascunho: [], idiomas: new Set(), criadoEm: '', carimbo: '' }
    r.idiomas.add(d.idioma)
    if (d.status !== 'publicado') {
      r.rascunho.push(d)
      if (!r.criadoEm || String(d.criadoEm || '') < r.criadoEm) r.criadoEm = String(d.criadoEm || '')
    } else if (d.publicadoEm && T.diaBrasilia(d.publicadoEm) === dia) r.carimbo = d.publicadoEm
    porSlug.set(d.slug, r)
  }
  const aguardando = []
  const bloqueados = []
  const terminar = [] // conjunto que começou a sair hoje e caiu no meio
  const candidatos = []
  for (const [slug, r] of porSlug) {
    if (!r.rascunho.length || (soSlug && slug !== soSlug)) continue
    const pt = T.ptDoSlug(slug)
    if (T.ptRetirado(slug)) bloqueados.push({ slug, motivo: 'matéria PT retirada (content/i18n/_retirados.json): nunca volta sozinha' })
    else if (!T.ptNoAr(slug)) bloqueados.push({ slug, motivo: 'a matéria PT não está publicada' })
    else if (pt.palavras < MIN) bloqueados.push({ slug, motivo: `a matéria PT tem ${pt.palavras} palavras (freio: ${MIN}+)` })
    else {
      const faltam = IDIOMAS.filter((i) => !r.idiomas.has(i))
      if (faltam.length) aguardando.push({ slug, faltam })
      else (r.carimbo ? terminar : candidatos).push({ slug, r })
    }
  }
  candidatos.sort((x, y) => x.r.criadoEm.localeCompare(y.r.criadoEm) || x.slug.localeCompare(y.slug))
  const fila = [...terminar.map((c) => ({ ...c, carimbo: c.r.carimbo, tipo: 'terminar' })), ...candidatos.slice(0, cota).map((c) => ({ ...c, carimbo: agora.toISOString(), tipo: 'conjunto' }))]

  const log = lerPublicacoes()
  const publicados = []
  const erros = []
  for (const { slug, r, carimbo, tipo } of fila) {
    try {
      // slugIdioma que faltar é calculado ANTES de gravar qualquer arquivo do conjunto
      for (const d of r.rascunho) if (!d.slugIdioma) d.slugIdioma = T.slugIdiomaLivre(d.idioma, slugNoIdioma(d.titulo, d.idioma, slug), slug, docs)
      for (const d of r.rascunho) {
        if (!trincoMeu()) throw new Error(PERDIDO)
        Object.assign(d, { status: 'publicado', publicadoEm: carimbo })
        substituir(T.arquivoTraducao(d.idioma, slug), d)
      }
    } catch (e) {
      erros.push({ slug, motivo: `${e.message}; rode publicar de novo para terminar o conjunto (sai com o mesmo carimbo)` })
      if (e.message === PERDIDO) break
      continue
    }
    const todas = docs.filter((d) => d.slug === slug && d.status === 'publicado')
    const idiomas = ordem(todas.map((d) => d.idioma))
    const slugsIdioma = Object.fromEntries(todas.map((d) => [d.idioma, d.slugIdioma]))
    const urls = [`${BASE}/noticia/${slug}`, ...idiomas.map((i) => `${BASE}${caminhoArtigo(i, slugsIdioma[i])}`)]
    if (tipo === 'conjunto') log.publicacoes.push({ quando: carimbo, slug, idiomas, urls })
    // gravado a CADA conjunto: se a rodada cair no meio, a próxima conta na cota o que já saiu
    substituir(T.arquivoPublicacoes(), log)
    publicados.push({ slug, tipo, publicadoEm: carimbo, idiomas: ordem(r.rascunho.map((d) => d.idioma)), slugs: slugsIdioma, urls })
  }
  T.limparCache()
  const novos = publicados.filter((p) => p.tipo === 'conjunto').length
  const base = {
    dia,
    cotaDia: POR_DIA,
    jaSaiuHoje: saiuHoje.size,
    cotaRestante: Math.max(0, POR_DIA - saiuHoje.size - novos),
    publicados,
    conjuntosProntos: Math.max(0, candidatos.length - novos),
    aguardando,
    bloqueados,
    retiradosAgora,
    erros,
  }
  if (!cota && !terminar.length) {
    return { ok: false, aviso: `cota do dia esgotada: ${saiuHoje.size} conjunto já saiu hoje (${dia}, fuso de Brasília); o freio é ${POR_DIA} por dia`, ...base, proximoPasso: 'nada publicado; a cota volta amanhã' }
  }
  return {
    ok: !erros.length,
    ...base,
    proximoPasso: publicados.length
      ? 'node scripts/blog-idiomas.mjs conferir; depois commit + push de content/i18n na main (o deploy-cloudflare.yml publica); o IndexNow sai sozinho (scripts/indexnow.js) ou com "avisar --dias 1" depois do deploy'
      : 'nada pronto para publicar',
  }
}

/* ─────────────── retirar ─────────────── */

function retirar(slug, motivo) {
  if (!SLUG_PT_OK.test(String(slug || ''))) return { ok: false, erro: 'informe o slug da matéria PT (a-z, 0-9 e hífen)' }
  T.limparCache()
  if (T.ptRetirado(slug)) return { ok: true, slug, aviso: 'já estava retirada' }
  const traducoes = T.lerTraducoes().filter((d) => d.slug === slug)
  if (!T.ptDoSlug(slug) && !traducoes.length) return { ok: false, erro: `"${slug}" não existe em content/articles nem tem tradução` }
  if (!trincoMeu()) return { ok: false, erro: PERDIDO }
  const r = lerRetirados()
  r.retirados.push({ slug, em: agoraIso(), motivo: motivo || 'retirada à mão (node scripts/blog-idiomas.mjs retirar)' })
  substituir(T.arquivoRetirados(), r)
  T.limparCache()
  return {
    ok: true,
    slug,
    saemDoAr: traducoes.filter((d) => d.status === 'publicado').map((d) => caminhoArtigo(d.idioma, d.slugIdioma)),
    proximoPasso: 'commit + push de content/i18n/_retirados.json: no próximo deploy as traduções saem do ar (404), do sitemap e do hreflang. Voltar = apagar a linha à mão',
  }
}

/* ─────────────── conferir e estado ─────────────── */

function conferir() {
  T.limparCache()
  const problemas = []
  const avisos = []
  let docs = []
  try {
    docs = T.lerTraducoes()
    T.retirados()
    lerPublicacoes()
  } catch (e) {
    return { ok: false, total: 0, publicadas: 0, problemas: [e.message], avisos }
  }
  const usados = new Map()
  const publicadasPorSlug = new Map()
  for (const d of docs) {
    const id = `${d.idioma}:${d.slug}`
    const pt = T.ptDoSlug(d.slug)
    if (T.ptRetirado(d.slug)) avisos.push(`${id}: matéria retirada (fica fora do ar)`)
    else if (!pt) (d.status === 'publicado' ? problemas : avisos).push(`${id}: a matéria PT não existe (vira retirada na próxima gravação)`)
    else if (pt.palavras < MIN) (d.status === 'publicado' ? problemas : avisos).push(`${id}: a matéria PT tem ${pt.palavras} palavras (freio: ${MIN}+)${d.status === 'publicado' ? ': tradução publicada de PT curto, o site não a serve' : ''}`)
    if (!['rascunho', 'publicado'].includes(d.status)) problemas.push(`${id}: status "${d.status}" (rascunho ou publicado)`)
    for (const c of ['titulo', 'descricao', 'conteudo']) if (!texto(d[c])) problemas.push(`${id}: ${c} vazio`)
    if (d.categoria && pt && d.categoria !== pt.categoria) problemas.push(`${id}: categoria "${d.categoria}" diferente do PT ("${pt.categoria}")`)
    if (d.slugIdioma != null) {
      if (!SLUG_IDIOMA_OK.test(d.slugIdioma) || d.slugIdioma !== d.slugIdioma.normalize('NFC')) problemas.push(`${id}: slugIdioma inválido`)
      const k = `${d.idioma}:${d.slugIdioma}`
      if (usados.has(k)) problemas.push(`${id}: slugIdioma repetido com ${usados.get(k)}`)
      usados.set(k, id)
      if (d.slugIdioma !== d.slug && T.ptDoSlug(d.slugIdioma)) problemas.push(`${id}: slugIdioma "${d.slugIdioma}" é o slug de outra matéria PT (endereço antigo dela)`)
    }
    if (d.status === 'publicado') {
      if (!d.slugIdioma) problemas.push(`${id}: publicada sem slugIdioma (rode slugs)`)
      if (Number.isNaN(Date.parse(d.publicadoEm))) problemas.push(`${id}: publicada sem publicadoEm válido`)
      if (!T.ptRetirado(d.slug)) publicadasPorSlug.set(d.slug, (publicadasPorSlug.get(d.slug) || 0) + 1)
    }
    if (/<(script|iframe|style|object|embed)\b|\son\w+\s*=|javascript:/i.test(String(d.conteudo || ''))) problemas.push(`${id}: conteúdo com HTML perigoso`)
  }
  // freio de 1 conjunto por dia (dia de Brasília, carimbo mais antigo do conjunto): o site só serve o primeiro do dia
  const carimboDoConjunto = new Map()
  for (const d of docs) {
    const t = Date.parse(d.publicadoEm || '')
    if (d.status !== 'publicado' || !Number.isFinite(t) || T.ptRetirado(d.slug)) continue
    carimboDoConjunto.set(d.slug, Math.min(t, carimboDoConjunto.get(d.slug) ?? Infinity))
  }
  const conjuntosPorDia = new Map()
  for (const [slug, t] of carimboDoConjunto) {
    const dia = T.diaBrasilia(t)
    conjuntosPorDia.set(dia, [...(conjuntosPorDia.get(dia) || []), slug])
  }
  for (const [dia, slugs] of conjuntosPorDia) {
    if (slugs.length > POR_DIA) problemas.push(`${dia}: ${slugs.length} conjuntos publicados no mesmo dia (${slugs.sort().join(', ')}); o freio é ${POR_DIA} por dia e o site só serve o primeiro`)
  }
  for (const [slug, n] of publicadasPorSlug) if (n !== IDIOMAS.length) avisos.push(`${slug}: ${n} de ${IDIOMAS.length} idiomas no ar (conjunto incompleto: rode publicar)`)
  // arquivo solto que o site não lê (o build só importa <idioma>/<slugPt>.json)
  for (const idioma of IDIOMAS) {
    const dir = path.join(PASTA(), idioma)
    if (!fs.existsSync(dir)) continue
    for (const n of fs.readdirSync(dir)) if (!n.endsWith('.json')) avisos.push(`${idioma}/${n}: o site não lê este arquivo (use: node scripts/blog-idiomas.mjs ingerir <arquivo>)`)
  }
  return { ok: !problemas.length, total: docs.length, publicadas: [...publicadasPorSlug.values()].reduce((a, b) => a + b, 0), problemas, avisos }
}

function estado() {
  T.limparCache()
  const c = conferir()
  if (!c.ok && !c.total) {
    saida({ ok: false, pasta: PASTA(), problemas: c.problemas })
    return 1
  }
  const dia = T.diaBrasilia(new Date())
  const jaSaiu = T.conjuntosDoDia(dia).size
  const r = T.resumoConjuntos()
  const sumidos = [...new Set(T.lerTraducoes().map((d) => d.slug))].filter((s) => !T.ptDoSlug(s) && !T.ptRetirado(s))
  saida({
    ok: c.ok,
    pasta: PASTA(),
    ...r,
    cotaHoje: { dia, jaSaiu, restante: Math.max(0, POR_DIA - jaSaiu) },
    sumidos,
    problemas: c.problemas,
    avisos: c.avisos,
  })
  return c.ok ? 0 : 1
}

/* ─────────────── exportar (= GET ?completo=1) ─────────────── */

function exportar() {
  const status = opt('--status') || 'publicado'
  if (status !== 'publicado' && status !== 'rascunho') {
    console.error('exportar: --status publicado|rascunho')
    return 2
  }
  T.limparCache()
  let base
  if (status === 'rascunho') base = { ok: true, total: 0, artigos: [], aviso: 'matéria PT não fica em rascunho neste site: os robôs publicam direto (freio de 3 por dia)' }
  else {
    base = T.artigosPtCompletos({ todos: tem('--todos') || Boolean(opt('--slug')) })
    let artigos = base.artigos
    if (opt('--slug')) artigos = artigos.filter((a) => a.slug === opt('--slug'))
    if (opt('--limite')) artigos = artigos.slice(0, Math.max(1, Number(opt('--limite')) || 1))
    base = { ...base, total: artigos.length, artigos }
  }
  const arq = opt('--saida')
  if (arq) {
    fs.mkdirSync(path.dirname(path.resolve(arq)), { recursive: true })
    fs.writeFileSync(path.resolve(arq), serializar(base))
    console.log(`exportadas ${base.total} matéria(s) em ${path.resolve(arq)}${base.aviso ? ` (${base.aviso})` : ''}`)
  } else saida(base)
  return 0
}

/* ─────────────── avisar (IndexNow, DEPOIS do deploy) ─────────────── */

async function avisar() {
  T.limparCache()
  const dias = Number(opt('--dias') || 1)
  const soSlug = opt('--slug')
  const urls = []
  for (const idioma of IDIOMAS) {
    for (const d of T.traducoesPublicadas(idioma)) {
      if (soSlug ? d.slug !== soSlug : Date.now() - Date.parse(d.publicadoEm) > dias * 86400000) continue
      urls.push(`${BASE}${caminhoArtigo(idioma, d.slugIdioma)}`, `${BASE}/${idioma}/noticia`, `${BASE}/noticia/${d.slug}`)
    }
  }
  const lista = [...new Set(urls)]
  if (!lista.length) {
    console.log('IndexNow: nenhuma tradução publicada na janela pedida.')
    return 0
  }
  if (tem('--seco')) {
    console.log(`IndexNow (simulação): ${lista.length} URLs\n  ${lista.join('\n  ')}`)
    return 0
  }
  // só avisa o que já está no ar: antes do deploy a URL nova ainda é 404
  const prova = await fetch(lista[0], { redirect: 'manual', signal: AbortSignal.timeout(30000) }).then((r) => r.status).catch((e) => `erro ${e.message}`)
  if (prova !== 200) {
    console.log(`IndexNow: ${lista[0]} respondeu ${prova}; o deploy ainda não pôs no ar. Nada enviado.`)
    return 1
  }
  for (const destino of ['https://api.indexnow.org/indexnow', 'https://www.bing.com/indexnow', 'https://yandex.com/indexnow']) {
    const r = await fetch(destino, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: 'explosaosolar.com', key: CHAVE_INDEXNOW, keyLocation: `${BASE}/${CHAVE_INDEXNOW}.txt`, urlList: lista }),
      signal: AbortSignal.timeout(30000),
    }).then((x) => `HTTP ${x.status}`).catch((e) => `ERRO ${e.message}`)
    console.log(`IndexNow ${destino.split('/')[2]}: ${r} (${lista.length} URLs)`)
  }
  return 0
}

/* ─────────────── servir (o contrato inteiro na própria máquina, para a esteira) ─────────────── */

// Cada escrita pega o trinco: a esteira por HTTP e um `ingerir` no terminal ao mesmo tempo nunca se atropelam.
function comTrinco(nome, fn) {
  const motivo = pegarTrinco(nome)
  if (motivo) throw new Error(motivo)
  try {
    return fn()
  } finally {
    soltarTrinco()
  }
}

function servir() {
  const porta = Number(opt('--porta') || 7788)
  const segredo = String(process.env.PAINEL_SAUDE_TOKEN || '').trim()
  const escrita = {
    gravar: (lista) => comTrinco('servir:gravar', () => gravar(lista.map((item) => ({ item, origem: 'POST' })))),
    slugs: () => comTrinco('servir:slugs', () => slugs()),
    publicar: ({ limite, agora }) => comTrinco('servir:publicar', () => publicar({ limite, agora })),
  }
  const dados = async (tipo) => {
    T.limparCache()
    if (tipo === 'resumo') return T.resumoConjuntos()
    if (tipo === 'completo') return T.artigosPtCompletos()
    if (tipo === 'elegiveis') return T.artigosPtCompletos({ todos: true })
    throw new Error(`dados desconhecidos: ${tipo}`)
  }
  const servidor = http.createServer(async (req, res) => {
    const responder = (status, corpo) => {
      res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify(corpo))
    }
    try {
      const url = new URL(req.url, 'http://127.0.0.1')
      // Sem segredo a proteção é de rede: Host só 127.0.0.1/localhost (DNS rebinding), nada com Origin/Sec-Fetch-Site
      // (página aberta no navegador dela tentando POSTar aqui) e POST só em application/json. A esteira (Node) não manda Origin.
      if (!segredo) {
        const porta = servidor.address().port
        if (![`127.0.0.1:${porta}`, `localhost:${porta}`].includes(String(req.headers.host || ''))) return responder(403, { erro: 'host não permitido (só 127.0.0.1 ou localhost)' })
        if (req.headers.origin || req.headers['sec-fetch-site']) return responder(403, { erro: 'pedido de navegador recusado: só chamadas diretas desta máquina' })
        if (req.method === 'POST' && !/^application\/json\b/i.test(String(req.headers['content-type'] || ''))) return responder(415, { erro: 'POST só com Content-Type: application/json' })
      }
      if (url.pathname.replace(/\/+$/, '') !== '/api/admin/artigos') return responder(404, { erro: 'aqui só existe /api/admin/artigos' })
      const pedacos = []
      let tamanho = 0
      for await (const p of req) {
        tamanho += p.length
        if (tamanho > 8 * 1024 * 1024) return responder(413, { erro: 'remessa maior que 8 MB' })
        pedacos.push(p)
      }
      const request = new Request(url, {
        method: req.method,
        headers: { authorization: String(req.headers.authorization || ''), 'content-type': String(req.headers['content-type'] || 'application/json') },
        body: req.method === 'POST' ? Buffer.concat(pedacos) : undefined,
      })
      const resposta = await responderAdmin(request, { segredo, aberto: !segredo, dados, escrita })
      res.writeHead(resposta.status, Object.fromEntries(resposta.headers))
      res.end(Buffer.from(await resposta.arrayBuffer()))
    } catch (e) {
      responder(500, { erro: e.message })
    }
  })
  servidor.listen(porta, '127.0.0.1', () => {
    console.log(`contrato da esteira em http://127.0.0.1:${porta}/api/admin/artigos (traduções em ${PASTA()})`)
    console.log(segredo ? 'exige Authorization: Bearer <PAINEL_SAUDE_TOKEN>' : 'sem PAINEL_SAUDE_TOKEN no ambiente: aceita qualquer chamada desta máquina (só escuta em 127.0.0.1)')
    console.log(`esteira: node blog-traduzir.mjs explosao-solar --base http://127.0.0.1:${porta} --antigos 1`)
  })
  return null
}

/* ─────────────── linha de comando ─────────────── */

function ingerir() {
  if (!alvo || !fs.existsSync(alvo)) {
    console.error('ingerir: informe um arquivo .json/.md ou uma pasta que exista')
    return 2
  }
  const itens = coletarItens(path.resolve(alvo))
  if (!itens.length) {
    console.error('ingerir: nada para guardar')
    return 1
  }
  const r = gravar(itens)
  saida(r)
  return r.ok && !r.resultados.some((x) => x.motivo === PERDIDO) ? 0 : 1
}

const comandos = {
  estado,
  exportar,
  ingerir,
  slugs: () => {
    const r = slugs()
    saida(r)
    return r.ok ? 0 : 1
  },
  publicar: () => {
    const r = publicar({ limite: Number(opt('--limite') || POR_DIA), soSlug: opt('--slug') })
    saida(r)
    return r.ok ? 0 : 1
  },
  retirar: () => {
    const r = retirar(alvo, opt('--motivo'))
    saida(r)
    return r.ok ? 0 : 1
  },
  conferir: () => {
    const r = conferir()
    saida(r)
    return r.ok ? 0 : 1
  },
  servir,
  avisar,
}
if (!comandos[comando]) {
  console.log(`uso: node scripts/blog-idiomas.mjs estado | exportar | ingerir <arquivo|pasta> | slugs | publicar [--limite 1] | retirar <slugPt> | conferir | servir | avisar\n${COMO_INGERIR.join('\n')}`)
  process.exit(2)
}
const GRAVA = new Set(['ingerir', 'slugs', 'publicar', 'retirar'])
if (GRAVA.has(comando)) {
  const motivo = pegarTrinco(comando)
  if (motivo) {
    console.error(`${comando}: ${motivo}; nada feito (trinco em ${TRINCO()})`)
    process.exit(1)
  }
}
let codigo = 1
try {
  codigo = await comandos[comando]()
} catch (e) {
  console.error(`blog-idiomas ${comando}: ${e.message}`)
  codigo = 1
} finally {
  if (GRAVA.has(comando)) soltarTrinco()
}
if (codigo !== null) process.exit(codigo)
