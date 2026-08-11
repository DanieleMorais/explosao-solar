'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ArticleCard'
import { t } from '@/lib/tokens'
import { ui } from '@/lib/i18n'

const LABELS = {
  pt: { title: 'Buscar notícias', placeholder: 'Digite um tema, palavra-chave ou editoria…', one: '1 matéria encontrada', many: (n) => `${n} matérias encontradas`, none: 'Nada por aqui com esse termo. Tente outra palavra-chave.' },
  en: { title: 'Search news', placeholder: 'Type a topic, keyword or section…', one: '1 article found', many: (n) => `${n} articles found`, none: 'Nothing here with that term. Try another keyword.' },
  es: { title: 'Buscar noticias', placeholder: 'Escribe un tema, palabra clave o sección…', one: '1 artículo encontrado', many: (n) => `${n} artículos encontrados`, none: 'Nada por aquí con ese término. Prueba otra palabra clave.' },
}

function normalize(s) {
  return s.normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '').toLowerCase()
}

export default function SearchView({ articles, lang = 'pt' }) {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const L = LABELS[lang] || LABELS.pt

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return articles
    return articles.filter((a) => normalize(`${a.title} ${a.excerpt} ${a.category} ${(a.tags || []).join(' ')}`).includes(q))
  }, [query, articles])

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
          fontSize: 15.5,
          outline: 'none',
          boxShadow: t.shadow,
          marginBottom: 12,
        }}
      />
      <p style={{ fontSize: 13.5, color: t.muted, marginBottom: 26 }}>{results.length === 1 ? L.one : L.many(results.length)}</p>
      {results.length ? (
        <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {results.map((a) => (
            <Card key={a.slug} article={a} lang={lang} />
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 15, color: t.muted }}>{L.none}</p>
      )}
    </div>
  )
}
