import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme";

export default function TasksScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tasks</Text>
      <Text style={styles.subtitle}>Coming soon — Phase 4</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
  },
});
