import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, shadow } from "../theme";
import { PrimaryButton } from "../components/PrimaryButton";
import { addTasksBatch } from "../services/tasks";
import { useAuthStore } from "../store/useAuthStore";

interface EditableTask {
  title: string;
  points: string;
  room: string;
  selected: boolean;
}

export default function SuggestedTasksScreen() {
  const user = useAuthStore((s) => s.user);
  const suggestedTasks = useAuthStore((s) => s.suggestedTasks);
  const setSuggestedTasks = useAuthStore((s) => s.setSuggestedTasks);

  const [tasks, setTasks] = useState<EditableTask[]>(() =>
    (suggestedTasks ?? []).map((t) => ({
      title: t.title,
      points: String(t.points),
      room: t.room,
      selected: true,
    }))
  );
  const [saving, setSaving] = useState(false);

  const selectedCount = tasks.filter((t) => t.selected).length;
  const allSelected = tasks.length > 0 && selectedCount === tasks.length;

  const toggleSelectAll = () => {
    setTasks((prev) => prev.map((t) => ({ ...t, selected: !allSelected })));
  };

  const toggleSelect = (index: number) => {
    setTasks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], selected: !next[index].selected };
      return next;
    });
  };

  const updateTask = (index: number, field: "title" | "points", value: string) => {
    setTasks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const deleteTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (!user?.homeId) return;
    const selected = tasks.filter((t) => t.selected && t.title.trim());
    if (selected.length === 0) {
      Alert.alert("No tasks selected", "Select at least one task to add.");
      return;
    }
    try {
      setSaving(true);
      const payload = selected.map((t) => ({
        title: t.title.trim(),
        points: Math.max(1, parseInt(t.points, 10) || 10),
      }));
      const count = await addTasksBatch(payload, user.homeId, user.id);
      setSuggestedTasks(null); // clears state → RootNavigator shows MainNavigator (Tasks tab)
      Alert.alert("Done!", `Added ${count} task${count !== 1 ? "s" : ""} to your home. 🎉`);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item, index }: { item: EditableTask; index: number }) => (
    <View style={[styles.card, !item.selected && styles.cardDimmed]}>
      <TouchableOpacity
        style={[styles.checkbox, item.selected && styles.checkboxSelected]}
        onPress={() => toggleSelect(index)}
        activeOpacity={0.8}
      >
        {item.selected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      <View style={styles.cardBody}>
        <TextInput
          style={styles.titleInput}
          value={item.title}
          onChangeText={(v) => updateTask(index, "title", v)}
          maxLength={80}
          placeholderTextColor={colors.muted}
        />
        <View style={styles.cardMeta}>
          <View style={styles.roomChip}>
            <Text style={styles.roomChipText}>{item.room}</Text>
          </View>
          <View style={styles.pointsRow}>
            <TextInput
              style={styles.pointsInput}
              value={item.points}
              onChangeText={(v) => updateTask(index, "points", v.replace(/[^0-9]/g, ""))}
              keyboardType="numeric"
              maxLength={3}
            />
            <Text style={styles.pointsLabel}>pts</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTask(index)} activeOpacity={0.8}>
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Review Tasks</Text>
          <Text style={styles.subtitle}>{tasks.length} suggestions for your home</Text>
        </View>
        <TouchableOpacity onPress={toggleSelectAll} activeOpacity={0.8}>
          <Text style={styles.selectAllText}>{allSelected ? "Deselect all" : "Select all"}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <PrimaryButton
          title={`Add ${selectedCount} Task${selectedCount !== 1 ? "s" : ""}`}
          onPress={handleConfirm}
          loading={saving}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    textDecorationLine: "underline",
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.sm,
    ...shadow,
  },
  cardDimmed: {
    opacity: 0.45,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  cardBody: {
    flex: 1,
    gap: spacing.xs,
  },
  titleInput: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    padding: 0,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  roomChip: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  roomChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  pointsInput: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    minWidth: 28,
    textAlign: "center",
    padding: 0,
  },
  pointsLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  deleteBtnText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: "700",
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
});
