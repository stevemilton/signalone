import { create } from 'zustand'
import type { User, UserRole } from '@/types'

interface AuthState {
  user: User | null
  firebaseUid: string | null
  loading: boolean
  setUser: (user: User | null) => void
  setFirebaseUid: (uid: string | null) => void
  setLoading: (loading: boolean) => void
  isRole: (role: UserRole) => boolean
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseUid: null,
  loading: true,
  setUser: (user) => set({ user }),
  setFirebaseUid: (uid) => set({ firebaseUid: uid }),
  setLoading: (loading) => set({ loading }),
  isRole: (role) => get().user?.role === role,
  logout: () => set({ user: null, firebaseUid: null }),
}))
