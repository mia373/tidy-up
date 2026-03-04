import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, shadow } from "../theme";
import { PrimaryButton } from "../components/PrimaryButton";
import { updateHomeProfile } from "../services/homes";
import { useAuthStore } from "../store/useAuthStore";
import { HomeType } from "../types/models";

const HOME_TYPES: { label: string; value: HomeType; icon: string }[] = [
  { label: "Apartment", value: "apartment", icon: "🏢" },
  { label: "House", value: "house", icon: "🏠" },
  { label: "Dorm", value: "dorm", icon: "🏫" },
  { label: "Studio", value: "studio", icon: "🛋️" },
];

const DEFAULT_ROOMS = [
  "Kitchen",
  "Bathroom",
  "Bedroom",
  "Living Room",
  "Garage",
  "Laundry",
  "Dining Room",
  "Office",
];

export default function HomeProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const setNeedsHomeProfile = useAuthStore((s) => s.setNeedsHomeProfile);

  const [homeType, setHomeType] = useState<HomeType | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [customRoom, setCustomRoom] = useState("");
  const [hasPets, setHasPets] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleRoom = (room: string) => {
    setSelectedRooms((prev) =>
      prev.includes(room) ? prev.filter((r) => r !== room) : [...prev, room]
    );
  };

  const addCustomRoom = () => {
    const trimmed = customRoom.trim();
    if (!trimmed || selectedRooms.includes(trimmed)) {
      setCustomRoom("");
      return;
    }
    setSelectedRooms((prev) => [...prev, trimmed]);
    setCustomRoom("");
  };

  const handleSave = async () => {
    if (!user?.homeId) return;
    try {
      setSaving(true);
      await updateHomeProfile(user.homeId, { homeType, rooms: selectedRooms, hasPets });
      // Phase 9.3+ will navigate to generation here; for now go straight to main tabs
      setNeedsHomeProfile(false);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // All chips: defaults + any custom rooms not in defaults
  const allRooms = [
    ...DEFAULT_ROOMS,
    ...selectedRooms.filter((r) => !DEFAULT_ROOMS.includes(r)),
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Tell us about your home</Text>
        <Text style={styles.subtitle}>
          We'll use this to suggest the right chores for you.
        </Text>

        {/* Home type */}
        <Text style={styles.sectionLabel}>Home type</Text>
        <View style={styles.typeGrid}>
          {HOME_TYPES.map(({ label, value, icon }) => (
            <TouchableOpacity
              key={value}
              style={[styles.typeCard, homeType === value && styles.typeCardSelected]}
              onPress={() => setHomeType(value)}
              activeOpacity={0.8}
            >
              <Text style={styles.typeIcon}>{icon}</Text>
              <Text style={[styles.typeLabel, homeType === value && styles.typeLabelSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rooms */}
        <Text style={styles.sectionLabel}>Rooms</Text>
        <View style={styles.chipWrap}>
          {allRooms.map((room) => {
            const selected = selectedRooms.includes(room);
            return (
              <TouchableOpacity
                key={room}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => toggleRoom(room)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {room}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.customRoomRow}>
          <TextInput
            style={styles.customRoomInput}
            placeholder="Add a room…"
            placeholderTextColor={colors.muted}
            value={customRoom}
            onChangeText={setCustomRoom}
            onSubmitEditing={addCustomRoom}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addRoomBtn} onPress={addCustomRoom} activeOpacity={0.8}>
            <Text style={styles.addRoomBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Pets */}
        <Text style={styles.sectionLabel}>Do you have pets?</Text>
        <View style={styles.petsRow}>
          <TouchableOpacity
            style={[styles.petsBtn, hasPets && styles.petsBtnSelected]}
            onPress={() => setHasPets(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.petsBtnText, hasPets && styles.petsBtnTextSelected]}>
              🐾  Yes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.petsBtn, !hasPets && styles.petsBtnSelected]}
            onPress={() => setHasPets(false)}
            activeOpacity={0.8}
          >
            <Text style={[styles.petsBtnText, !hasPets && styles.petsBtnTextSelected]}>
              No
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cta}>
          <PrimaryButton title="✨  Generate Tasks" onPress={handleSave} loading={saving} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  typeCard: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: "center",
    ...shadow,
  },
  typeCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.text,
  },
  typeIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  typeLabelSelected: {
    color: "#fff",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  chipTextSelected: {
    color: "#fff",
  },
  customRoomRow: {
    flexDirection: "row",
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  customRoomInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  addRoomBtn: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  addRoomBtnText: {
    fontWeight: "700",
    color: colors.text,
    fontSize: 14,
  },
  petsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  petsBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    ...shadow,
  },
  petsBtnSelected: {
    backgroundColor: colors.primary,
  },
  petsBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  petsBtnTextSelected: {
    color: "#fff",
  },
  cta: {
    marginTop: spacing.xl,
  },
});
