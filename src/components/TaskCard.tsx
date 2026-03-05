import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Task } from "../types/models";
import { PrimaryButton } from "./PrimaryButton";
import { colors, spacing, shadow } from "../theme";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
        <View style={styles.badgeRow}>
          <View style={styles.pointsBadge}>
            <Text style={styles.points}>+{task.points} pts</Text>
          </View>
          {task.assigneeName && (
            <View style={styles.assigneeBadge}>
              <Text style={styles.assigneeInitials}>
                {getInitials(task.assigneeName)}
              </Text>
            </View>
          )}
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
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  assigneeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  assigneeInitials: {
    fontSize: 9,
    fontWeight: "900",
    color: "#fff",
  },
});
