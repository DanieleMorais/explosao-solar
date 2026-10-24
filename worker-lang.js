// Embrulho do worker gerado pelo OpenNext (mesmo padrão do Cristal Leads e do Fada Social). Três trabalhos, na borda:
//  1. <html lang> (e dir="rtl" no árabe) das páginas em outro idioma (/en, /es, /fr... e tudo depois do prefixo): o
//     layout raiz (app/layout.js) escreve sempre lang="pt-BR", e ler a rota lá deixaria TODAS as páginas dinâmicas.
//  2. GET /api/admin/artigos, o contrato da esteira de tradução (lib/adminArtigos.js), com o segredo PAINEL_SAUDE_TOKEN
//     que o worker já tem. Os dados vêm das rotas estáticas /api/admin/artigos/{resumo,completo,elegiveis}, geradas no
//     build (o Worker não enxerga content/). POST responde 409: aqui a ingestão é por arquivo (scripts/blog-idiomas.mjs).
//  3. 404 para quem chama essas rotas estáticas direto: só o passo 2 as lê, por dentro.
import app from './.open-next/worker.js'
import { responderAdmin } from './lib/adminArtigos.js'
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js'

// a barra depois do prefixo evita pegar /esportes, /entretenimento e parecidos
const IDIOMA_DA_ROTA = /^\/(en|es|fr|de|it|nl|ru|zh|ja|ko|ar)(\/|$)/
const ADMIN = '/api/admin/artigos'

// decodificada, sem barra dupla nem no fim, minúscula: /api/admin/artigos%2Fresumo e //api/... não escapam do bloqueio
function rotaNormalizada(pathname) {
  let p = pathname
  try {
    p = decodeURIComponent(pathname)
  } catch {}
  return p.replace(/\/{2,}/g, '/').replace(/\/+$/, '').toLowerCase() || '/'
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const rota = rotaNormalizada(url.pathname)
    if (rota.startsWith(`${ADMIN}/`)) return new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } })
    if (rota === ADMIN) {
      const dados = async (tipo) => {
        const r = await app.fetch(new Request(new URL(`${ADMIN}/${tipo}`, url.origin), { headers: { accept: 'application/json' } }), env, ctx)
        if (r.status !== 200) throw new Error(`dados ${tipo}: HTTP ${r.status}`)
        return r.json()
      }
      return responderAdmin(request, { segredo: env.PAINEL_SAUDE_TOKEN, dados, escrita: null })
    }

    const resposta = await app.fetch(request, env, ctx)
    const lang = url.pathname.match(IDIOMA_DA_ROTA)?.[1]
    // só página que existe: a 404/500 é a do português (app/not-found.js); JSON, RSC e imagem passam intactos
    if (!lang || resposta.status >= 400 || !(resposta.headers.get('content-type') || '').includes('text/html')) return resposta
    return new HTMLRewriter()
      .on('html', {
        element(el) {
          el.setAttribute('lang', lang)
          if (lang === 'ar') el.setAttribute('dir', 'rtl')
        },
      })
      .transform(resposta)
  },
}
