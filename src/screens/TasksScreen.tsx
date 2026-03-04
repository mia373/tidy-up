import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, shadow } from "../theme";
import { TaskCard } from "../components/TaskCard";
import { useTasks } from "../hooks/useTasks";
import { completeTask } from "../services/tasks";
import { signOut } from "../services/auth";
import { useAuthStore } from "../store/useAuthStore";

export default function TasksScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { tasks, loading } = useTasks(user?.homeId ?? null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  };

  const handleComplete = async (taskId: string, points: number) => {
    if (!user) return;
    try {
      setCompletingId(taskId);
      await completeTask(taskId, user.id, points);
      setUser({ ...user, points: user.points + points });
    } catch (error) {
      Alert.alert(
        "Oops",
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tasks ✏️</Text>
          {user && (
            <Text style={styles.subtitle}>hey, {user.name}!</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsBadgeText}>⭐ {user?.points ?? 0}</Text>
          </View>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

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
            <TaskCard
              task={item}
              onComplete={handleComplete}
              loading={completingId === item.id}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🫧</Text>
              <Text style={styles.emptyText}>No open tasks!</Text>
              <Text style={styles.emptySubtext}>
                Add one from the Add Task tab.
              </Text>
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
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    opacity: 0.6,
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  pointsBadge: {
    backgroundColor: colors.accent,
    borderWidth: 2.5,
    borderColor: colors.border,
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 5,
    ...shadow,
  },
  pointsBadgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  signOutBtn: {
    paddingHorizontal: 2,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    opacity: 0.45,
    textDecorationLine: "underline",
  },
  loader: {
    marginTop: spacing.xl,
  },
  list: {
    paddingBottom: spacing.lg,
  },
  empty: {
    alignItems: "center",
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    opacity: 0.55,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
});
