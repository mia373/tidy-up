import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Task } from "../types/models";
import { PrimaryButton } from "./PrimaryButton";
import { colors, spacing, shadow } from "../theme";

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string, points: number) => void;
  loading?: boolean;
}

export function TaskCard({ task, onComplete, loading }: TaskCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.title}>{task.title}</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.points}>+{task.points} pts</Text>
        </View>
      </View>
      <PrimaryButton
        title="Done ✓"
        onPress={() => onComplete(task.id, task.points)}
        loading={loading}
        small
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadow,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  pointsBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  points: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "800",
  },
});
