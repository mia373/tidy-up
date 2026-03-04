import { create } from "zustand";
import { AppUser } from "../types/models";

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  needsHomeProfile: boolean;
  setUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  setNeedsHomeProfile: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  needsHomeProfile: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setNeedsHomeProfile: (v) => set({ needsHomeProfile: v }),
}));
