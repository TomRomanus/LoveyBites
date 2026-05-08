import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore'
import { getAnalytics } from "firebase/analytics";
import { getStorage } from 'firebase/storage'
import { getAuth, GoogleAuthProvider, connectAuthEmulator, browserLocalPersistence, setPersistence } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig)
export const analytics = import.meta.env.VITE_USE_EMULATOR === 'true' ? null : getAnalytics(app);
// In emulator mode use long-polling — WebChannel cold-start takes 15–30 s per fresh browser
// context, which blows past the 30 s test timeout. Long-polling connects in milliseconds.
export const db = import.meta.env.VITE_USE_EMULATOR === 'true'
  ? initializeFirestore(app, { experimentalForceLongPolling: true })
  : getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, '127.0.0.1', 8181)
  connectAuthEmulator(auth, 'http://127.0.0.1:9199', { disableWarnings: true })
  // Use localStorage instead of IndexedDB so Playwright storageState can capture auth tokens
  setPersistence(auth, browserLocalPersistence)
}
