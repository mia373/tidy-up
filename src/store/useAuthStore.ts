import { create } from "zustand";
import { AppUser, SuggestedTask } from "../types/models";

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  needsHomeProfile: boolean;
  suggestedTasks: SuggestedTask[] | null;
  setUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  setNeedsHomeProfile: (v: boolean) => void;
  setSuggestedTasks: (tasks: SuggestedTask[] | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  needsHomeProfile: false,
  suggestedTasks: null,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setNeedsHomeProfile: (v) => set({ needsHomeProfile: v }),
  setSuggestedTasks: (tasks) => set({ suggestedTasks: tasks }),
}));
