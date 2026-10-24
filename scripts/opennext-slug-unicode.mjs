// Conserto do 404 nas matérias com slug em russo, chinês, japonês, coreano e árabe (24/10/2026).
//
// Causa (provada num worker local com Next 16.3.4 + OpenNext 1.20.2 / @opennextjs/aws 4.1.0, o mesmo do site):
// a rota /[categoria]/noticia/[slug] tem dynamicParams = false. Para rota assim, o OpenNext confere se o endereço
// foi pré-gerado comparando o caminho CODIFICADO do pedido (/ru/noticia/%D0%BA...) com as chaves do
// prerender-manifest, que o Next grava em Unicode (/ru/noticia/кальдера...). Nunca bate, e o OpenNext troca o
// pedido por /404 antes de chegar ao cache. Slug só com a-z, 0-9 e hífen é igual nas duas formas, por isso as
// línguas latinas funcionam. O cache do próprio OpenNext já decodifica (cacheInterceptor usa decodePathParams);
// só o handleFallbackFalse esquece. Continua igual na versão mais nova (@opennextjs/aws 4.1.12).
//
// O que faz: depois de `opennextjs-cloudflare build` e antes do `deploy`, troca UMA linha em
// .open-next/middleware/handler.mjs para também procurar o caminho decodificado. Se o texto esperado não estiver
// lá exatamente 1 vez (OpenNext mudou), sai com erro e o deploy NÃO acontece: melhor parar do que publicar às cegas.
// Rodar de novo não faz nada (já consertado). Uso: node scripts/opennext-slug-unicode.mjs [caminho-do-handler]
import fs from 'node:fs'
import path from 'node:path'

const ORIGINAL = 'const isPregenerated = Object.keys(routes).includes(localizedPath);'
const CONSERTADO =
  'const isPregenerated = Object.keys(routes).includes(localizedPath) || (() => { try { return Object.keys(routes).includes(decodePathParams(localizedPath)); } catch { return false; } })();'

export function consertar(texto) {
  if (texto.includes(CONSERTADO)) return { texto, mudou: false }
  const vezes = texto.split(ORIGINAL).length - 1
  if (vezes !== 1) throw new Error(`esperava 1 ocorrência de "${ORIGINAL}", achei ${vezes}: o OpenNext mudou, revisar o conserto`)
  if (!/function decodePathParams\(/.test(texto)) throw new Error('decodePathParams não existe no handler: o OpenNext mudou, revisar o conserto')
  return { texto: texto.replace(ORIGINAL, CONSERTADO), mudou: true }
}

const executadoDireto = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
if (executadoDireto) {
  const arq = process.argv[2] || path.join(process.cwd(), '.open-next', 'middleware', 'handler.mjs')
  try {
    const { texto, mudou } = consertar(fs.readFileSync(arq, 'utf8'))
    if (mudou) fs.writeFileSync(arq, texto)
    console.log(mudou ? `consertado: ${arq}` : `já estava consertado: ${arq}`)
  } catch (e) {
    console.error(`ERRO opennext-slug-unicode: ${e.message}`)
    process.exit(1)
  }
}
