import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "../types/models";
import { useAuthStore } from "../store/useAuthStore";
import MainNavigator from "./MainNavigator";
import HomeProfileScreen from "../screens/HomeProfileScreen";
import SuggestedTasksScreen from "../screens/SuggestedTasksScreen";

const Stack = createNativeStackNavigator<AppStackParamList>();

// Thin wrapper so the Zustand `needsHomeProfile` flag (set by HomeSetupScreen
// after creating a home) can trigger a navigation push to HomeProfileScreen.
function MainWithProfileCheck({
  navigation,
}: NativeStackScreenProps<AppStackParamList, "Main">) {
  const needsHomeProfile = useAuthStore((s) => s.needsHomeProfile);
  const setNeedsHomeProfile = useAuthStore((s) => s.setNeedsHomeProfile);

  useEffect(() => {
    if (needsHomeProfile) {
      setNeedsHomeProfile(false);
      navigation.navigate("HomeProfile");
    }
  }, [needsHomeProfile, navigation, setNeedsHomeProfile]);

  return <MainNavigator />;
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainWithProfileCheck} />
      <Stack.Screen
        name="HomeProfile"
        component={HomeProfileScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="SuggestedTasks"
        component={SuggestedTasksScreen}
        options={{ presentation: "modal" }}
      />
    </Stack.Navigator>
  );
}
