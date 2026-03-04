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
import { colors, spacing } from "../theme";
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
        <Text style={styles.title}>Tasks</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signOut}>Sign out</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
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
              <Text style={styles.emptyText}>No open tasks.</Text>
              <Text style={styles.emptySubtext}>
                Add a task using the Add Task tab.
              </Text>
            </View>
          }
          contentContainerStyle={tasks.length === 0 ? styles.emptyContainer : undefined}
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
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  signOut: {
    fontSize: 14,
    color: colors.muted,
  },
  loader: {
    marginTop: spacing.xl,
  },
  empty: {
    alignItems: "center",
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.muted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
});
