// API de admin do blog em 12 idiomas: CONTRATO ÚNICO da esteira de tradução (15/10/2026), versão do Explosão Solar.
// Uma implementação só, usada em dois lugares:
//   - no ar (worker-lang.js): só LEITURA. Os dados vêm de rotas estáticas geradas no build (/api/admin/artigos/resumo,
//     /completo e /elegiveis), porque o Worker não enxerga content/ em tempo de execução. O POST responde 409 dizendo
//     como a ingestão é feita aqui: POR ARQUIVO (as matérias moram no repositório e vão ao ar com commit + push).
//   - na máquina da Dani (node scripts/blog-idiomas.mjs servir): leitura E escrita nos arquivos de content/i18n.
//
//   GET  ?status=publicado|rascunho&completo=1[&slug=x][&limite=n][&todos=1]   matérias PT com o texto (HTML)
//   GET                                                                         resumo: fila, no ar, traduções, conjuntos, freio
//   POST { artigos: [{ idioma, slug, titulo, descricao, conteudo, palavrasChave, categoria?, tempoLeitura?, slugIdioma? }] }
//   POST ?acao=slugs                     preenche slugIdioma que faltar
//   POST ?acao=publicar&limite=1         publica 1 conjunto (as 11 traduções de uma matéria PT já no ar)
// Autenticação: Authorization: Bearer <PAINEL_SAUDE_TOKEN>, o segredo que o worker já tem (nada novo foi criado).
// Módulo puro (sem fs, sem Next): roda no Worker e no Node.
import { FREIO_TRADUCAO } from './idiomas.js'

const MAX_ITENS = 50
const CABECALHOS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' }
const json = (corpo, status = 200) => new Response(JSON.stringify(corpo), { status, headers: CABECALHOS })
const diaBrasilia = (d) => new Date(d).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })

// comparação em tempo constante (o tamanho do segredo não vaza pelo tempo de resposta)
function iguais(a, b) {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}

export const COMO_INGERIR = [
  'na pasta do projeto: node scripts/blog-idiomas.mjs ingerir <pasta da esteira>  (ou: node scripts/blog-idiomas.mjs servir e a esteira usa --base http://127.0.0.1:7788)',
  'node scripts/blog-idiomas.mjs publicar  (1 conjunto por dia: freio do Explosão Solar)',
  'node scripts/blog-idiomas.mjs conferir, depois commit + push de content/i18n na main: o deploy do GitHub (deploy-cloudflare.yml) põe no ar',
]

// `dados(tipo)` devolve o objeto de 'resumo' | 'completo' | 'elegiveis'; `escrita` = { gravar, slugs, publicar } ou null.
export async function responderAdmin(request, { segredo, aberto = false, dados, escrita = null, agora = () => new Date() }) {
  if (!aberto) {
    // trim() também tira um BOM colado no começo do valor
    const s = String(segredo || '').trim()
    const auth = request.headers.get('authorization') || ''
    if (!s || !iguais(auth, `Bearer ${s}`)) return json({ erro: 'Não autorizado' }, 401)
  }
  const sp = new URL(request.url).searchParams
  try {
    if (request.method === 'GET') return await ler(sp, dados, agora)
    if (request.method === 'POST') return await escrever(request, sp, escrita, agora)
    return json({ erro: 'método não aceito (use GET ou POST)' }, 405)
  } catch (e) {
    // nunca 404 nem lista vazia: a esteira tem de saber que falhou e tentar de novo
    return json({ erro: `Armazenamento indisponível (${String(e?.message || e).slice(0, 200)}). Tente de novo.` }, 500)
  }
}

async function ler(sp, dados, agora) {
  const status = sp.get('status')
  if (status && status !== 'publicado' && status !== 'rascunho') return json({ erro: 'status deve ser publicado ou rascunho' }, 400)
  const slug = sp.get('slug')
  if (sp.get('completo') === '1' || slug) {
    if (status === 'rascunho') {
      return json({ ok: true, total: 0, artigos: [], aviso: 'matéria PT não fica em rascunho neste site: os robôs publicam direto (freio de 3 por dia)' })
    }
    let limite = null
    if (sp.get('limite') != null) {
      limite = Number(sp.get('limite'))
      if (!Number.isInteger(limite) || limite < 1 || limite > 400) return json({ erro: 'limite deve ser um inteiro entre 1 e 400' }, 400)
    }
    const todos = sp.get('todos') === '1'
    const base = await dados(slug || todos ? 'elegiveis' : 'completo')
    if (!Array.isArray(base?.artigos)) throw new Error('dados das matérias sem a lista')
    let artigos = base.artigos
    if (slug) artigos = artigos.filter((a) => a.slug === slug)
    if (limite) artigos = artigos.slice(0, limite)
    const aviso = slug && !artigos.length
      ? `"${slug}" não existe ou tem menos de ${FREIO_TRADUCAO.minPalavras} palavras (o freio não deixa traduzir)`
      : !slug && !todos ? base.aviso : undefined
    return json({ ok: true, total: artigos.length, artigos, geradoEm: base.geradoEm || null, ...(aviso ? { aviso } : {}) })
  }
  const r = await dados('resumo')
  if (!Array.isArray(r?.conjuntos)) throw new Error('resumo sem os conjuntos')
  const hoje = diaBrasilia(agora())
  const jaSaiuHoje = r.conjuntos.filter((c) => c.publicadoEm && diaBrasilia(c.publicadoEm) === hoje).length
  const proximos = r.conjuntos
    .filter((c) => c.rascunho.length > 0 && !c.retirado)
    .slice(0, 5)
    .map((c) => ({ slug: c.slug, titulo: c.titulo, faltam: c.faltam, pronto: c.faltam.length === 0 && c.ptExiste && c.palavras >= FREIO_TRADUCAO.minPalavras }))
  return json({
    ok: true,
    ...r,
    freio: { ...r.freio, dia: hoje, jaSaiuHoje, cotaRestante: Math.max(0, FREIO_TRADUCAO.porDia - jaSaiuHoje) },
    proximos,
  })
}

async function escrever(request, sp, escrita, agora) {
  if (!escrita) {
    return json({ erro: 'Este site recebe tradução POR ARQUIVO: o Worker não grava (as matérias moram no repositório).', comoFazer: COMO_INGERIR }, 409)
  }
  const acao = sp.get('acao')
  if (acao === 'slugs') return json({ ok: true, ...(await escrita.slugs()) })
  if (acao === 'publicar') {
    const limite = sp.get('limite') == null ? FREIO_TRADUCAO.porDia : Number(sp.get('limite'))
    if (!Number.isInteger(limite) || limite < 1 || limite > FREIO_TRADUCAO.porDia) {
      return json({ erro: `limite deve ser um inteiro entre 1 e ${FREIO_TRADUCAO.porDia} (freio do Explosão Solar)` }, 400)
    }
    const r = await escrita.publicar({ limite, agora: agora() })
    // cota do dia esgotada é resposta normal (ok: false + aviso); 500 só quando um conjunto falhou ao gravar
    return json(r, r.erros?.length ? 500 : 200)
  }
  if (acao) return json({ erro: `ação desconhecida: ${acao} (use slugs ou publicar)` }, 400)

  let corpo
  try {
    corpo = await request.json()
  } catch {
    return json({ erro: 'JSON inválido' }, 400)
  }
  const lista = Array.isArray(corpo) ? corpo : Array.isArray(corpo?.artigos) ? corpo.artigos : []
  if (!lista.length) return json({ erro: 'Nada para guardar: envie { artigos: [...] }' }, 400)
  if (lista.length > MAX_ITENS) return json({ erro: `No máximo ${MAX_ITENS} itens por remessa` }, 400)
  return json(await escrita.gravar(lista, { agora: agora() }))
}
