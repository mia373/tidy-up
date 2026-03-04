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
        <View style={styles.pointsBadge}>
          <Text style={styles.points}>+{task.points} pts</Text>
        </View>
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
    borderRadius: 16,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    shadowColor: "#E88FAB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
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
  pointsBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF0F5",
    borderRadius: 50,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  points: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
});
