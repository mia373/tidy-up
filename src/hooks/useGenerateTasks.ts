import { useState } from "react";
import { Alert } from "react-native";
import { useAuthStore } from "../store/useAuthStore";
import { fetchHome } from "../services/homes";
import { generateTasks } from "../services/ai";

// Shared hook for triggering AI task generation from any screen.
// - If the home profile isn't filled out (homeType is null), redirects to HomeProfileScreen.
// - If the profile exists, generates tasks directly and opens SuggestedTasksScreen.
export const useGenerateTasks = () => {
  const user = useAuthStore((s) => s.user);
  const setNeedsHomeProfile = useAuthStore((s) => s.setNeedsHomeProfile);
  const setSuggestedTasks = useAuthStore((s) => s.setSuggestedTasks);
  const [generating, setGenerating] = useState(false);

  const triggerGeneration = async () => {
    if (!user?.homeId) return;
    try {
      setGenerating(true);
      const home = await fetchHome(user.homeId);
      if (!home.homeType) {
        // Profile not set up yet — show HomeProfileScreen first
        setNeedsHomeProfile(true);
        return;
      }
      // Profile complete — generate directly
      const tasks = await generateTasks(user.homeId);
      setSuggestedTasks(tasks);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  return { triggerGeneration, generating };
};
