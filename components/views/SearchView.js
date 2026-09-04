'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ArticleCard'
import { t } from '@/lib/tokens'

const LABELS = {
  pt: {
    title: 'Buscar notícias',
    placeholder: 'Digite um tema, palavra-chave ou editoria…',
    one: '1 matéria encontrada',
    many: (n) => `${n} matérias encontradas`,
    none: 'Nada por aqui com esse termo. Tente outra palavra-chave.',
    buscando: 'Buscando…',
    recentes: 'Mais recentes',
    falha: 'Não foi possível buscar agora. Tente de novo.',
  },
  en: {
    title: 'Search news',
    placeholder: 'Type a topic, keyword or section…',
    one: '1 article found',
    many: (n) => `${n} articles found`,
    none: 'Nothing here with that term. Try another keyword.',
    buscando: 'Searching…',
    recentes: 'Latest',
    falha: 'Could not search right now. Please try again.',
  },
  es: {
    title: 'Buscar noticias',
    placeholder: 'Escribe un tema, palabra clave o sección…',
    one: '1 artículo encontrado',
    many: (n) => `${n} artículos encontrados`,
    none: 'Nada por aquí con ese término. Prueba otra palabra clave.',
    buscando: 'Buscando…',
    recentes: 'Más recientes',
    falha: 'No se pudo buscar ahora. Inténtalo de nuevo.',
  },
}

export default function SearchView({ iniciais = [], totalAcervo = 0, lang = 'pt' }) {
  const searchParams = useSearchParams()
  const L = LABELS[lang] || LABELS.pt
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [resultados, setResultados] = useState(iniciais)
  const [total, setTotal] = useState(totalAcervo)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(false)
  const pedido = useRef(0)

  useEffect(() => {
    const termo = query.trim()
    if (!termo) {
      setResultados(iniciais)
      setTotal(totalAcervo)
      setCarregando(false)
      setErro(false)
      return
    }
    setCarregando(true)
    setErro(false)
    const id = ++pedido.current
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`/api/busca?q=${encodeURIComponent(termo)}&lang=${lang}`)
        if (!r.ok) throw new Error('HTTP ' + r.status)
        const d = await r.json()
        if (id !== pedido.current) return // resposta de uma digitação antiga
        setResultados(d.resultados)
        setTotal(d.total)
      } catch {
        if (id !== pedido.current) return
        setErro(true)
        setResultados([])
        setTotal(0)
      } finally {
        if (id === pedido.current) setCarregando(false)
      }
    }, 280)
    return () => clearTimeout(timer)
  }, [query, lang, iniciais, totalAcervo])

  const buscando = query.trim() !== ''
  const legenda = erro ? L.falha : carregando ? L.buscando : buscando ? (total === 1 ? L.one : L.many(total)) : L.recentes

  return (
    <div style={{ maxWidth: t.maxW, margin: '0 auto', padding: 'clamp(20px, 3vw, 56px)', paddingBottom: 0 }}>
      <h1 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, letterSpacing: -0.6, marginBottom: 18 }}>{L.title}</h1>
      <input
        type="search"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={L.placeholder}
        aria-label={L.title}
        style={{
          width: '100%',
          maxWidth: 560,
          padding: '15px 22px',
          borderRadius: 999,
          border: `2px solid ${t.line}`,
          background: t.card,
          color: t.ink,
          fontSize: 15.5,
          outline: 'none',
          boxShadow: t.shadow,
          marginBottom: 12,
        }}
      />
      <p style={{ fontSize: 13.5, color: t.muted, marginBottom: 26 }} aria-live="polite">
        {legenda}
      </p>
      {resultados.length ? (
        <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {resultados.map((a) => (
            <Card key={a.slug} article={a} lang={lang} />
          ))}
        </div>
      ) : (
        !carregando && <p style={{ fontSize: 15, color: t.muted }}>{erro ? L.falha : L.none}</p>
      )}
    </div>
  )
}
