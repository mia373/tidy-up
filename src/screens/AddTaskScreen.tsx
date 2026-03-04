import React, { useState } from "react";
import {
  Text,
  TextInput,
  StyleSheet,
  Alert,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { colors, spacing, shadow } from "../theme";
import { PrimaryButton } from "../components/PrimaryButton";
import { addTask } from "../services/tasks";
import { useAuthStore } from "../store/useAuthStore";
import { MainTabParamList } from "../types/models";
import { useGenerateTasks } from "../hooks/useGenerateTasks";

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
  const { triggerGeneration, generating } = useGenerateTasks();
  const [title, setTitle] = useState("");
  const [pointsText, setPointsText] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("once");
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
      await addTask(user.homeId, title.trim(), points, user.id, frequency);
      setTitle("");
      setPointsText("");
      setFrequency("once");
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
      <PrimaryButton title="Create Task" onPress={handleCreate} loading={loading} />
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
});
