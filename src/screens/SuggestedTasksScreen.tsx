import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SectionList,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { spacing, shadow } from "../theme";
import { useTheme } from "../hooks/useTheme";
import type { ColorPalette } from "../theme";
import { PrimaryButton } from "../components/PrimaryButton";
import { addTasksBatch } from "../services/tasks";
import { generateTasksForRoom } from "../services/ai";
import { useAuthStore } from "../store/useAuthStore";
import { useHomeMembers } from "../hooks/useHomeMembers";
import { AppStackParamList } from "../types/models";

const AVATAR_COLORS = ["#548BF8", "#FF6B6B", "#68D368", "#F97316", "#A855F7", "#EC4899"];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Props = NativeStackScreenProps<AppStackParamList, "SuggestedTasks">;

interface EditableTask {
  key: string;
  title: string;
  points: string;
  room: string;
  selected: boolean;
  assignedTo: string | null;
}

interface Section {
  room: string;
  data: EditableTask[];
}

export default function SuggestedTasksScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);
  const members = useHomeMembers(user?.homeId ?? null);

  const [tasks, setTasks] = useState<EditableTask[]>(() =>
    route.params.tasks.map((t, i) => ({
      key: `${t.room}-${i}`,
      title: t.title,
      points: String(t.points),
      room: t.room,
      selected: true,
      assignedTo: null,
    }))
  );

  const [roomOrder] = useState<string[]>(() => [
    ...new Set(route.params.tasks.map((t) => t.room)),
  ]);

  const [saving, setSaving] = useState(false);
  const [regeneratingRoom, setRegeneratingRoom] = useState<string | null>(null);

  const sections: Section[] = useMemo(() => {
    return roomOrder
      .map((room) => ({ room, data: tasks.filter((t) => t.room === room) }))
      .filter((s) => s.data.length > 0);
  }, [tasks, roomOrder]);

  const selectedCount = tasks.filter((t) => t.selected).length;
  const allSelected = tasks.length > 0 && selectedCount === tasks.length;

  const toggleSelectAll = () => {
    setTasks((prev) => prev.map((t) => ({ ...t, selected: !allSelected })));
  };

  const toggleSelect = (key: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.key === key ? { ...t, selected: !t.selected } : t))
    );
  };

  const setTaskAssignee = (key: string, userId: string | null) => {
    setTasks((prev) =>
      prev.map((t) => (t.key === key ? { ...t, assignedTo: userId } : t))
    );
  };

  const updateTask = (key: string, field: "title" | "points", value: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.key === key ? { ...t, [field]: value } : t))
    );
  };

  const deleteTask = (key: string) => {
    setTasks((prev) => prev.filter((t) => t.key !== key));
  };

  const regenerateRoom = async (room: string) => {
    if (!user?.homeId) return;
    setRegeneratingRoom(room);
    try {
      const newRawTasks = await generateTasksForRoom(user.homeId, room);
      const otherTitles = new Set(
        tasks.filter((t) => t.room !== room).map((t) => t.title.toLowerCase())
      );
      const filtered = newRawTasks
        .map((t) => ({ ...t, room }))
        .filter((t) => !otherTitles.has(t.title.toLowerCase()));
      const newEditable: EditableTask[] = filtered.map((t, i) => ({
        key: `${room}-regen-${Date.now()}-${i}`,
        title: t.title,
        points: String(t.points),
        room: t.room,
        selected: true,
        assignedTo: null,
      }));
      setTasks((prev) => {
        const prevAssignments = Object.fromEntries(
          prev.filter((t) => t.room === room).map((t) => [t.key, t.assignedTo])
        );
        return [
          ...prev.filter((t) => t.room !== room),
          ...newEditable.map((t, i) => ({
            ...t,
            assignedTo: prevAssignments[Object.keys(prevAssignments)[i]] ?? null,
          })),
        ];
      });
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setRegeneratingRoom(null);
    }
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
        room: t.room || null,
        assignedTo: t.assignedTo,
      }));
      const count = await addTasksBatch(payload, user.homeId, user.id);
      console.log(`[AI analytics] generated=${tasks.length} kept=${count} ratio=${tasks.length > 0 ? (count / tasks.length).toFixed(2) : "n/a"}`);
      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
      Alert.alert("Done!", `Added ${count} task${count !== 1 ? "s" : ""} to your home. 🎉`);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: EditableTask }) => (
    <View style={[styles.card, !item.selected && styles.cardDimmed]}>
      <TouchableOpacity
        style={[styles.checkbox, item.selected && styles.checkboxSelected]}
        onPress={() => toggleSelect(item.key)}
        activeOpacity={0.8}
      >
        {item.selected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      <View style={styles.cardBody}>
        <TextInput
          style={styles.titleInput}
          value={item.title}
          onChangeText={(v) => updateTask(item.key, "title", v)}
          maxLength={80}
          placeholderTextColor={colors.muted}
        />
        <View style={styles.pointsRow}>
          <TextInput
            style={styles.pointsInput}
            value={item.points}
            onChangeText={(v) => updateTask(item.key, "points", v.replace(/[^0-9]/g, ""))}
            keyboardType="numeric"
            maxLength={3}
          />
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
        {members.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.assignRow}>
              <TouchableOpacity
                style={[styles.assignChip, !item.assignedTo && styles.assignChipActive]}
                onPress={() => setTaskAssignee(item.key, null)}
                activeOpacity={0.8}
              >
                <Text style={[styles.assignChipText, !item.assignedTo && styles.assignChipTextActive]}>—</Text>
              </TouchableOpacity>
              {members.map((m, i) => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.assignChip,
                    { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] },
                    item.assignedTo === m.id && styles.assignChipActive,
                  ]}
                  onPress={() => setTaskAssignee(item.key, m.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.assignChipText, styles.assignChipTextColored]}>
                    {getInitials(m.name)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => deleteTask(item.key)}
        activeOpacity={0.8}
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.room}</Text>
      <TouchableOpacity
        style={styles.regenBtn}
        onPress={() => regenerateRoom(section.room)}
        disabled={regeneratingRoom !== null}
        activeOpacity={0.7}
      >
        {regeneratingRoom === section.room ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text
            style={[
              styles.regenBtnText,
              regeneratingRoom !== null && styles.regenBtnTextDisabled,
            ]}
          >
            ↺ Re-roll
          </Text>
        )}
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
          <Text style={styles.selectAllText}>
            {allSelected ? "Deselect all" : "Select all"}
          </Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
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

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
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
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: spacing.lg,
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
    regenBtn: {
      minWidth: 60,
      alignItems: "center",
      paddingVertical: 4,
      paddingHorizontal: spacing.sm,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    regenBtnText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
    regenBtnTextDisabled: {
      color: colors.muted,
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
      marginBottom: spacing.sm,
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
    assignRow: {
      flexDirection: "row",
      gap: 5,
      marginTop: 4,
    },
    assignChip: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
    },
    assignChipActive: {
      borderWidth: 3,
      borderColor: colors.border,
    },
    assignChipText: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.muted,
    },
    assignChipTextActive: {
      color: colors.text,
    },
    assignChipTextColored: {
      color: "#fff",
    },
  });
}
