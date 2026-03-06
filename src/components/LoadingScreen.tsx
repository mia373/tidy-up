import React, { useMemo } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "../hooks/useTheme";
import type { ColorPalette } from "../theme";

export function LoadingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
    },
  });
}
