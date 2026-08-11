export default function manifest() {
  return {
    name: 'Explosão Solar — Profundidade antes da pressa',
    short_name: 'Explosão Solar',
    description: 'Portal de notícias e jornalismo explicativo com profundidade e contexto.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0C0E1A',
    theme_color: '#0C0E1A',
    lang: 'pt-BR',
    icons: [
      { src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
