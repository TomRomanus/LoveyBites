/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
  ({ url }) => /^https:\/\/firestore\.googleapis\.com\/.*/i.test(url.href),
  new NetworkFirst({ cacheName: 'firestore-cache', networkTimeoutSeconds: 10 }),
)

interface ScheduleAlarmMsg { type: 'SCHEDULE_ALARM'; id: string; label: string; endTime: number }
interface CancelAlarmMsg { type: 'CANCEL_ALARM'; id: string }
type AlarmMsg = ScheduleAlarmMsg | CancelAlarmMsg

const alarmTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const msg = event.data as AlarmMsg
  if (msg.type === 'SCHEDULE_ALARM') {
    const { id, label, endTime } = msg
    const existing = alarmTimeouts.get(id)
    if (existing !== undefined) clearTimeout(existing)
    const delay = Math.max(0, endTime - Date.now())
    alarmTimeouts.set(id, setTimeout(async () => {
      alarmTimeouts.delete(id)
      // Skip when any window is visible — the in-page handler (sound + VIBRATE_NOW) covers that case.
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const hasVisible = allClients.some(c => (c as WindowClient).visibilityState === 'visible')
      if (!hasVisible) {
        await self.registration.showNotification(label, {
          body: 'Je timer is klaar!',
          icon: '/icons/icon-192.png',
          tag: `timer-${id}`,
        })
      }
    }, delay))
  } else if (msg.type === 'CANCEL_ALARM') {
    const existing = alarmTimeouts.get(msg.id)
    if (existing !== undefined) {
      clearTimeout(existing)
      alarmTimeouts.delete(msg.id)
    }
  }
})
