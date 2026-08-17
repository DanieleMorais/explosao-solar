// Resultados das loterias da Caixa (API guidi, grátis). Últimos sorteios.
const JOGOS = [
  { slug: 'megasena', nome: 'Mega-Sena', cor: '#209869' },
  { slug: 'lotofacil', nome: 'Lotofácil', cor: '#930989' },
  { slug: 'quina', nome: 'Quina', cor: '#260085' },
  { slug: 'lotomania', nome: 'Lotomania', cor: '#F78100' },
  { slug: 'diadesorte', nome: 'Dia de Sorte', cor: '#CB852B' },
  { slug: 'timemania', nome: 'Timemania', cor: '#00925F' },
]

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36'

async function buscarJogo(slug) {
  // fontes em cascata (guidi principal, loteriascaixa como reserva)
  const fontes = [
    `https://api.guidi.dev.br/loteria/${slug}/ultimo`,
    `https://loteriascaixa-api.herokuapp.com/api/${slug}/latest`,
  ]
  for (const url of fontes) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, next: { revalidate: 1800 }, signal: AbortSignal.timeout(9000) })
      if (r.ok) {
        const d = await r.json()
        if (d && (d.numero || d.concurso || d.listaDezenas || d.dezenas)) return d
      }
    } catch {}
  }
  return null
}

async function um(j) {
  try {
    const d = await buscarJogo(j.slug)
    if (!d) return null
    const faixa1 = (d.listaRateioPremio || d.premiacoes || [])[0] || {}
    return {
      ...j,
      concurso: d.numero || d.concurso,
      data: d.dataApuracao || d.data || '',
      dezenas: (d.listaDezenas || d.dezenas || []).map((x) => Number(x)),
      acumulou: !!(d.acumulado ?? d.acumulou),
      ganhadores: faixa1.numeroDeGanhadores ?? faixa1.ganhadores ?? 0,
      premio: faixa1.valorPremio ?? 0,
      proxValor: d.valorEstimadoProximoConcurso || 0,
      proxData: d.dataProximoConcurso || '',
      extra: d.nomeTimeCoracaoMesSorte || d.timeCoracao || d.mesSorte || '',
    }
  } catch {
    return null
  }
}

export async function loterias() {
  return (await Promise.all(JOGOS.map(um))).filter(Boolean)
}

export function brl(v) {
  return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}
