import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SettingsState {
  remindersEnabled: boolean;
  setRemindersEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      remindersEnabled: true,
      setRemindersEnabled: (remindersEnabled) => set({ remindersEnabled }),
    }),
    {
      name: "tidyup-settings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
