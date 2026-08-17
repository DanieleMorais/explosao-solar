'use client'

import { useEffect, useRef, useState } from 'react'
import { t } from '@/lib/tokens'

const L = {
  pt: { ouvir: 'Ouvir matéria', pausar: 'Pausar', codigo: 'pt-BR' },
  en: { ouvir: 'Listen', pausar: 'Pause', codigo: 'en-US' },
  es: { ouvir: 'Escuchar', pausar: 'Pausar', codigo: 'es-ES' },
}

export default function OuvirMateria({ titulo, texto, lang = 'pt' }) {
  const txt = L[lang] || L.pt
  const [estado, setEstado] = useState('parado') // parado | tocando
  const [suportado, setSuportado] = useState(true)
  const fila = useRef([])
  const idx = useRef(0)
  const vozes = useRef([])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) { setSuportado(false); return }
    const carregar = () => { vozes.current = window.speechSynthesis.getVoices() || [] }
    carregar()
    window.speechSynthesis.onvoiceschanged = carregar
    return () => { try { window.speechSynthesis?.cancel() } catch {} }
  }, [])

  function vozDoIdioma() {
    const base = txt.codigo.slice(0, 2) // pt | en | es
    const vs = vozes.current
    return (
      vs.find((v) => v.lang === txt.codigo) ||
      vs.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(base)) ||
      null
    )
  }

  function falarProximo() {
    const synth = window.speechSynthesis
    if (idx.current >= fila.current.length) { setEstado('parado'); return }
    const u = new SpeechSynthesisUtterance(fila.current[idx.current])
    u.lang = txt.codigo
    const v = vozDoIdioma()
    if (v) u.voice = v
    u.rate = 1
    u.onend = () => { idx.current++; falarProximo() }
    u.onerror = () => setEstado('parado')
    synth.speak(u)
  }

  function toggle() {
    const synth = window.speechSynthesis
    if (!synth) return
    if (estado === 'tocando') {
      synth.cancel()
      setEstado('parado')
      return
    }
    // quebra em frases (evita o corte de textos longos no Chrome)
    const limpo = `${titulo}. ${texto}`.replace(/\s+/g, ' ').trim()
    fila.current = limpo.match(/[^.!?]+[.!?]+|\S+$/g) || [limpo]
    idx.current = 0
    synth.cancel()
    setEstado('tocando')
    falarProximo()
  }

  if (!suportado) return null

  return (
    <button
      onClick={toggle}
      aria-label={estado === 'tocando' ? txt.pausar : txt.ouvir}
      className="btn"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: estado === 'tocando' ? t.ink : t.sunGrad,
        color: estado === 'tocando' ? '#fff' : '#131417',
        fontWeight: 800,
        fontSize: 13.5,
        padding: '9px 18px',
        borderRadius: 999,
      }}
    >
      <span style={{ fontSize: 15 }}>{estado === 'tocando' ? '⏸' : '🔊'}</span>
      {estado === 'tocando' ? txt.pausar : txt.ouvir}
    </button>
  )
}
