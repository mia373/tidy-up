import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Share,
  ScrollView,
  Switch,
} from "react-native";
import * as Notifications from "expo-notifications";
import * as Clipboard from "expo-clipboard";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing, shadow } from "../theme";
import { PrimaryButton } from "../components/PrimaryButton";
import { updateName, leaveHome } from "../services/settings";
import { fetchHome } from "../services/homes";
import { useAuthStore } from "../store/useAuthStore";
import { useHomeStore } from "../store/useHomeStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { AppStackParamList } from "../types/models";

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const home = useHomeStore((s) => s.home);
  const setHome = useHomeStore((s) => s.setHome);
  const remindersEnabled = useSettingsStore((s) => s.remindersEnabled);
  const setRemindersEnabled = useSettingsStore((s) => s.setRemindersEnabled);
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [name, setName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [leavingHome, setLeavingHome] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch home if not already in store (e.g. after create/join home)
  useEffect(() => {
    if (!home && user?.homeId) {
      fetchHome(user.homeId).then(setHome).catch(() => {});
    }
  }, [home, user?.homeId, setHome]);

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

  const handleCopy = async () => {
    if (!home?.inviteCode) return;
    await Clipboard.setStringAsync(home.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!home?.inviteCode) return;
    await Share.share({
      message: `Join my home on TidyUp! Use invite code: ${home.inviteCode}`,
    });
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
              setHome(null);
              navigation.navigate("HomeSetup");
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

  const spacedCode = home?.inviteCode.split("").join("  ") ?? "––––––";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
          <Text style={styles.sectionLabel}>Invite Code</Text>
          <Text style={styles.sectionHint}>
            Share this code so others can join your home.
          </Text>
          <View style={styles.inviteCard}>
            <Text style={styles.inviteCode}>{spacedCode}</Text>
            <View style={styles.inviteActions}>
              <TouchableOpacity
                style={[styles.inviteBtn, copied && styles.inviteBtnCopied]}
                onPress={handleCopy}
                activeOpacity={0.8}
              >
                <Text style={styles.inviteBtnText}>
                  {copied ? "Copied!" : "Copy"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inviteBtn}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Text style={styles.inviteBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Home Profile</Text>
          <Text style={styles.sectionHint}>
            Update your home type, rooms, and pet info used for AI task generation.
          </Text>
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => navigation.navigate("HomeProfile", { mode: "edit" })}
            activeOpacity={0.8}
          >
            <Text style={styles.editProfileBtnText}>Edit Home Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notifications</Text>
          <Text style={styles.sectionHint}>
            Daily reminders for assigned and overdue tasks.
          </Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Daily Reminders</Text>
            <Switch
              value={remindersEnabled}
              onValueChange={(val) => {
                setRemindersEnabled(val);
                if (!val) {
                  void Notifications.cancelAllScheduledNotificationsAsync();
                }
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
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
  inviteCard: {
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.md,
    ...shadow,
  },
  inviteCode: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: 2,
    fontVariant: ["tabular-nums"],
  },
  inviteActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  inviteBtn: {
    backgroundColor: colors.surface,
    borderWidth: 2.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    ...shadow,
  },
  inviteBtnCopied: {
    backgroundColor: colors.success,
  },
  inviteBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  editProfileBtn: {
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: "center",
    ...shadow,
  },
  editProfileBtnText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    ...shadow,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
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
