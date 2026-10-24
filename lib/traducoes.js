// Traduções das matérias (Blog em 12 idiomas, regra da Dani de 15/10/2026), POR ARQUIVO no repositório:
//   content/i18n/<idioma>/<slugPt>.json = { idioma, slug (o PT), slugIdioma, titulo, descricao, conteudo (HTML), formato: 'html',
//   palavrasChave: [], categoria (o categorySlug do PT), tempoLeitura, status: 'rascunho'|'publicado', criadoEm, publicadoEm }
//   content/i18n/_retirados.json = { retirados: [{ slug, em, motivo }] }: matéria PT RETIRADA (marcador positivo). As traduções
//   dela saem do ar e nunca voltam sozinhas, nem se o arquivo PT reaparecer; voltar = tirar a linha à mão e fazer o deploy.
//   content/i18n/_publicacoes.json = registro de cada conjunto publicado (a cota do dia conta por ele também).
// A matéria PT não muda de lugar nem de formato (content/articles/<slug>.json).
// Quem GRAVA é só o scripts/blog-idiomas.mjs (rodado na máquina da Dani; vai ao ar com commit + push + deploy).
// Este módulo só LÊ: roda no build do Next (o Worker não enxerga content/ em tempo de execução) e nos scripts.
// Leitura ESTRITA: um JSON quebrado derruba o build em vez de virar página faltando (404 guardado em cache).
// Imports relativos com extensão: o Node (scripts) importa este arquivo direto, sem o alias @/ do Next.
import fs from 'node:fs'
import path from 'node:path'
import { IDIOMAS_TRADUCAO, FREIO_TRADUCAO } from './idiomas.js'
import { SLUG_IDIOMA_OK, caminhoArtigo } from './blogSlug.js'

// o freio mora em lib/idiomas.js (o worker também lê)
export const POR_DIA = FREIO_TRADUCAO.porDia
export const MIN_PALAVRAS_TRADUCAO = FREIO_TRADUCAO.minPalavras
export const FILA_MAX = FREIO_TRADUCAO.filaMax
export const SLUG_PT_OK = /^[a-z0-9-]{1,200}$/

// ES_RAIZ = outra raiz de projeto (as matérias PT); ES_I18N = outra pasta de traduções. Os dois só para teste.
const raiz = () => process.env.ES_RAIZ || process.cwd()
export const dirI18n = () => process.env.ES_I18N || path.join(raiz(), 'content', 'i18n')
const dirPt = () => path.join(raiz(), 'content', 'articles')
export const arquivoTraducao = (idioma, slug) => path.join(dirI18n(), idioma, `${slug}.json`)
export const arquivoRetirados = () => path.join(dirI18n(), '_retirados.json')
export const arquivoPublicacoes = () => path.join(dirI18n(), '_publicacoes.json')

// mesma contagem do freio (scripts/regras-editoriais.js) e do lib/content.js
export const contaPalavras = (html) => String(html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
export const diaBrasilia = (d) => new Date(d).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })

let cacheTrad = null
let cachePt = new Map()
let cachePtTodos = null
let cacheRetirados = null
let cacheLiberados = null
export function limparCache() {
  cacheLiberados = null
  cacheTrad = null
  cachePt = new Map()
  cachePtTodos = null
  cacheRetirados = null
}

function lerJson(arq) {
  const texto = fs.readFileSync(arq, 'utf8').replace(/^﻿/, '')
  try {
    return JSON.parse(texto)
  } catch (e) {
    throw new Error(`JSON inválido em ${path.relative(raiz(), arq)}: ${e.message}`)
  }
}

// Matéria PT (formato do repositório) no vocabulário do contrato. O conteúdo vai junto (as páginas não usam).
function resumoPt(a) {
  return {
    slug: a.slug,
    titulo: a.title,
    subtitulo: a.subtitle || '',
    descricao: a.excerpt || '',
    palavrasChave: Array.isArray(a.tags) ? a.tags : [],
    categoria: a.categorySlug,
    tempoLeitura: Number(a.readingMinutes) || Math.max(1, Math.round(contaPalavras(a.contentHtml) / 220)),
    palavras: contaPalavras(a.contentHtml),
    publicadoEm: a.publishedAt || null,
    atualizadoEm: a.updatedAt || null,
    autor: a.author || 'Explosão Solar',
    imagem: a.imagem || null,
    imagemCredito: a.imagemCredito || null,
    imagemCreditoUrl: a.imagemCreditoUrl || null,
    fonteNome: a.sourceName || null,
    fonteUrl: a.sourceUrl || null,
    conteudo: a.contentHtml || '',
  }
}

export function ptDoSlug(slug) {
  if (!SLUG_PT_OK.test(String(slug || ''))) return null
  if (cachePt.has(slug)) return cachePt.get(slug)
  const arq = path.join(dirPt(), `${slug}.json`)
  const a = fs.existsSync(arq) ? resumoPt(lerJson(arq)) : null
  cachePt.set(slug, a)
  return a
}

// Matérias PT retiradas (marcador POSITIVO em content/i18n/_retirados.json): fora do ar e fora da esteira para sempre.
export function retirados() {
  if (cacheRetirados) return cacheRetirados
  const arq = arquivoRetirados()
  const lista = fs.existsSync(arq) ? lerJson(arq)?.retirados : []
  if (!Array.isArray(lista)) throw new Error('content/i18n/_retirados.json: falta a lista "retirados"')
  cacheRetirados = new Set(lista.map((r) => String(r?.slug || '')).filter(Boolean))
  return cacheRetirados
}
export const ptRetirado = (slug) => retirados().has(slug)

// Matéria PT no ar: o arquivo existe, a data de publicação já passou e ela não foi retirada.
export function ptNoAr(slug) {
  const pt = ptDoSlug(slug)
  if (!pt || ptRetirado(slug)) return false
  const quando = Date.parse(pt.publicadoEm || '')
  return Number.isFinite(quando) && quando <= Date.now()
}

// Todas as matérias PT, da mais nova para a mais antiga (só a API de admin e os scripts precisam disso).
export function todosPt() {
  if (cachePtTodos) return cachePtTodos
  const dir = dirPt()
  const lista = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => resumoPt(lerJson(path.join(dir, f))))
    : []
  lista.sort((a, b) => String(b.publicadoEm || '').localeCompare(String(a.publicadoEm || '')) || a.slug.localeCompare(b.slug))
  for (const a of lista) cachePt.set(a.slug, a)
  cachePtTodos = lista
  return lista
}

// Todas as traduções (os 11 idiomas, rascunho e publicadas). Pasta de outro nome dentro de content/i18n é ignorada.
export function lerTraducoes() {
  if (cacheTrad) return cacheTrad
  const base = dirI18n()
  const docs = []
  if (fs.existsSync(base)) {
    for (const idioma of IDIOMAS_TRADUCAO) {
      const dir = path.join(base, idioma)
      if (!fs.existsSync(dir)) continue
      for (const f of fs.readdirSync(dir).sort()) {
        if (!f.endsWith('.json')) continue
        const doc = lerJson(path.join(dir, f))
        if (doc?.idioma !== idioma || doc?.slug !== f.slice(0, -5)) {
          throw new Error(`content/i18n/${idioma}/${f}: o idioma e o slug de dentro do arquivo não batem com a pasta e o nome`)
        }
        docs.push(doc)
      }
    }
  }
  cacheTrad = docs
  return docs
}

const estaPublicada = (d) => d.status === 'publicado' && d.slugIdioma && d.titulo && d.conteudo
const ordemIdiomas = (lista) => IDIOMAS_TRADUCAO.filter((i) => lista.includes(i))
const maisNova = (a, b) => String(b.publicadoEm || '').localeCompare(String(a.publicadoEm || '')) || a.slug.localeCompare(b.slug)

// FREIO no código do site (não só no script): PT no ar E com 600+ palavras (mesma conta do freio de scripts/freio.js).
export const ptElegivel = (slug) => ptNoAr(slug) && (ptDoSlug(slug)?.palavras ?? 0) >= MIN_PALAVRAS_TRADUCAO

// Regra do 1 por dia: cada matéria PT tem UM carimbo (o mais antigo entre as traduções publicadas dela); no mesmo dia de
// Brasília só o conjunto de carimbo mais antigo vale (empate: ordem do slug). Os outros ficam fora do ar, mesmo com
// status "publicado" no arquivo. Escolhi o MAIS ANTIGO porque é o que o `publicar` soltou primeiro e já pode estar
// indexado; o excedente (edição à mão, stash antigo) é que sai. Sem carimbo válido não dá para provar o dia: fora.
export function conjuntosLiberados() {
  if (cacheLiberados) return cacheLiberados
  const carimbo = new Map()
  for (const d of lerTraducoes()) {
    if (!estaPublicada(d)) continue
    const t = Date.parse(d.publicadoEm || '')
    const antes = carimbo.get(d.slug)
    carimbo.set(d.slug, Number.isFinite(t) ? Math.min(t, antes ?? Infinity) : (antes ?? null))
  }
  const porDia = new Map()
  for (const [slug, t] of carimbo) {
    if (t == null || !ptElegivel(slug)) continue
    const dia = diaBrasilia(t)
    const atual = porDia.get(dia)
    if (!atual || t < atual.t || (t === atual.t && slug < atual.slug)) porDia.set(dia, { slug, t })
  }
  cacheLiberados = new Set([...porDia.values()].map((v) => v.slug))
  return cacheLiberados
}

// No ar = publicada E com o original PT no ar, elegível (600+) e dentro de 1 conjunto por dia (PT apagado ou retirado: a
// tradução sai junto, nada de hreflang para um 404).
export function traducoesPublicadas(idioma) {
  const liberados = conjuntosLiberados()
  return lerTraducoes()
    .filter((d) => d.idioma === idioma && estaPublicada(d) && liberados.has(d.slug))
    .sort(maisNova)
}

export function idiomasComPublicada() {
  return IDIOMAS_TRADUCAO.filter((i) => traducoesPublicadas(i).length > 0)
}

// { idioma: slugIdioma } das traduções NO AR da matéria, na ordem fixa dos idiomas (hreflang e "também em").
export function versoesPublicadas(slugPt) {
  if (!conjuntosLiberados().has(slugPt)) return {}
  const v = {}
  for (const d of lerTraducoes()) if (d.slug === slugPt && estaPublicada(d)) v[d.idioma] = d.slugIdioma
  return Object.fromEntries(IDIOMAS_TRADUCAO.filter((i) => v[i]).map((i) => [i, v[i]]))
}

// O que /<idioma>/noticia/<param> serve: a tradução (pelo slug no idioma), o redirecionamento permanente do endereço
// antigo (/<idioma>/noticia/<slug-pt> → slug no idioma) ou nada (a rota decide: 404, ou a tradução antiga no en/es).
export function resolverRota(idioma, param) {
  const slug = String(param || '').normalize('NFC')
  if (!IDIOMAS_TRADUCAO.includes(idioma) || !SLUG_IDIOMA_OK.test(slug)) return null
  const lista = traducoesPublicadas(idioma)
  const doc = lista.find((d) => d.slugIdioma === slug)
  if (doc) return { tipo: 'traducao', doc, pt: ptDoSlug(doc.slug), versoes: versoesPublicadas(doc.slug) }
  const antigo = lista.find((d) => d.slug === slug)
  if (antigo) return { tipo: 'redirecionar', para: caminhoArtigo(idioma, antigo.slugIdioma) }
  return null
}

// Parâmetros que a rota do idioma pré-gera no build: o slug no idioma de cada publicada e o endereço antigo (slug PT).
export function paramsDoIdioma(idioma) {
  const vistos = new Set()
  for (const d of traducoesPublicadas(idioma)) {
    vistos.add(d.slugIdioma)
    if (d.slug !== d.slugIdioma) vistos.add(d.slug)
  }
  return [...vistos]
}

// "Leia também" no mesmo idioma: mesma editoria primeiro, depois as mais novas.
export function relacionadas(doc, n = 3) {
  const outras = traducoesPublicadas(doc.idioma).filter((d) => d.slug !== doc.slug)
  return [...outras.filter((d) => d.categoria === doc.categoria), ...outras.filter((d) => d.categoria !== doc.categoria)].slice(0, n)
}

// Endereços no ar para o sitemap: a lista de cada idioma que tem publicada + cada tradução publicada.
export function entradasSitemap() {
  const itens = []
  for (const idioma of IDIOMAS_TRADUCAO) {
    const lista = traducoesPublicadas(idioma)
    if (!lista.length) continue
    itens.push({ caminho: `/${idioma}/noticia`, quando: lista[0].publicadoEm })
    for (const d of lista) itens.push({ caminho: caminhoArtigo(idioma, d.slugIdioma), quando: d.publicadoEm })
  }
  return itens
}

// slugIdioma é único por idioma e nunca cai no endereço antigo de OUTRA matéria: /<idioma>/noticia/<slug PT> redireciona
// para a tradução daquela matéria (e no en/es ainda é a tradução antiga, em noindex).
export function slugIdiomaLivre(idioma, desejado, slugPtProprio, docs = lerTraducoes()) {
  const usados = new Set(docs.filter((d) => d.idioma === idioma && d.slug !== slugPtProprio && d.slugIdioma).map((d) => d.slugIdioma))
  const antigaEnEs = (s) => ['en', 'es'].includes(idioma) && SLUG_PT_OK.test(s) && fs.existsSync(path.join(raiz(), 'content', idioma, 'articles', `${s}.json`))
  const ocupado = (s) => usados.has(s) || (s !== slugPtProprio && (ptDoSlug(s) !== null || antigaEnEs(s)))
  for (let n = 1; n <= 50; n++) {
    const candidato = n === 1 ? desejado : `${desejado}-${n}`
    if (!ocupado(candidato)) return candidato
  }
  throw new Error(`não achei slugIdioma livre para "${desejado}" em ${idioma}`)
}

// Conjuntos que JÁ saíram no dia (fuso de Brasília): pelo carimbo das traduções E pelo registro _publicacoes.json, para a
// cota não voltar se um arquivo for apagado ou mexido à mão.
export function conjuntosDoDia(dia, docs = lerTraducoes()) {
  const slugs = new Set(docs.filter((d) => d.status === 'publicado' && d.publicadoEm && diaBrasilia(d.publicadoEm) === dia).map((d) => d.slug))
  const arq = arquivoPublicacoes()
  if (fs.existsSync(arq)) {
    const log = lerJson(arq)
    for (const p of Array.isArray(log?.publicacoes) ? log.publicacoes : []) if (p?.quando && diaBrasilia(p.quando) === dia) slugs.add(p.slug)
  }
  return slugs
}

// Fila = matérias com tradução esperando em rascunho (retirada não conta: ela nunca sai).
function idiomasPorSlug() {
  const m = new Map()
  for (const d of lerTraducoes()) {
    if (!m.has(d.slug)) m.set(d.slug, { todos: new Set(), rascunho: 0 })
    const r = m.get(d.slug)
    r.todos.add(d.idioma)
    if (d.status !== 'publicado') r.rascunho++
  }
  return m
}
const filaDe = (porSlug) => [...porSlug.entries()].filter(([slug, r]) => r.rascunho > 0 && !ptRetirado(slug)).length

// Visão da esteira sem texto: por matéria PT, que idiomas estão em rascunho e quais no ar. Só lista as matérias que já
// têm alguma tradução (o acervo PT tem 2.500+; as sem tradução estão em `elegiveis`/GET completo=1).
export function resumoConjuntos() {
  const porSlug = new Map()
  const publicadasPorIdioma = Object.fromEntries(IDIOMAS_TRADUCAO.map((i) => [i, 0]))
  let naFila = 0
  let noAr = 0
  for (const d of lerTraducoes()) {
    const r = porSlug.get(d.slug) || { rascunho: [], publicada: [], criadoEm: '', publicadoEm: '' }
    if (d.status === 'publicado') {
      // o que está "no ar" de verdade: tradução de matéria retirada ou apagada não conta
      if (conjuntosLiberados().has(d.slug) && estaPublicada(d)) {
        noAr++
        publicadasPorIdioma[d.idioma]++
      }
      r.publicada.push(d.idioma)
      if (String(d.publicadoEm || '') > r.publicadoEm) r.publicadoEm = String(d.publicadoEm || '')
    } else {
      naFila++
      r.rascunho.push(d.idioma)
      if (!r.criadoEm || String(d.criadoEm || '') < r.criadoEm) r.criadoEm = String(d.criadoEm || '')
    }
    porSlug.set(d.slug, r)
  }
  const conjuntos = [...porSlug.entries()]
    .map(([slug, r]) => {
      const pt = ptDoSlug(slug)
      return {
        slug,
        titulo: pt?.titulo || null,
        ptExiste: Boolean(pt),
        retirado: ptRetirado(slug),
        palavras: pt?.palavras || 0,
        rascunho: ordemIdiomas(r.rascunho),
        publicada: ordemIdiomas(r.publicada),
        faltam: IDIOMAS_TRADUCAO.filter((i) => !r.rascunho.includes(i) && !r.publicada.includes(i)),
        criadoEm: r.criadoEm || null,
        publicadoEm: r.publicadoEm || null,
      }
    })
    .sort((a, b) => String(a.criadoEm || a.publicadoEm || '').localeCompare(String(b.criadoEm || b.publicadoEm || '')) || a.slug.localeCompare(b.slug))
  const pts = todosPt()
  return {
    // matéria PT não tem rascunho neste site: os robôs publicam direto, no máximo 3 por dia (scripts/freio.js)
    naFila: 0,
    noAr: pts.filter((a) => ptNoAr(a.slug)).length,
    retirados: retirados().size,
    elegiveis: pts.filter((a) => a.palavras >= MIN_PALAVRAS_TRADUCAO && ptNoAr(a.slug)).length,
    traducoes: { naFila, noAr, publicadasPorIdioma },
    conjuntos,
    freio: {
      conjuntosPorDia: POR_DIA,
      minPalavras: MIN_PALAVRAS_TRADUCAO,
      filaMax: FILA_MAX,
      filaAtual: conjuntos.filter((c) => c.rascunho.length > 0 && !c.retirado).length,
    },
    geradoEm: new Date().toISOString(),
  }
}

// Matérias PT com o texto, no formato do CONTRATO, só as que o freio deixa traduzir (no ar, 600+ palavras, não retiradas),
// da mais nova para a mais antiga. `todos` = todas as elegíveis. Sem `todos` = o que a esteira deve pegar AGORA: as que
// já estão na fila sem as 11 e, das que ainda não começaram, só quantas cabem nas vagas da fila. Assim a esteira nunca
// traduz (e gasta) mais do que o freio vai publicar: nada de backfill em massa.
export function artigosPtCompletos({ todos = false } = {}) {
  const porSlug = idiomasPorSlug()
  const filaAtual = filaDe(porSlug)
  const vagas = Math.max(0, FILA_MAX - filaAtual)
  let novas = 0
  const artigos = todosPt()
    .filter((a) => a.palavras >= MIN_PALAVRAS_TRADUCAO && ptNoAr(a.slug))
    .filter((a) => {
      if (todos) return true
      const r = porSlug.get(a.slug)
      if ((r?.todos.size || 0) >= IDIOMAS_TRADUCAO.length) return false
      if (r && r.rascunho > 0) return true
      // ainda não começou (ou ficou incompleto sem nada em rascunho): ocupa uma vaga da fila
      return novas++ < vagas
    })
    .map((a) => ({
      slug: a.slug,
      titulo: a.titulo,
      subtitulo: a.subtitulo,
      descricao: a.descricao,
      conteudo: a.conteudo,
      formato: 'html',
      palavrasChave: a.palavrasChave,
      categoria: a.categoria,
      tempoLeitura: a.tempoLeitura,
      palavras: a.palavras,
      status: 'publicado',
      publicadoEm: a.publicadoEm,
      traducoes: ordemIdiomas([...(porSlug.get(a.slug)?.todos || [])]),
    }))
  const filaCheia = vagas === 0
  const aviso = filaCheia && !todos ? `fila cheia (${filaAtual} de ${FILA_MAX} conjuntos esperando em rascunho): só aparece matéria que já está na fila` : undefined
  return { ok: true, total: artigos.length, artigos, geradoEm: new Date().toISOString(), filaAtual, filaMax: FILA_MAX, vagas, filaCheia, ...(aviso ? { aviso } : {}) }
}
