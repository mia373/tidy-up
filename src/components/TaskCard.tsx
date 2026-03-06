import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Task } from "../types/models";
import { PrimaryButton } from "./PrimaryButton";
import { spacing, shadow } from "../theme";
import { useTheme } from "../hooks/useTheme";
import type { ColorPalette } from "../theme";

const FREQUENCY_LABEL: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  once: "",
};

function getDueDateInfo(
  dueDate: string,
  colors: ColorPalette
): { label: string; color: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) return { label: "Overdue", color: colors.error };
  if (diffDays === 0) return { label: "Due today", color: "#F59E0B" };
  if (diffDays === 1) return { label: "Due tomorrow", color: "#D97706" };
  return {
    label: `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    color: colors.muted,
  };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string, points: number) => void;
  onPress?: () => void;
  loading?: boolean;
}

export function TaskCard({ task, onComplete, onPress, loading }: TaskCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const dueDateInfo = task.dueDate ? getDueDateInfo(task.dueDate, colors) : null;

  return (
    <TouchableOpacity
      style={[styles.card, dueDateInfo?.label === "Overdue" && styles.cardOverdue]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.info}>
        <Text style={styles.title}>{task.title}</Text>
        {dueDateInfo && (
          <Text style={[styles.dueLabel, { color: dueDateInfo.color }]}>
            {dueDateInfo.label}
          </Text>
        )}
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
          {task.frequency !== "once" && (
            <View style={styles.frequencyBadge}>
              <Text style={styles.frequencyText}>
                {FREQUENCY_LABEL[task.frequency]}
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
    </TouchableOpacity>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
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
    frequencyBadge: {
      backgroundColor: colors.primary,
      borderRadius: 50,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    frequencyText: {
      fontSize: 10,
      fontWeight: "800",
      color: "#fff",
    },
    cardOverdue: {
      borderColor: colors.error,
    },
    dueLabel: {
      fontSize: 11,
      fontWeight: "700",
      marginBottom: 4,
    },
  });
}
