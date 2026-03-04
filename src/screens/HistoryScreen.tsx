import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, shadow } from "../theme";
import { fetchCompletedTasks } from "../services/tasks";
import { useAuthStore } from "../store/useAuthStore";
import { CompletedTask } from "../types/models";

const FREQUENCY_LABEL: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  once: "",
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function HistoryScreen() {
  const user = useAuthStore((s) => s.user);
  const [tasks, setTasks] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.homeId) return;
    void (async () => {
      try {
        const data = await fetchCompletedTasks(user.homeId!);
        setTasks(data);
      } catch (error) {
        Alert.alert(
          "Error",
          error instanceof Error ? error.message : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.homeId]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>History 📋</Text>
      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.border}
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.titleRow}>
                  <Text style={styles.taskTitle}>{item.title}</Text>
                  {item.frequency !== "once" && (
                    <View style={styles.frequencyBadge}>
                      <Text style={styles.frequencyText}>
                        {FREQUENCY_LABEL[item.frequency]}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.meta}>
                  {item.completerName ?? "Someone"} · {formatDate(item.completedAt)}
                </Text>
              </View>
              <View style={styles.pointsPill}>
                <Text style={styles.points}>+{item.points}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🫧</Text>
              <Text style={styles.emptyText}>No completed tasks yet.</Text>
            </View>
          }
          contentContainerStyle={
            tasks.length === 0 ? styles.emptyContainer : styles.list
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    marginBottom: spacing.lg,
  },
  loader: {
    marginTop: spacing.xl,
  },
  list: {
    paddingBottom: spacing.lg,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow,
  },
  cardLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
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
  meta: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  pointsPill: {
    backgroundColor: colors.success,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  points: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },
  empty: {
    alignItems: "center",
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
});
