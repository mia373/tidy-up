import { create } from "zustand";

export type SortMode = "newest" | "oldest" | "az" | "za";

interface TasksState {
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
}

export const useTasksStore = create<TasksState>((set) => ({
  sortMode: "newest",
  setSortMode: (sortMode) => set({ sortMode }),
}));
