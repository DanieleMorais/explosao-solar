// Teste do conserto (node scripts/opennext-slug-unicode.teste.mjs [handler.mjs real, opcional]).
// Caso feliz, rodar 2 vezes, OpenNext mudado (0 e 2 ocorrências, sem decodePathParams) e a lógica nova com os
// slugs do 1º conjunto (kikai). Com um handler real, confere também que o conserto encaixa nele.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { consertar } from './opennext-slug-unicode.mjs'

const LINHA = 'const isPregenerated = Object.keys(routes).includes(localizedPath);'
const base = `function decodePathParams(pathname) {\n  return pathname.split("/").map((s) => decodeURIComponent(s)).join("/");\n}\nfunction handleFallbackFalse(internalEvent, prerenderManifest) {\n  ${LINHA}\n  return isPregenerated;\n}\n`
let ok = 0
const caso = (nome, fn) => {
  fn()
  ok++
  console.log('ok  ', nome)
}

caso('troca a linha uma vez', () => {
  const { texto, mudou } = consertar(base)
  assert.equal(mudou, true)
  assert.ok(!texto.includes(LINHA))
  assert.ok(texto.includes('includes(decodePathParams(localizedPath))'))
})
caso('rodar de novo não muda nada', () => {
  const uma = consertar(base).texto
  const duas = consertar(uma)
  assert.equal(duas.mudou, false)
  assert.equal(duas.texto, uma)
})
caso('OpenNext sem a linha: erro', () => assert.throws(() => consertar(base.replace(LINHA, 'const x = 1;')), /achei 0/))
caso('linha repetida: erro', () => assert.throws(() => consertar(base + LINHA), /achei 2/))
caso('sem decodePathParams: erro', () => assert.throws(() => consertar(base.replace('function decodePathParams(', 'function outra(')), /decodePathParams/))

caso('lógica nova: Unicode codificado acha a rota; inexistente e latina como antes', () => {
  const { texto } = consertar(base)
  const handleFallbackFalse = new Function(`${texto}; return handleFallbackFalse;`)()
  const routes = {
    '/ru/noticia/кальдера-кикай-снова-накапливает-магму-спустя-тысячи-лет': {},
    '/ja/noticia/鬼界カルデラ-数千年後にマグマ再蓄積': {},
    '/en/noticia/kikai-caldera-accumulates-magma-again-after-ancient-eruption': {},
  }
  // a função de verdade lê rawPath do evento; aqui o teste só exercita a linha trocada
  const confere = (caminho) => new Function('routes', 'localizedPath', 'decodePathParams', `${texto.match(/const isPregenerated = .*;/)[0]} return isPregenerated;`)(routes, caminho, (p) => p.split('/').map((s) => decodeURIComponent(s)).join('/'))
  assert.equal(typeof handleFallbackFalse, 'function')
  assert.equal(confere('/ru/noticia/' + encodeURIComponent('кальдера-кикай-снова-накапливает-магму-спустя-тысячи-лет')), true)
  assert.equal(confere('/ja/noticia/' + encodeURIComponent('鬼界カルデラ-数千年後にマグマ再蓄積')), true)
  assert.equal(confere('/en/noticia/kikai-caldera-accumulates-magma-again-after-ancient-eruption'), true)
  assert.equal(confere('/ru/noticia/' + encodeURIComponent('не-существует')), false)
  assert.equal(confere('/ru/noticia/%E0%A4%A'), false) // código % quebrado não derruba: vira 404 como antes
})

const real = process.argv[2]
if (real) {
  caso(`encaixa no handler real (${real})`, () => {
    const t = fs.readFileSync(real, 'utf8')
    const r = consertar(t)
    assert.ok(r.mudou || r.texto.includes('includes(decodePathParams(localizedPath))'))
  })
}
console.log(`${ok} ok`)
