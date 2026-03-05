import { create } from "zustand";
import { Home } from "../types/models";

interface HomeState {
  home: Home | null;
  setHome: (home: Home | null) => void;
}

export const useHomeStore = create<HomeState>((set) => ({
  home: null,
  setHome: (home) => set({ home }),
}));
