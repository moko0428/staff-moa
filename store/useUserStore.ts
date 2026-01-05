import { create } from 'zustand';
import { UserRole } from '@/types/mockData';

type State = {
  role: UserRole | null;
  roleHydrated: boolean;
  setRole: (role: UserRole | null) => void;
  hydrateRole: (getter: () => Promise<UserRole | null>) => Promise<void>;
  refreshRole: (getter: () => Promise<UserRole | null>) => Promise<void>;
};

export const useUserStore = create<State>((set, get) => ({
  role: null,
  roleHydrated: false,
  setRole: (role) => set({ role, roleHydrated: true }),
  hydrateRole: async (getter) => {
    if (get().roleHydrated) return;
    const role = await getter();
    set({ role, roleHydrated: true });
  },
  refreshRole: async (getter) => {
    const role = await getter();
    set({ role, roleHydrated: true });
  },
}));
