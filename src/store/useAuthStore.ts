import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';

type UserRole = 'guest' | 'pelanggan' | 'mitra';

interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
}

interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setAuth: (user: User | null, session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  logout: () => Promise<void> | void;

  // Computed-like getters
  isAuthenticated: () => boolean;
  getUserRole: () => UserRole;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      // Initial State
      user: null,
      session: null,
      profile: null,
      isLoading: true,
      isInitialized: false,

      // Actions
      setAuth: (user, session) => set({ user, session }, false, 'setAuth'),

      setProfile: (profile) => set({ profile }, false, 'setProfile'),

      setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),

      setInitialized: (isInitialized) =>
        set({ isInitialized, isLoading: false }, false, 'setInitialized'),

      logout: () => {
        set(
          {
            user: null,
            session: null,
            profile: null,
          },
          false,
          'logout',
        );
      },

      // Getters
      isAuthenticated: () => get().user !== null && get().session !== null,

      getUserRole: () => {
        const profile = get().profile;
        if (!profile) return 'guest';
        return profile.role;
      },
    }),
    { name: 'AuthStore' }, // Nama di Redux DevTools
  ),
);
