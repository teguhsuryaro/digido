import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';

type UserRole = 'guest' | 'pelanggan' | 'mitra' | 'superadmin';

interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  ban_status: 'active' | 'banned_pelanggan' | 'banned_mitra' | 'banned_permanent';
  ban_reason: string | null;
}

interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  authVersion: number;

  // Actions
  setAuth: (user: User | null, session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  bumpAuthVersion: () => void;
  refreshSession: (session: Session) => void;
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
      authVersion: 0,

      // Actions
      setAuth: (user, session) => {
        const current = get();
        if (current.user?.id === user?.id && current.session?.access_token === session?.access_token) {
          return;
        }
        set({ user, session }, false, 'setAuth');
      },

      setProfile: (profile) => {
        const current = get();
        if (
          current.profile?.id === profile?.id &&
          current.profile?.full_name === profile?.full_name &&
          current.profile?.role === profile?.role &&
          current.profile?.ban_status === profile?.ban_status &&
          current.profile?.avatar_url === profile?.avatar_url &&
          current.profile?.phone === profile?.phone
        ) {
          return;
        }
        set({ profile }, false, 'setProfile');
      },

      setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),

      setInitialized: (isInitialized) =>
        set(
          (state) => ({
            isInitialized,
            ...(state.isLoading ? { isLoading: false } : {}),
          }),
          false,
          'setInitialized'
        ),

      bumpAuthVersion: () => set(
        (state) => ({ authVersion: state.authVersion + 1 }),
        false,
        'bumpAuthVersion'
      ),

      refreshSession: (session) => set({ session }, false, 'refreshSession'),

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
