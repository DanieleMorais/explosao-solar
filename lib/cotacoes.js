// Cotações ao vivo (AwesomeAPI, grátis, sem chave). Dólar, euro, libra, peso,
// bitcoin, ethereum — em reais.
const PARES = ['USD-BRL', 'EUR-BRL', 'GBP-BRL', 'ARS-BRL', 'BTC-BRL', 'ETH-BRL']

const META = {
  USD: { nome: 'Dólar americano', emoji: '🇺🇸', casas: 4 },
  EUR: { nome: 'Euro', emoji: '🇪🇺', casas: 4 },
  GBP: { nome: 'Libra esterlina', emoji: '🇬🇧', casas: 4 },
  ARS: { nome: 'Peso argentino', emoji: '🇦🇷', casas: 5 },
  BTC: { nome: 'Bitcoin', emoji: '₿', casas: 0, cripto: true },
  ETH: { nome: 'Ethereum', emoji: 'Ξ', casas: 0, cripto: true },
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36'

export async function cotacoes() {
  try {
    const r = await fetch(`https://economia.awesomeapi.com.br/last/${PARES.join(',')}`, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(12000),
    })
    if (!r.ok) return []
    const j = await r.json()
    return PARES.map((p) => {
      const d = j[p.replace('-', '')]
      if (!d) return null
      const m = META[d.code] || { nome: d.name, emoji: '💱', casas: 4 }
      return {
        code: d.code,
        nome: m.nome,
        emoji: m.emoji,
        cripto: !!m.cripto,
        casas: m.casas,
        valor: Number(d.bid),
        pct: Number(d.pctChange),
        alta: Number(d.high),
        baixa: Number(d.low),
        atualizado: d.create_date,
      }
    }).filter(Boolean)
  } catch {
    return []
  }
}

export function formatarBRL(v, casas = 4) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
}
