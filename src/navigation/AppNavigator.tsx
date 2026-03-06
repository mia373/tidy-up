import React, { useRef } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppStackParamList } from "../types/models";
import { useAuthStore } from "../store/useAuthStore";
import MainNavigator from "./MainNavigator";
import HomeProfileScreen from "../screens/HomeProfileScreen";
import SuggestedTasksScreen from "../screens/SuggestedTasksScreen";
import HomeSetupScreen from "../screens/HomeSetupScreen";
import AddWishlistItemScreen from "../screens/AddWishlistItemScreen";
import EditTaskScreen from "../screens/EditTaskScreen";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  const user = useAuthStore((s) => s.user);
  const initialRoute = useRef<keyof AppStackParamList>(
    user?.homeId ? "Main" : "HomeSetup"
  ).current;

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="HomeSetup" component={HomeSetupScreen} />
      <Stack.Screen name="Main" component={MainNavigator} />
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
      <Stack.Screen
        name="AddWishlistItem"
        component={AddWishlistItemScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="EditTask"
        component={EditTaskScreen}
        options={{ presentation: "modal" }}
      />
    </Stack.Navigator>
  );
}
