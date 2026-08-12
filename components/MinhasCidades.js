'use client'

import { useEffect, useState } from 'react'
import { wmo } from '@/lib/clima'
import { t } from '@/lib/tokens'

export default function MinhasCidades({ email, token }) {
  const [cidades, setCidades] = useState([])
  const [q, setQ] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [previa, setPrevia] = useState(null)
  const [erroBusca, setErroBusca] = useState('')
  const [salvo, setSalvo] = useState('idle') // idle | salvando | ok | erro
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    fetch(`/api/preferencias?e=${encodeURIComponent(email)}&t=${token}`)
      .then((r) => r.json())
      .then((d) => setCidades(d.cidades || []))
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [email, token])

  async function buscar(e) {
    e.preventDefault()
    if (q.trim().length < 2) return
    setBuscando(true)
    setErroBusca('')
    setPrevia(null)
    try {
      const r = await fetch(`/api/clima-busca?q=${encodeURIComponent(q.trim())}`)
      if (!r.ok) return setErroBusca('Não encontramos esse lugar. Tente incluir a cidade.')
      const d = await r.json()
      setPrevia({ rotulo: d.rotulo, lat: d.lat, lon: d.lon, clima: d.clima })
    } catch {
      setErroBusca('Não deu certo — tente de novo.')
    } finally {
      setBuscando(false)
    }
  }

  function adicionar() {
    if (!previa) return
    if (cidades.some((c) => c.rotulo === previa.rotulo)) {
      setPrevia(null)
      setQ('')
      return
    }
    setCidades([...cidades, { rotulo: previa.rotulo, lat: previa.lat, lon: previa.lon }].slice(0, 8))
    setPrevia(null)
    setQ('')
    setSalvo('idle')
  }

  function remover(rotulo) {
    setCidades(cidades.filter((c) => c.rotulo !== rotulo))
    setSalvo('idle')
  }

  async function salvar() {
    setSalvo('salvando')
    try {
      const r = await fetch('/api/preferencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ e: email, t: token, cidades }),
      })
      setSalvo(r.ok ? 'ok' : 'erro')
    } catch {
      setSalvo('erro')
    }
  }

  const box = { background: t.card, border: `1px solid ${t.line}`, borderRadius: t.radius, padding: 'clamp(18px,3vw,26px)', boxShadow: t.shadow }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={box}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: t.ink, marginBottom: 4 }}>➕ Adicionar cidade ou bairro</h2>
        <p style={{ fontSize: 13, color: t.muted, marginBottom: 14 }}>Digite o nome — pode ser sua cidade ou até seu bairro.</p>
        <form onSubmit={buscar} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ex.: Uberlândia, ou Savassi, Belo Horizonte"
            style={{ flex: '1 1 240px', minWidth: 0, padding: '13px 18px', borderRadius: 999, border: `2px solid ${t.line}`, background: '#fff', fontSize: 15, outline: 'none' }}
          />
          <button type="submit" className="btn" style={{ background: t.sunGrad, color: '#131417', fontWeight: 800, fontSize: 14, padding: '13px 24px', borderRadius: 999, whiteSpace: 'nowrap' }}>
            {buscando ? 'Buscando…' : 'Buscar'}
          </button>
        </form>
        {erroBusca && <p style={{ fontSize: 13, color: '#DC2626', marginTop: 10 }}>{erroBusca}</p>}
        {previa && (
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#F7F5EF', borderRadius: t.radiusSm, padding: '12px 16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 26 }}>{previa.clima?.agora ? wmo(previa.clima.agora.code, 'pt').emoji : '📍'}</span>
              <div>
                <div style={{ fontWeight: 700, color: t.ink, fontSize: 14.5 }}>{previa.rotulo}</div>
                {previa.clima?.agora && <div style={{ fontSize: 12.5, color: t.muted }}>{previa.clima.agora.temp}° agora · {wmo(previa.clima.agora.code, 'pt').texto}</div>}
              </div>
            </div>
            <button onClick={adicionar} className="btn" style={{ background: t.ink, color: '#fff', fontWeight: 700, fontSize: 13, padding: '9px 18px', borderRadius: 999 }}>
              Adicionar
            </button>
          </div>
        )}
      </div>

      <div style={box}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: t.ink, marginBottom: 14 }}>📍 Minhas cidades ({cidades.length})</h2>
        {carregando ? (
          <p style={{ fontSize: 13.5, color: t.muted }}>Carregando…</p>
        ) : cidades.length === 0 ? (
          <p style={{ fontSize: 13.5, color: t.muted }}>Você ainda não escolheu nenhuma. Adicione acima — assim seu resumo diário mostra o clima do seu lugar.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cidades.map((c) => (
              <div key={c.rotulo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${t.line}`, borderRadius: t.radiusSm, padding: '11px 15px' }}>
                <span style={{ fontSize: 14, color: t.ink }}>📍 {c.rotulo}</span>
                <button onClick={() => remover(c.rotulo)} style={{ color: '#DC2626', fontSize: 13, fontWeight: 700 }}>Remover</button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={salvar}
          className="btn"
          disabled={salvo === 'salvando'}
          style={{ marginTop: 18, background: t.sunGrad, color: '#131417', fontWeight: 800, fontSize: 14.5, padding: '13px 28px', borderRadius: 999, opacity: salvo === 'salvando' ? 0.7 : 1 }}
        >
          {salvo === 'salvando' ? 'Salvando…' : salvo === 'ok' ? 'Salvo ✓' : 'Salvar minhas cidades'}
        </button>
        {salvo === 'ok' && <span style={{ marginLeft: 12, fontSize: 13.5, color: '#16A34A', fontWeight: 700 }}>Pronto! Seu resumo diário já vem com essas.</span>}
        {salvo === 'erro' && <span style={{ marginLeft: 12, fontSize: 13.5, color: '#DC2626' }}>Erro ao salvar — tente de novo.</span>}
      </div>
    </div>
  )
}
