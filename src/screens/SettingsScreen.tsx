import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, shadow } from "../theme";
import { PrimaryButton } from "../components/PrimaryButton";
import { updateName, leaveHome } from "../services/settings";
import { useAuthStore } from "../store/useAuthStore";

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [leavingHome, setLeavingHome] = useState(false);

  const handleSaveName = async () => {
    if (!user) return;
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }
    try {
      setSavingName(true);
      await updateName(user.id, name.trim());
      setUser({ ...user, name: name.trim() });
      Alert.alert("Saved!", "Your name has been updated.");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setSavingName(false);
    }
  };

  const handleLeaveHome = () => {
    Alert.alert(
      "Leave Home?",
      "You'll lose access to all tasks and the leaderboard. You can join or create a new home after.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            if (!user?.homeId) return;
            try {
              setLeavingHome(true);
              await leaveHome(user.id, user.homeId);
              setUser({ ...user, homeId: null });
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Something went wrong"
              );
            } finally {
              setLeavingHome(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Settings ⚙️</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Display Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.muted}
        />
        <PrimaryButton
          title="Save Name"
          onPress={handleSaveName}
          loading={savingName}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Home</Text>
        <Text style={styles.sectionHint}>
          Leaving removes you from the leaderboard and task board.
        </Text>
        <TouchableOpacity
          style={[styles.leaveBtn, leavingHome && styles.leaveBtnDisabled]}
          onPress={handleLeaveHome}
          disabled={leavingHome}
          activeOpacity={0.8}
        >
          <Text style={styles.leaveBtnText}>
            {leavingHome ? "Leaving…" : "Leave Home"}
          </Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 32,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    opacity: 0.5,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  sectionHint: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.muted,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: 20,
    padding: spacing.md,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.md,
    ...shadow,
  },
  divider: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.lg,
    opacity: 0.15,
  },
  leaveBtn: {
    backgroundColor: colors.error,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: "center",
    ...shadow,
  },
  leaveBtnDisabled: {
    opacity: 0.5,
  },
  leaveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
