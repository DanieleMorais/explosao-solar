'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { langFromPath } from '@/lib/site'

const HTML_LANG = { pt: 'pt-BR', en: 'en', es: 'es' }

export default function LangSync() {
  const pathname = usePathname()
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[langFromPath(pathname)]
  }, [pathname])
  return null
}
