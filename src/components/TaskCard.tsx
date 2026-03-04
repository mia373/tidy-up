import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Task } from "../types/models";
import { PrimaryButton } from "./PrimaryButton";
import { colors, spacing } from "../theme";

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
        <Text style={styles.points}>+{task.points} pts</Text>
      </View>
      <PrimaryButton
        title="Done"
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
    borderRadius: 12,
    marginBottom: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  points: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
  },
});
