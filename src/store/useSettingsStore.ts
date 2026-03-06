import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "system" | "light" | "dark";

interface SettingsState {
  remindersEnabled: boolean;
  setRemindersEnabled: (enabled: boolean) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      remindersEnabled: true,
      setRemindersEnabled: (remindersEnabled) => set({ remindersEnabled }),
      themeMode: "system" as ThemeMode,
      setThemeMode: (themeMode) => set({ themeMode }),
    }),
    {
      name: "tidyup-settings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
