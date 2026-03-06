import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  SectionList,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing, shadow } from "../theme";
import { TaskCard } from "../components/TaskCard";
import { useTasks } from "../hooks/useTasks";
import { completeTask, fetchCompletedTasks } from "../services/tasks";
import { signOut } from "../services/auth";
import { useAuthStore } from "../store/useAuthStore";
import { useTasksStore, SortMode } from "../store/useTasksStore";
import { useNotifications } from "../hooks/useNotifications";
import { useGenerateTasks } from "../hooks/useGenerateTasks";
import { Task, CompletedTask, AppStackParamList } from "../types/models";

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

const SORT_MODES: { mode: SortMode; label: string }[] = [
  { mode: "newest", label: "Newest" },
  { mode: "oldest", label: "Oldest" },
  { mode: "az", label: "A–Z" },
  { mode: "za", label: "Z–A" },
];

interface Section {
  title: string;
  data: Task[];
  totalCount: number; // count even when collapsed
}

function isOverdue(task: Task): boolean {
  if (!task.dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.dueDate + "T00:00:00") < today;
}

function sortTasks(tasks: Task[], mode: SortMode): Task[] {
  const overdue = tasks
    .filter(isOverdue)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
  const rest = tasks.filter((t) => !isOverdue(t)).sort((a, b) => {
    switch (mode) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "az":
        return a.title.localeCompare(b.title);
      case "za":
        return b.title.localeCompare(a.title);
    }
  });
  return [...overdue, ...rest];
}

export default function TasksScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { tasks, loading } = useTasks(user?.homeId ?? null);
  const { sortMode, setSortMode } = useTasksStore();
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [collapsedRooms, setCollapsedRooms] = useState<Set<string>>(new Set());
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [tabMode, setTabMode] = useState<"open" | "completed">("open");
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { notifyTaskComplete } = useNotifications();
  const { triggerGeneration, generating } = useGenerateTasks();

  useEffect(() => {
    if (tabMode !== "completed" || !user?.homeId) return;
    setHistoryLoading(true);
    void (async () => {
      try {
        const data = await fetchCompletedTasks(user.homeId!);
        setCompletedTasks(data);
      } catch (error) {
        Alert.alert(
          "Error",
          error instanceof Error ? error.message : "Something went wrong"
        );
      } finally {
        setHistoryLoading(false);
      }
    })();
  }, [tabMode, user?.homeId]);

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
      const taskTitle = tasks.find((t) => t.id === taskId)?.title ?? "Task";
      await completeTask(taskId, user.id, points);
      setUser({ ...user, points: user.points + points });
      void notifyTaskComplete(taskTitle, points);
    } catch (error) {
      Alert.alert(
        "Oops",
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setCompletingId(null);
    }
  };

  const cycleSortMode = useCallback(() => {
    const idx = SORT_MODES.findIndex((s) => s.mode === sortMode);
    setSortMode(SORT_MODES[(idx + 1) % SORT_MODES.length].mode);
  }, [sortMode, setSortMode]);

  const toggleCollapse = useCallback((room: string) => {
    setCollapsedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(room)) {
        next.delete(room);
      } else {
        next.add(room);
      }
      return next;
    });
  }, []);

  const visibleTasks = useMemo(
    () => (myTasksOnly ? tasks.filter((t) => t.assignedTo === user?.id) : tasks),
    [tasks, myTasksOnly, user?.id]
  );

  const sections: Section[] = useMemo(() => {
    const roomMap = new Map<string, Task[]>();
    const others: Task[] = [];

    // Group first (unsorted) to get stable room set
    for (const task of visibleTasks) {
      if (!task.room) {
        others.push(task);
      } else {
        if (!roomMap.has(task.room)) roomMap.set(task.room, []);
        roomMap.get(task.room)!.push(task);
      }
    }

    // Rooms are always alphabetical; "Other" always last
    const sortedRooms = [...roomMap.keys()].sort((a, b) => a.localeCompare(b));

    const result: Section[] = sortedRooms.map((room) => {
      const roomTasks = sortTasks(roomMap.get(room)!, sortMode);
      return {
        title: room,
        totalCount: roomTasks.length,
        data: collapsedRooms.has(room) ? [] : roomTasks,
      };
    });

    if (others.length > 0) {
      const sortedOthers = sortTasks(others, sortMode);
      result.push({
        title: "Other",
        totalCount: sortedOthers.length,
        data: collapsedRooms.has("Other") ? [] : sortedOthers,
      });
    }

    return result;
  }, [visibleTasks, sortMode, collapsedRooms]);

  const currentSortLabel = SORT_MODES.find((s) => s.mode === sortMode)?.label ?? "";

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tasks ✏️</Text>
          {user && <Text style={styles.subtitle}>hey, {user.name}!</Text>}
        </View>
        <View style={styles.headerRight}>
          <View style={styles.badgeRow}>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsBadgeText}>⭐ {user?.points ?? 0}</Text>
            </View>
            {(user?.streak ?? 0) > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.pointsBadgeText}>🔥 {user?.streak}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segment, tabMode === "open" && styles.segmentActive]}
          onPress={() => setTabMode("open")}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, tabMode === "open" && styles.segmentTextActive]}>
            Open
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, tabMode === "completed" && styles.segmentActive]}
          onPress={() => setTabMode("completed")}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, tabMode === "completed" && styles.segmentTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {tabMode === "open" ? (
        <>
          {tasks.length > 0 && (
            <View style={styles.sortRow}>
              <TouchableOpacity
                style={[styles.filterBtn, myTasksOnly && styles.filterBtnActive]}
                onPress={() => setMyTasksOnly((v) => !v)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterBtnText, myTasksOnly && styles.filterBtnTextActive]}>
                  👤 My Tasks
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sortBtn} onPress={cycleSortMode} activeOpacity={0.8}>
                <Text style={styles.sortBtnIcon}>↕</Text>
                <Text style={styles.sortBtnLabel}>{currentSortLabel}</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading ? (
            <ActivityIndicator size="large" color={colors.border} style={styles.loader} />
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TaskCard
                  task={item}
                  onComplete={handleComplete}
                  onPress={() => navigation.navigate("EditTask", { task: item })}
                  loading={completingId === item.id}
                />
              )}
              renderSectionHeader={({ section }) => (
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleCollapse(section.title)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <View style={styles.sectionMeta}>
                    <Text style={styles.sectionCount}>{section.totalCount}</Text>
                    <Text style={styles.sectionChevron}>
                      {collapsedRooms.has(section.title) ? "▸" : "▾"}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyEmoji}>🫧</Text>
                  <Text style={styles.emptyText}>No open tasks!</Text>
                  <Text style={styles.emptySubtext}>
                    Add one from the Add Task tab.
                  </Text>
                  <TouchableOpacity
                    style={styles.suggestBtn}
                    onPress={triggerGeneration}
                    disabled={generating}
                    activeOpacity={0.8}
                  >
                    {generating ? (
                      <ActivityIndicator size="small" color={colors.surface} />
                    ) : (
                      <Text style={styles.suggestBtnText}>✨  Suggest tasks</Text>
                    )}
                  </TouchableOpacity>
                </View>
              }
              contentContainerStyle={
                visibleTasks.length === 0 ? styles.emptyContainer : styles.list
              }
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={true}
            />
          )}
        </>
      ) : historyLoading ? (
        <ActivityIndicator size="large" color={colors.border} style={styles.loader} />
      ) : (
        <FlatList
          data={completedTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.hCard}>
              <View style={styles.hCardLeft}>
                <View style={styles.hTitleRow}>
                  <Text style={styles.hTaskTitle}>{item.title}</Text>
                  {item.frequency !== "once" && (
                    <View style={styles.hFreqBadge}>
                      <Text style={styles.hFreqText}>
                        {FREQUENCY_LABEL[item.frequency]}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.hMeta}>
                  {item.completerName ?? "Someone"} · {formatDate(item.completedAt)}
                </Text>
              </View>
              <View style={styles.hPointsPill}>
                <Text style={styles.hPoints}>+{item.points}</Text>
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
            completedTasks.length === 0 ? styles.emptyContainer : styles.list
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
    paddingHorizontal: spacing.lg,
    paddingTop: 2,
    paddingBottom: 0,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
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
  badgeRow: {
    flexDirection: "row",
    gap: 6,
  },
  streakBadge: {
    backgroundColor: "#FFD580",
    borderWidth: 2.5,
    borderColor: colors.border,
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 5,
    ...shadow,
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
  sortRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    ...shadow,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  filterBtnTextActive: {
    color: "#fff",
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    ...shadow,
  },
  sortBtnIcon: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },
  sortBtnLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  loader: {
    marginTop: spacing.xl,
  },
  list: {
    paddingBottom: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    opacity: 0.5,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
  },
  sectionChevron: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: "700",
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
  suggestBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    minWidth: 160,
    alignItems: "center",
  },
  suggestBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderWidth: 2.5,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  segmentTextActive: {
    color: "#fff",
  },
  hCard: {
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
  hCardLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  hTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  hTaskTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  hFreqBadge: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  hFreqText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
  },
  hMeta: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  hPointsPill: {
    backgroundColor: colors.success,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  hPoints: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },
});
