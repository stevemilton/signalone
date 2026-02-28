'use client'

import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { useAuthStore } from '@/stores/auth-store'
import type { User } from '@/types'

export function useAuth() {
  const { user, loading, setUser, setFirebaseUid, setLoading } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setFirebaseUid(firebaseUser.uid)
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (userDoc.exists()) {
            setUser({ id: userDoc.id, ...userDoc.data() } as User)
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        }
      } else {
        setUser(null)
        setFirebaseUid(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [setUser, setFirebaseUid, setLoading])

  return { user, loading }
}
