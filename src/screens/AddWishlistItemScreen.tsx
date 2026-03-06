import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { spacing, shadow } from "../theme";
import { useTheme } from "../hooks/useTheme";
import type { ColorPalette } from "../theme";
import { PrimaryButton } from "../components/PrimaryButton";
import { addWishlistItem } from "../services/wishlist";
import { useAuthStore } from "../store/useAuthStore";
import { AppStackParamList } from "../types/models";

const MAX_DESC_LENGTH = 200;

export default function AddWishlistItemScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    const trimmedTitle = title.trim();
    const parsedCost = parseInt(cost, 10);

    if (!trimmedTitle) {
      Alert.alert("Error", "Title is required.");
      return;
    }
    if (!cost || isNaN(parsedCost) || parsedCost < 1 || parsedCost > 9999) {
      Alert.alert("Error", "Point cost must be between 1 and 9999.");
      return;
    }
    if (description.length > MAX_DESC_LENGTH) {
      Alert.alert("Error", `Description must be ${MAX_DESC_LENGTH} characters or less.`);
      return;
    }
    if (!user?.homeId) return;

    try {
      setLoading(true);
      await addWishlistItem(
        user.homeId,
        trimmedTitle,
        description.trim() || null,
        parsedCost,
        user.id
      );
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Add Reward 🎁</Text>
          </View>

          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Movie night, Pizza night…"
            placeholderTextColor={colors.muted}
            maxLength={80}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional details…"
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
            maxLength={MAX_DESC_LENGTH}
          />
          <Text style={styles.charCount}>
            {description.length}/{MAX_DESC_LENGTH}
          </Text>

          <Text style={styles.label}>Point Cost *</Text>
          <TextInput
            style={styles.input}
            value={cost}
            onChangeText={(v) => setCost(v.replace(/[^0-9]/g, ""))}
            placeholder="e.g. 50"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            maxLength={4}
          />
          <Text style={styles.hint}>Between 1 and 9999 pts</Text>

          <View style={styles.submitRow}>
            <PrimaryButton
              title="Add to Wishlist"
              onPress={handleAdd}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.xl,
      gap: spacing.md,
    },
    backBtn: {
      backgroundColor: colors.surface,
      borderRadius: 50,
      borderWidth: 2.5,
      borderColor: colors.border,
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      ...shadow,
    },
    backBtnText: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
    },
    title: {
      fontSize: 28,
      fontWeight: "900",
      color: colors.text,
      letterSpacing: -0.5,
    },
    label: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.text,
      opacity: 0.5,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: spacing.sm,
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
      marginBottom: spacing.sm,
      ...shadow,
    },
    inputMultiline: {
      height: 90,
      textAlignVertical: "top",
      borderRadius: 16,
    },
    charCount: {
      fontSize: 12,
      color: colors.muted,
      textAlign: "right",
      marginBottom: spacing.md,
      marginTop: -4,
    },
    hint: {
      fontSize: 12,
      color: colors.muted,
      marginBottom: spacing.lg,
      marginTop: -4,
    },
    submitRow: {
      marginTop: spacing.sm,
    },
  });
}
