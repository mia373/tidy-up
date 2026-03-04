import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuthStore } from "../store/useAuthStore";
import { LoadingScreen } from "../components/LoadingScreen";
import AuthNavigator from "./AuthNavigator";
import HomeSetupScreen from "../screens/HomeSetupScreen";
import MainNavigator from "./MainNavigator";

export default function RootNavigator() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthNavigator />
      ) : !user.homeId ? (
        <HomeSetupScreen />
      ) : (
        <MainNavigator />
      )}
    </NavigationContainer>
  );
}
