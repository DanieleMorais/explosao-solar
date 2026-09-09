// Portão de gravação do passe de revisão editorial das combinações de signos.
// Uso: node scripts/salvar-combinacao-polida.js <par> <arquivo-temporario.json>
// Lê o JSON revisado, aplica a correção automática e o MESMO validador do gerador
// nos 3 idiomas; só grava (atômico) se tudo passar. Sai com código 1 e lista os
// erros quando não passa — o editor corrige e tenta de novo.
const fs = require('fs')
const path = require('path')
const { validar, normalizar, corrigirAutomatico } = require('./gerar-combinacoes.js')
const { parDoSlug } = require('../lib/combinacoes.js')

const [par, temp] = process.argv.slice(2)
if (!par || !temp) {
  console.error('uso: node scripts/salvar-combinacao-polida.js <par> <arquivo-temporario.json>')
  process.exit(2)
}
const ab = parDoSlug(par)
if (!ab) {
  console.error(`par inválido ou fora da ordem canônica: ${par}`)
  process.exit(2)
}

const destino = path.join(__dirname, '..', 'content', 'combinacoes', `${par}.json`)
const atual = JSON.parse(fs.readFileSync(destino, 'utf8'))
const novo = JSON.parse(fs.readFileSync(temp, 'utf8'))

const CAMPOS = ['titulo', 'resumo', 'amor', 'amizade', 'trabalho', 'intimidade', 'dica', 'pontosFortes', 'desafios', 'faq']
const erros = []
const saida = { ...atual, par, signos: [ab.a, ab.b], geradoEm: atual.geradoEm, revisadoEm: new Date().toISOString() }

for (const lang of ['pt', 'en', 'es']) {
  const bloco = novo[lang]
  if (!bloco) { erros.push(`${lang}: idioma ausente no arquivo revisado`); continue }
  const faltando = CAMPOS.filter((c) => bloco[c] === undefined)
  if (faltando.length) erros.push(`${lang}: campos faltando: ${faltando.join(', ')}`)
  if (!Array.isArray(bloco.faq) || bloco.faq.length !== 3 || bloco.faq.some((f) => !f || !f.pergunta || !f.resposta)) erros.push(`${lang}: faq precisa de 3 itens com pergunta e resposta`)
  if (!Array.isArray(bloco.pontosFortes) || bloco.pontosFortes.length !== 3) erros.push(`${lang}: pontosFortes precisa de 3 itens`)
  if (!Array.isArray(bloco.desafios) || bloco.desafios.length !== 3) erros.push(`${lang}: desafios precisa de 3 itens`)
  // O título é o termo de busca — não muda no passe de revisão.
  const d = corrigirAutomatico(normalizar({ ...bloco, titulo: atual[lang].titulo }), lang, ab.a, ab.b)
  const e = validar(d, { lang, a: ab.a, b: ab.b })
  if (e.length) erros.push(...e.map((x) => `${lang}: ${x}`))
  saida[lang] = d
}

if (erros.length) {
  console.error('NÃO GRAVADO — corrija e rode de novo:')
  for (const e of erros) console.error('  - ' + e)
  process.exit(1)
}

const tmp = `${destino}.${process.pid}.tmp`
fs.writeFileSync(tmp, JSON.stringify(saida, null, 2))
fs.renameSync(tmp, destino)
console.log(`gravado: ${par} (pt/en/es validados)`)
