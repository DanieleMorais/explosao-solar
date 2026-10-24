'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { idiomaDaRota, HREFLANG } from '@/lib/idiomas'

// O HTML já sai com o <html lang> (e o dir do árabe) certo pelo worker-lang.js; aqui é só para a navegação dentro do
// site (troca de página sem recarregar), nos 12 idiomas.
export default function LangSync() {
  const pathname = usePathname()
  useEffect(() => {
    const idioma = idiomaDaRota(pathname)
    document.documentElement.lang = HREFLANG[idioma]
    if (idioma === 'ar') document.documentElement.dir = 'rtl'
    else document.documentElement.removeAttribute('dir')
  }, [pathname])
  return null
}
