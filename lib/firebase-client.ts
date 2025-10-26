import { initializeApp, getApps } from 'firebase/app'
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export function getFirebaseApp() {
  if (!getApps().length) {
    initializeApp(firebaseConfig)
  }
  return getApps()[0]
}

export function getFirebaseServices() {
  const app = getFirebaseApp()
  const auth = getAuth(app)
  const db = getFirestore(app)
  return { app, auth, db }
}

export async function ensureSignedInAnonymously(): Promise<User | null> {
  const { auth } = getFirebaseServices()
  if (auth.currentUser) return auth.currentUser
  try {
    await signInAnonymously(auth)
    return new Promise(resolve => {
      const unsub = onAuthStateChanged(auth, (user) => {
        if (user) {
          resolve(user)
          unsub()
        }
      })
    })
  } catch (e) {
    console.error('Anonymous sign-in failed:', e)
    return null
  }
}


