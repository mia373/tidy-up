import React, { useState, useMemo } from "react";
import {
  Text,
  TextInput,
  StyleSheet,
  Alert,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { spacing, shadow } from "../theme";
import { useTheme } from "../hooks/useTheme";
import type { ColorPalette } from "../theme";
import { PrimaryButton } from "../components/PrimaryButton";
import { updateTask, deleteTask } from "../services/tasks";
import { useAuthStore } from "../store/useAuthStore";
import { useHomeMembers } from "../hooks/useHomeMembers";
import { AppStackParamList } from "../types/models";

const AVATAR_COLORS = ["#548BF8", "#FF6B6B", "#68D368", "#F97316", "#A855F7", "#EC4899"];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Frequency = "once" | "daily" | "weekly";

const FREQUENCIES: { value: Frequency; label: string; emoji: string }[] = [
  { value: "once", label: "Once", emoji: "1\uFE0F\u20E3" },
  { value: "daily", label: "Daily", emoji: "\uD83D\uDD01" },
  { value: "weekly", label: "Weekly", emoji: "\uD83D\uDCC5" },
];

type Props = NativeStackScreenProps<AppStackParamList, "EditTask">;

export default function EditTaskScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { task } = route.params;
  const user = useAuthStore((s) => s.user);
  const members = useHomeMembers(user?.homeId ?? null);
  const [title, setTitle] = useState(task.title);
  const [pointsText, setPointsText] = useState(String(task.points));
  const [room, setRoom] = useState(task.room ?? "");
  const [frequency, setFrequency] = useState<Frequency>(task.frequency);
  const [assignedTo, setAssignedTo] = useState<string | null>(task.assignedTo);
  const [dueDate, setDueDate] = useState<Date | null>(
    task.dueDate ? new Date(task.dueDate + "T00:00:00") : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a task name.");
      return;
    }
    const points = parseInt(pointsText, 10);
    if (!pointsText || isNaN(points) || points <= 0) {
      Alert.alert("Error", "Please enter a valid points value greater than 0.");
      return;
    }
    try {
      setLoading(true);
      const dueDateStr = dueDate
        ? `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}-${String(dueDate.getDate()).padStart(2, "0")}`
        : null;
      await updateTask(task.id, {
        title: title.trim(),
        points,
        frequency,
        room: room.trim() || null,
        assignedTo,
        dueDate: dueDateStr,
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Task", `Are you sure you want to delete "${task.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeleting(true);
            await deleteTask(task.id);
            navigation.goBack();
          } catch (error) {
            Alert.alert(
              "Error",
              error instanceof Error ? error.message : "Something went wrong"
            );
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Edit Task</Text>

        <TextInput
          style={styles.input}
          placeholder="What needs doing?"
          placeholderTextColor={colors.muted}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Points (e.g. 10)"
          placeholderTextColor={colors.muted}
          value={pointsText}
          onChangeText={setPointsText}
          keyboardType="number-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Room (optional)"
          placeholderTextColor={colors.muted}
          value={room}
          onChangeText={setRoom}
          maxLength={40}
        />

        <Text style={styles.freqLabel}>Due date</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowDatePicker((v) => !v)}
            activeOpacity={0.8}
          >
            <Text style={styles.dateBtnText}>
              {dueDate
                ? dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "No due date"}
            </Text>
          </TouchableOpacity>
          {dueDate && (
            <TouchableOpacity onPress={() => { setDueDate(null); setShowDatePicker(false); }}>
              <Text style={styles.dateClear}>✕ Clear</Text>
            </TouchableOpacity>
          )}
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={dueDate ?? new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={new Date()}
            onChange={(event: DateTimePickerEvent, selected?: Date) => {
              if (Platform.OS === "android") setShowDatePicker(false);
              if (event.type !== "dismissed" && selected) setDueDate(selected);
            }}
          />
        )}
        {showDatePicker && Platform.OS === "ios" && (
          <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.dateDoneBtn}>
            <Text style={styles.dateDoneBtnText}>Done</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.freqLabel}>Repeats</Text>
        <View style={styles.freqRow}>
          {FREQUENCIES.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[
                styles.freqBtn,
                frequency === f.value && styles.freqBtnActive,
              ]}
              onPress={() => setFrequency(f.value)}
              activeOpacity={0.8}
            >
              <Text style={styles.freqEmoji}>{f.emoji}</Text>
              <Text
                style={[
                  styles.freqText,
                  frequency === f.value && styles.freqTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {members.length > 0 && (
          <>
            <Text style={styles.freqLabel}>Assign to</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.memberScroll}
            >
              <View style={styles.memberRow}>
                <TouchableOpacity
                  style={styles.memberChip}
                  onPress={() => setAssignedTo(null)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.memberAvatar,
                      styles.memberAvatarUnassigned,
                      !assignedTo && styles.memberAvatarSelected,
                    ]}
                  >
                    <Text style={styles.memberInitialsUnassigned}>—</Text>
                  </View>
                  <Text style={styles.memberChipName}>No one</Text>
                </TouchableOpacity>
                {members.map((m, i) => (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.memberChip}
                    onPress={() => setAssignedTo(m.id)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.memberAvatar,
                        { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] },
                        assignedTo === m.id && styles.memberAvatarSelected,
                      ]}
                    >
                      <Text style={styles.memberInitials}>{getInitials(m.name)}</Text>
                    </View>
                    <Text style={styles.memberChipName}>{m.name.split(" ")[0]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        <PrimaryButton title="Save Changes" onPress={handleSave} loading={loading} />

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
          disabled={deleting}
          activeOpacity={0.8}
        >
          <Text style={styles.deleteBtnText}>
            {deleting ? "Deleting..." : "Delete Task"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
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
      marginBottom: spacing.xl,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 3,
      borderColor: colors.border,
      borderRadius: 20,
      padding: spacing.md,
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: spacing.md,
      ...shadow,
    },
    freqLabel: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.text,
      opacity: 0.5,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: spacing.sm,
    },
    freqRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    freqBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 3,
      borderColor: colors.border,
      borderRadius: 16,
      ...shadow,
    },
    freqBtnActive: {
      backgroundColor: colors.accent,
    },
    freqEmoji: {
      fontSize: 20,
      marginBottom: 4,
    },
    freqText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
      opacity: 0.6,
    },
    freqTextActive: {
      opacity: 1,
    },
    memberScroll: {
      marginBottom: spacing.lg,
    },
    memberRow: {
      flexDirection: "row",
      gap: spacing.md,
      paddingBottom: 4,
    },
    memberChip: {
      alignItems: "center",
      gap: 4,
    },
    memberAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 3,
      borderColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    memberAvatarUnassigned: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    memberAvatarSelected: {
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 3, height: 3 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 4,
    },
    memberInitials: {
      fontSize: 15,
      fontWeight: "900",
      color: "#fff",
    },
    memberInitialsUnassigned: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.muted,
    },
    memberChipName: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.text,
      opacity: 0.7,
    },
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    dateBtn: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 3,
      borderColor: colors.border,
      borderRadius: 20,
      padding: spacing.md,
      ...shadow,
    },
    dateBtnText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    dateClear: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.muted,
    },
    dateDoneBtn: {
      alignSelf: "flex-end",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      marginBottom: spacing.sm,
    },
    dateDoneBtnText: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.primary,
    },
    deleteBtn: {
      alignItems: "center",
      marginTop: spacing.md,
      marginBottom: spacing.xl,
      paddingVertical: spacing.sm,
    },
    deleteBtnText: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.error,
    },
  });
}
