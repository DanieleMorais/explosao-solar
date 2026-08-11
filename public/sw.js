self.addEventListener('push', (event) => {
  let dados = {}
  try {
    dados = event.data ? event.data.json() : {}
  } catch {
    dados = { title: 'Explosão Solar', body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(dados.title || 'Explosão Solar', {
      body: dados.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: dados.tag || 'explosao-solar',
      data: { url: dados.url || '/' },
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const c of lista) {
        if (c.url.includes('explosaosolar.com') && 'focus' in c) {
          c.navigate(url)
          return c.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
