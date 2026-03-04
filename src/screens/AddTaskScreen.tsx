import React, { useState } from "react";
import {
  Text,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { colors, spacing } from "../theme";
import { PrimaryButton } from "../components/PrimaryButton";
import { addTask } from "../services/tasks";
import { useAuthStore } from "../store/useAuthStore";
import { MainTabParamList } from "../types/models";

type Props = {
  navigation: BottomTabNavigationProp<MainTabParamList, "AddTask">;
};

export default function AddTaskScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const [title, setTitle] = useState("");
  const [pointsText, setPointsText] = useState("");
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
      await addTask(user.homeId, title.trim(), points, user.id);
      setTitle("");
      setPointsText("");
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
      <Text style={styles.title}>Add Task</Text>
      <TextInput
        style={styles.input}
        placeholder="Task name"
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
});
