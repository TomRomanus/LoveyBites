import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDK2dVx0_rccf8JsyVUum16ZnFjTNV4OhA",
  authDomain: "loveybites-2e816.firebaseapp.com",
  projectId: "loveybites-2e816",
  storageBucket: "loveybites-2e816.firebasestorage.app",
  messagingSenderId: "684142761573",
  appId: "1:684142761573:web:07e3ac74bd1bbd3ddf988c",
  measurementId: "G-5G2VSS8B32"
};

const app = initializeApp(firebaseConfig)
export const analytics = getAnalytics(app);
export const db = getFirestore(app)
