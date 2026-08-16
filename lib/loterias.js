// Resultados das loterias da Caixa (API guidi, grátis). Últimos sorteios.
const JOGOS = [
  { slug: 'megasena', nome: 'Mega-Sena', cor: '#209869' },
  { slug: 'lotofacil', nome: 'Lotofácil', cor: '#930989' },
  { slug: 'quina', nome: 'Quina', cor: '#260085' },
  { slug: 'lotomania', nome: 'Lotomania', cor: '#F78100' },
  { slug: 'diadesorte', nome: 'Dia de Sorte', cor: '#CB852B' },
  { slug: 'timemania', nome: 'Timemania', cor: '#00925F' },
]

async function um(j) {
  try {
    const r = await fetch(`https://api.guidi.dev.br/loteria/${j.slug}/ultimo`, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(12000) })
    if (!r.ok) return null
    const d = await r.json()
    const faixa1 = (d.listaRateioPremio || [])[0] || {}
    return {
      ...j,
      concurso: d.numero,
      data: d.dataApuracao,
      dezenas: d.listaDezenas || [],
      acumulou: !!d.acumulado,
      ganhadores: faixa1.numeroDeGanhadores || 0,
      premio: faixa1.valorPremio || 0,
      proxValor: d.valorEstimadoProximoConcurso || 0,
      proxData: d.dataProximoConcurso || '',
      extra: d.nomeTimeCoracaoMesSorte || '',
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
