import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme";
import { PrimaryButton } from "../components/PrimaryButton";
import { createHome, joinHome } from "../services/homes";
import { useAuthStore } from "../store/useAuthStore";

export default function HomeSetupScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [homeName, setHomeName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [creatingHome, setCreatingHome] = useState(false);
  const [joiningHome, setJoiningHome] = useState(false);

  const handleCreateHome = async () => {
    if (!homeName.trim()) {
      Alert.alert("Error", "Please enter a home name.");
      return;
    }
    if (!user) return;
    try {
      setCreatingHome(true);
      const homeId = await createHome(homeName.trim(), user.id);
      setUser({ ...user, homeId });
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setCreatingHome(false);
    }
  };

  const handleJoinHome = async () => {
    if (!inviteCode.trim()) {
      Alert.alert("Error", "Please enter an invite code.");
      return;
    }
    if (!user) return;
    try {
      setJoiningHome(true);
      const homeId = await joinHome(inviteCode.trim(), user.id);
      setUser({ ...user, homeId });
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setJoiningHome(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Set Up Your Home</Text>
        <Text style={styles.subtitle}>
          Create a new home or join an existing one with an invite code.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create a Home</Text>
          <TextInput
            style={styles.input}
            placeholder="Home name (e.g. The Smiths)"
            placeholderTextColor={colors.muted}
            value={homeName}
            onChangeText={setHomeName}
          />
          <PrimaryButton
            title="Create Home"
            onPress={handleCreateHome}
            loading={creatingHome}
          />
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Join a Home</Text>
          <TextInput
            style={styles.input}
            placeholder="6-character invite code"
            placeholderTextColor={colors.muted}
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
            maxLength={6}
          />
          <PrimaryButton
            title="Join Home"
            onPress={handleJoinHome}
            loading={joiningHome}
          />
        </View>
      </ScrollView>
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
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.muted,
    fontSize: 14,
  },
});
