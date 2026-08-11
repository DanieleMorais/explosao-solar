'use client'

import { useEffect, useState } from 'react'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export default function Analytics() {
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const check = () => setAllowed(localStorage.getItem('es-consent') === 'all')
    check()
    window.addEventListener('es-consent-changed', check)
    return () => window.removeEventListener('es-consent-changed', check)
  }, [])

  useEffect(() => {
    if (!allowed || !GA_ID || window.gtagLoaded) return
    window.gtagLoaded = true
    const s = document.createElement('script')
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
    s.async = true
    document.head.appendChild(s)
    window.dataLayer = window.dataLayer || []
    function gtag() {
      window.dataLayer.push(arguments)
    }
    window.gtag = gtag
    gtag('js', new Date())
    gtag('config', GA_ID, { anonymize_ip: true })
  }, [allowed])

  return null
}
