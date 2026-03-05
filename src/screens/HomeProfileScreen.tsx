import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, spacing, shadow } from "../theme";
import { PrimaryButton } from "../components/PrimaryButton";
import { updateHomeProfile, fetchHome } from "../services/homes";
import { generateTasks } from "../services/ai";
import { useAuthStore } from "../store/useAuthStore";
import { AppStackParamList, HomeType } from "../types/models";

type Props = NativeStackScreenProps<AppStackParamList, "HomeProfile">;

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

export default function HomeProfileScreen({ navigation, route }: Props) {
  const user = useAuthStore((s) => s.user);
  const isEditMode = route.params?.mode === "edit";

  const [homeName, setHomeName] = useState("");
  const [homeType, setHomeType] = useState<HomeType | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [customRoom, setCustomRoom] = useState("");
  const [hasPets, setHasPets] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(isEditMode);

  // In edit mode, pre-fill the form with the current home profile from the DB.
  useEffect(() => {
    if (!isEditMode || !user?.homeId) return;
    fetchHome(user.homeId)
      .then((home) => {
        setHomeName(home.name);
        setHomeType(home.homeType);
        setSelectedRooms(home.rooms);
        setHasPets(home.hasPets);
      })
      .catch(() => {
        Alert.alert("Error", "Failed to load home profile.");
      })
      .finally(() => setLoadingProfile(false));
  }, [isEditMode, user?.homeId]);

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
    if (isEditMode && !homeName.trim()) {
      Alert.alert("Error", "Home name cannot be empty.");
      return;
    }
    try {
      setGenerating(true);
      await updateHomeProfile(user.homeId, {
        homeType,
        rooms: selectedRooms,
        hasPets,
        ...(isEditMode ? { name: homeName.trim() } : {}),
      });
      if (isEditMode) {
        Alert.alert("Saved!", "Your home profile has been updated.");
        navigation.goBack();
      } else {
        const tasks = await generateTasks(user.homeId);
        navigation.replace("SuggestedTasks", { tasks });
      }
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  // All chips: defaults + any custom rooms not in defaults
  const allRooms = [
    ...DEFAULT_ROOMS,
    ...selectedRooms.filter((r) => !DEFAULT_ROOMS.includes(r)),
  ];

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (generating && !isEditMode) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Thinking about your chores... ✨</Text>
        <Text style={styles.loadingSubtext}>This takes a few seconds</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>
          {isEditMode ? "Edit home profile" : "Tell us about your home"}
        </Text>
        <Text style={styles.subtitle}>
          {isEditMode
            ? "Update your home details. Changes apply to future task generation."
            : "We'll use this to suggest the right chores for you."}
        </Text>

        {/* Home name — edit mode only */}
        {isEditMode && (
          <>
            <Text style={styles.sectionLabel}>Home name</Text>
            <TextInput
              style={styles.nameInput}
              value={homeName}
              onChangeText={setHomeName}
              placeholder="e.g. The Smith House"
              placeholderTextColor={colors.muted}
              maxLength={40}
            />
          </>
        )}

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
          <PrimaryButton
            title={isEditMode ? "Save Changes" : "✨  Generate Tasks"}
            onPress={handleSave}
            loading={generating}
          />
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
  nameInput: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.lg,
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
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.muted,
  },
});
