/* eslint-disable no-undef */
// Firebase Cloud Messaging service worker for background push notifications.
// Must use compat SDK — service workers cannot use ES modules.

importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyCs_LDkR30xP9sXZksr2kuwkNqeyy6VUOE',
  authDomain: 'signalone-2d228.firebaseapp.com',
  projectId: 'signalone-2d228',
  storageBucket: 'signalone-2d228.firebasestorage.app',
  messagingSenderId: '140373209192',
  appId: '1:140373209192:web:bf805cf94dc44f86434bdd',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body, url } = payload.data || {}

  if (!title) return

  self.registration.showNotification(title, {
    body: body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: url || '/' },
    tag: 'signal-one-alert',
    renotify: true,
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus an existing tab if one is open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Otherwise open a new tab
      return clients.openWindow(url)
    })
  )
})
