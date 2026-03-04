import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import { useAuthListener } from "./src/hooks/useAuth";

function AppContent() {
  useAuthListener();
  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
