import React, { useMemo } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { shadow } from "../theme";
import { useTheme } from "../hooks/useTheme";
import type { ColorPalette } from "../theme";

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  small,
}: PrimaryButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity
      style={[
        styles.button,
        small && styles.small,
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={[styles.text, small && styles.smallText]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      ...shadow,
    },
    small: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    disabled: {
      opacity: 0.5,
    },
    text: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    smallText: {
      fontSize: 13,
      fontWeight: "700",
    },
  });
}
