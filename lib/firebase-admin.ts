import { getApps, initializeApp, applicationDefault, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function getCredentials() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    } catch (e) {
      console.error('Invalid FIREBASE_SERVICE_ACCOUNT JSON:', e)
      return applicationDefault()
    }
  }
  return applicationDefault()
}

export function getAdminApp() {
  if (!getApps().length) {
    initializeApp({ credential: getCredentials() })
  }
  return getApps()[0]
}

export const adminAuth = () => getAuth(getAdminApp())
export const adminDb = () => getFirestore(getAdminApp())


