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

let _adminDb: any = null

export function getAdminApp() {
  if (!getApps().length) {
    const app = initializeApp({ credential: getCredentials() })
    // Set Firestore settings once during app initialization
    const db = getFirestore(app)
    db.settings({ ignoreUndefinedProperties: true })
    _adminDb = db
  }
  return getApps()[0]
}

export const adminAuth = () => getAuth(getAdminApp())
export const adminDb = () => {
  if (!_adminDb) {
    _adminDb = getFirestore(getAdminApp())
  }
  return _adminDb
}


