import { adminAuth } from '@/lib/firebase/admin'
import { adminDb } from '@/lib/firebase/admin'

export async function verifyAuth(request: Request): Promise<{ uid: string } | null> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    return { uid: decoded.uid }
  } catch {
    return null
  }
}

export async function verifyRole(request: Request, allowedRoles: string[]): Promise<{ uid: string; role: string } | null> {
  const authResult = await verifyAuth(request)
  if (!authResult) return null

  try {
    const userDoc = await adminDb.collection('users').doc(authResult.uid).get()
    if (!userDoc.exists) return null

    const userData = userDoc.data()
    if (!userData || !allowedRoles.includes(userData.role)) return null

    return { uid: authResult.uid, role: userData.role }
  } catch {
    return null
  }
}
