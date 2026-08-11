'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { t } from '@/lib/tokens'
import { langFromPath } from '@/lib/site'

const TXT = {
  pt: {
    cta: '🔔 Ativar alertas de desastres em tempo real',
    on: '✅ Alertas ativos neste dispositivo',
    desc: 'Terremotos, tempestades solares, ciclones e fenômenos climáticos extremos — receba uma notificação no momento em que são confirmados, antes de virarem manchete.',
    negado: 'Notificações bloqueadas. Para ativá-las, acesse as configurações do seu navegador e permita notificações deste site.',
    erro: 'Não foi possível ativar — verifique as permissões do navegador e tente novamente.',
    aguarde: 'Ativando…',
  },
  en: {
    cta: '🔔 Enable real-time disaster alerts',
    on: '✅ Alerts active on this device',
    desc: 'Earthquakes, solar storms, cyclones and extreme weather events — get notified the moment they are confirmed, before they hit the headlines.',
    negado: 'Notifications are blocked. To enable them, open your browser settings and allow notifications from this site.',
    erro: 'Unable to activate — check your browser permissions and try again.',
    aguarde: 'Enabling…',
  },
  es: {
    cta: '🔔 Activar alertas de desastres en tiempo real',
    on: '✅ Alertas activas en este dispositivo',
    desc: 'Terremotos, tormentas solares, ciclones y fenómenos climáticos extremos — recibe una notificación en el momento en que se confirman, antes de que lleguen a los titulares.',
    negado: 'Las notificaciones están bloqueadas. Para habilitarlas, abre la configuración de tu navegador y permite las notificaciones de este sitio.',
    erro: 'No se pudo activar — revisa los permisos del navegador e intenta de nuevo.',
    aguarde: 'Activando…',
  },
}

function b64ToUint8(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export default function AlertasPush() {
  const lang = langFromPath(usePathname())
  const L = TXT[lang] || TXT.pt
  const [estado, setEstado] = useState('oculto') // oculto | pronto | ativando | ativo | negado | erro

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return
    if (Notification.permission === 'denied') return setEstado('negado')
    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setEstado(sub ? 'ativo' : 'pronto')
    }).catch(() => setEstado('pronto'))
  }, [])

  async function ativar() {
    setEstado('ativando')
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return setEstado('negado')
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64ToUint8(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''),
      })
      const r = await fetch('/api/alertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), lang }),
      })
      setEstado(r.ok ? 'ativo' : 'erro')
    } catch (e) {
      setEstado('erro')
    }
  }

  if (estado === 'oculto') return null

  return (
    <div
      style={{
        background: `radial-gradient(120% 150% at 90% -20%, rgba(255,107,0,0.28), transparent 55%), ${t.dark}`,
        border: '1px solid rgba(255,179,0,0.25)',
        borderRadius: t.radius,
        padding: 'clamp(18px, 3vw, 28px)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', maxWidth: 520, margin: 0 }}>{L.desc}</p>
      {estado === 'ativo' ? (
        <span style={{ fontWeight: 800, fontSize: 14, color: '#FFB300' }}>{L.on}</span>
      ) : estado === 'negado' ? (
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{L.negado}</span>
      ) : (
        <button
          onClick={ativar}
          className="btn"
          disabled={estado === 'ativando'}
          style={{
            background: t.sunGrad,
            color: '#131417',
            fontWeight: 800,
            fontSize: 14,
            padding: '12px 22px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
            opacity: estado === 'ativando' ? 0.7 : 1,
          }}
        >
          {estado === 'ativando' ? L.aguarde : L.cta}
        </button>
      )}
      {estado === 'erro' && <span style={{ fontSize: 12.5, color: '#FF8A65' }}>{L.erro}</span>}
    </div>
  )
}
