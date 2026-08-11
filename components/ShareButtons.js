'use client'

import { useState } from 'react'
import { t } from '@/lib/tokens'
import { ui } from '@/lib/i18n'

export default function ShareButtons({ url, title, lang = 'pt' }) {
  const txt = ui(lang)
  const [copied, setCopied] = useState(false)
  const enc = encodeURIComponent

  const links = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${enc(`${title} — ${url}`)}`, bg: '#25D366' },
    { name: 'X', href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`, bg: '#131417' },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, bg: '#1877F2' },
  ]

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copie o link:', url)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: t.muted, letterSpacing: 1, textTransform: 'uppercase', marginRight: 4 }}>
        {txt.share}
      </span>
      {links.map((l) => (
        <a
          key={l.name}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
          aria-label={`Compartilhar no ${l.name}`}
          style={{
            background: l.bg,
            color: '#fff',
            fontSize: 12.5,
            fontWeight: 700,
            padding: '7px 14px',
            borderRadius: 999,
            display: 'inline-block',
          }}
        >
          {l.name}
        </a>
      ))}
      <button
        onClick={copy}
        className="btn"
        style={{
          border: `1px solid ${t.line}`,
          background: copied ? t.sunGrad : t.card,
          color: copied ? '#131417' : t.inkSoft,
          fontSize: 12.5,
          fontWeight: 700,
          padding: '7px 14px',
          borderRadius: 999,
        }}
      >
        {copied ? txt.copied : txt.copyLink}
      </button>
    </div>
  )
}
