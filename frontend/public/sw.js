// public/sw.js
// Service Worker — handles web push notifications

self.addEventListener('push', function(event) {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'QuantDesk Alert', body: event.data.text() }
  }

  const options = {
    body:    data.body  || 'Price alert triggered',
    icon:    data.icon  || '/icon-192.png',
    badge:   '/icon-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/alerts',
    },
    actions: [
      { action: 'view',    title: 'View Alerts' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title || '🔔 QuantDesk Alert', options)
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data?.url || '/alerts'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})