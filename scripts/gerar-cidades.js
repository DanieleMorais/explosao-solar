// Gera lib/cidades-br.js com as N maiores cidades do Brasil (por população),
// com coordenadas e slug. Base para o SEO de "previsão do tempo [cidade]".
// Uso: node scripts/gerar-cidades.js [N=1000]

const fs = require('fs')
const path = require('path')

const N = parseInt(process.argv[2] || '1000', 10)
const UA = { 'User-Agent': 'ExplosaoSolarBot/1.0 (+https://explosaosolar.com)' }

const UF_POR_CODIGO = {
  11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO', 21: 'MA', 22: 'PI', 23: 'CE',
  24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA', 31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP',
  41: 'PR', 42: 'SC', 43: 'RS', 50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF',
}

function slug(nome) {
  return String(nome)
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

async function main() {
  const [muni, pop] = await Promise.all([
    fetch('https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/json/municipios.json', { headers: UA }).then((r) => r.json()),
    fetch('https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/-1/variaveis/9324?localidades=N6[all]', { headers: UA }).then((r) => r.json()),
  ])

  const popPorCodigo = {}
  for (const s of pop[0].resultados[0].series) {
    const val = Object.values(s.serie)[0]
    popPorCodigo[String(s.localidade.id)] = parseInt(val, 10) || 0
  }

  const cidades = muni
    .map((m) => ({
      nome: m.nome,
      uf: UF_POR_CODIGO[m.codigo_uf],
      slug: slug(m.nome),
      lat: Math.round(m.latitude * 1e4) / 1e4,
      lon: Math.round(m.longitude * 1e4) / 1e4,
      pop: popPorCodigo[String(m.codigo_ibge)] || 0,
    }))
    .filter((c) => c.uf && c.lat && c.lon)
    .sort((a, b) => b.pop - a.pop)
    .slice(0, N)

  const linhas = cidades.map((c) => `  { nome: ${JSON.stringify(c.nome)}, uf: '${c.uf}', slug: '${c.slug}', lat: ${c.lat}, lon: ${c.lon} },`).join('\n')

  const conteudo = `// Gerado por scripts/gerar-cidades.js — top ${N} cidades do Brasil por população.
export const TOP_CIDADES = [
${linhas}
]

const _idx = new Map(TOP_CIDADES.map((c) => [c.uf + '/' + c.slug, c]))
export function cidadeBR(uf, slug) {
  return _idx.get(String(uf).toUpperCase() + '/' + String(slug).toLowerCase()) || null
}
`

  fs.writeFileSync(path.join(__dirname, '..', 'lib', 'cidades-br.js'), conteudo)
  console.log(`lib/cidades-br.js gerado: ${cidades.length} cidades`)
  console.log('maiores:', cidades.slice(0, 5).map((c) => `${c.nome}/${c.uf}`).join(', '))
  console.log('menores:', cidades.slice(-3).map((c) => `${c.nome}/${c.uf}`).join(', '))
}

main().catch((e) => {
  console.error('ERRO:', e.message)
  process.exit(1)
})
