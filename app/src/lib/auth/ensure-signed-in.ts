import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'

/**
 * Ensures the Firebase client is signed in during registration.
 * Returns the UID if signed in, or null on failure.
 */
export async function ensureSignedIn(): Promise<string | null> {
  if (auth.currentUser) return auth.currentUser.uid

  const email = sessionStorage.getItem('esaf_reg_email')
  const password = sessionStorage.getItem('esaf_reg_password')
  if (!email || !password) return null

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    return credential.user.uid
  } catch {
    return null
  }
}
