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

const VIBRATE_PATTERN = [400, 150, 400, 150, 400, 150, 600]

interface ScheduleAlarmMsg { type: 'SCHEDULE_ALARM'; id: string; label: string; endTime: number }
interface CancelAlarmMsg { type: 'CANCEL_ALARM'; id: string }
// Chrome 86+ blocks navigator.vibrate() without a user gesture; OS notifications bypass this.
// The page posts VIBRATE_NOW when a timer finishes while visible.
interface VibrateNowMsg { type: 'VIBRATE_NOW'; id: string; label: string }
type AlarmMsg = ScheduleAlarmMsg | CancelAlarmMsg | VibrateNowMsg

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
          vibrate: VIBRATE_PATTERN,
        })
      }
    }, delay))
  } else if (msg.type === 'CANCEL_ALARM') {
    const existing = alarmTimeouts.get(msg.id)
    if (existing !== undefined) {
      clearTimeout(existing)
      alarmTimeouts.delete(msg.id)
    }
  } else if (msg.type === 'VIBRATE_NOW') {
    // Show a notification for vibration and close it immediately — OS vibrates before the close.
    event.waitUntil((async () => {
      const tag = `vibrate-${msg.id}`
      await self.registration.showNotification(msg.label, {
        body: 'Je timer is klaar!',
        icon: '/icons/icon-192.png',
        tag,
        vibrate: VIBRATE_PATTERN,
      })
      await new Promise<void>(resolve => setTimeout(resolve, 300))
      const notifications = await self.registration.getNotifications({ tag })
      notifications.forEach(n => n.close())
    })())
  }
})
