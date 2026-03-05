import React, { useState } from "react";
import {
  Text,
  TextInput,
  StyleSheet,
  Alert,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { colors, spacing, shadow } from "../theme";
import { PrimaryButton } from "../components/PrimaryButton";
import { addTask } from "../services/tasks";
import { useAuthStore } from "../store/useAuthStore";
import { useHomeMembers } from "../hooks/useHomeMembers";
import { MainTabParamList } from "../types/models";
import { useGenerateTasks } from "../hooks/useGenerateTasks";

const AVATAR_COLORS = ["#548BF8", "#FF6B6B", "#68D368", "#F97316", "#A855F7", "#EC4899"];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Frequency = "once" | "daily" | "weekly";

const FREQUENCIES: { value: Frequency; label: string; emoji: string }[] = [
  { value: "once", label: "Once", emoji: "1️⃣" },
  { value: "daily", label: "Daily", emoji: "🔁" },
  { value: "weekly", label: "Weekly", emoji: "📅" },
];

type Props = {
  navigation: BottomTabNavigationProp<MainTabParamList, "AddTask">;
};

export default function AddTaskScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const members = useHomeMembers(user?.homeId ?? null);
  const { triggerGeneration, generating } = useGenerateTasks();
  const [title, setTitle] = useState("");
  const [pointsText, setPointsText] = useState("");
  const [room, setRoom] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("once");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a task name.");
      return;
    }
    const points = parseInt(pointsText, 10);
    if (!pointsText || isNaN(points) || points <= 0) {
      Alert.alert("Error", "Please enter a valid points value greater than 0.");
      return;
    }
    if (!user?.homeId) return;
    try {
      setLoading(true);
      await addTask(user.homeId, title.trim(), points, user.id, frequency, room.trim() || null, assignedTo);
      setTitle("");
      setPointsText("");
      setRoom("");
      setFrequency("once");
      setAssignedTo(null);
      navigation.navigate("Tasks");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Add Task ✏️</Text>
        <TouchableOpacity
          style={styles.sparkleBtn}
          onPress={triggerGeneration}
          disabled={generating}
          activeOpacity={0.8}
        >
          {generating ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Text style={styles.sparkleBtnText}>✨</Text>
          )}
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        placeholder="What needs doing?"
        placeholderTextColor={colors.muted}
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Points (e.g. 10)"
        placeholderTextColor={colors.muted}
        value={pointsText}
        onChangeText={setPointsText}
        keyboardType="number-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Room (optional)"
        placeholderTextColor={colors.muted}
        value={room}
        onChangeText={setRoom}
        maxLength={40}
      />
      <Text style={styles.freqLabel}>Repeats</Text>
      <View style={styles.freqRow}>
        {FREQUENCIES.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.freqBtn,
              frequency === f.value && styles.freqBtnActive,
            ]}
            onPress={() => setFrequency(f.value)}
            activeOpacity={0.8}
          >
            <Text style={styles.freqEmoji}>{f.emoji}</Text>
            <Text
              style={[
                styles.freqText,
                frequency === f.value && styles.freqTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {members.length > 0 && (
        <>
          <Text style={styles.freqLabel}>Assign to</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.memberScroll}
          >
            <View style={styles.memberRow}>
              {/* "No one" option */}
              <TouchableOpacity
                style={styles.memberChip}
                onPress={() => setAssignedTo(null)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.memberAvatar,
                    styles.memberAvatarUnassigned,
                    !assignedTo && styles.memberAvatarSelected,
                  ]}
                >
                  <Text style={styles.memberInitialsUnassigned}>—</Text>
                </View>
                <Text style={styles.memberChipName}>No one</Text>
              </TouchableOpacity>
              {members.map((m, i) => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.memberChip}
                  onPress={() => setAssignedTo(m.id)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.memberAvatar,
                      { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] },
                      assignedTo === m.id && styles.memberAvatarSelected,
                    ]}
                  >
                    <Text style={styles.memberInitials}>{getInitials(m.name)}</Text>
                  </View>
                  <Text style={styles.memberChipName}>{m.name.split(" ")[0]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </>
      )}

      <PrimaryButton title="Create Task" onPress={handleCreate} loading={loading} />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
  },
  sparkleBtn: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  sparkleBtnText: {
    fontSize: 20,
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
  freqLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    opacity: 0.5,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  freqRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  freqBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: 16,
    ...shadow,
  },
  freqBtnActive: {
    backgroundColor: colors.accent,
  },
  freqEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  freqText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    opacity: 0.6,
  },
  freqTextActive: {
    opacity: 1,
  },
  memberScroll: {
    marginBottom: spacing.lg,
  },
  memberRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingBottom: 4,
  },
  memberChip: {
    alignItems: "center",
    gap: 4,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarUnassigned: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  memberAvatarSelected: {
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  memberInitials: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
  },
  memberInitialsUnassigned: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.muted,
  },
  memberChipName: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.text,
    opacity: 0.7,
  },
});
