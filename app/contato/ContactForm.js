'use client'

import { useState } from 'react'
import { t } from '@/lib/tokens'

const input = {
  width: '100%',
  padding: '13px 16px',
  borderRadius: t.radiusSm,
  border: `1.5px solid ${t.line}`,
  background: t.card,
  fontSize: 14.5,
  outline: 'none',
  fontFamily: 'inherit',
}

const LABELS_PT = {
  heading: 'Envie uma mensagem',
  name: 'Seu nome',
  subject: 'Assunto',
  message: 'Escreva sua mensagem…',
  send: 'Enviar mensagem',
  hint: 'O envio abre o seu aplicativo de e-mail com a mensagem pronta.',
  bodyName: 'Nome',
}

export default function ContactForm({ email, labels = LABELS_PT }) {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  function submit(e) {
    e.preventDefault()
    const body = `${labels.bodyName}: ${name}\n\n${message}`
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(`[Site] ${subject}`)}&body=${encodeURIComponent(body)}`
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: t.card,
        border: `1px solid ${t.line}`,
        borderRadius: t.radius,
        padding: 'clamp(20px, 3vw, 30px)',
        boxShadow: t.shadow,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <h2 style={{ fontSize: 19, fontWeight: 900, letterSpacing: -0.3 }}>{labels.heading}</h2>
      <div className="grid-1-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={labels.name} aria-label={labels.name} style={input} />
        <input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={labels.subject} aria-label={labels.subject} style={input} />
      </div>
      <textarea
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={labels.message}
        aria-label={labels.message}
        rows={6}
        style={{ ...input, resize: 'vertical' }}
      />
      <button
        type="submit"
        className="btn"
        style={{
          alignSelf: 'flex-start',
          background: t.sunGrad,
          color: '#131417',
          fontWeight: 800,
          fontSize: 14.5,
          padding: '13px 28px',
          borderRadius: 999,
        }}
      >
        {labels.send}
      </button>
      <p style={{ fontSize: 12.5, color: t.muted }}>{labels.hint}</p>
    </form>
  )
}
