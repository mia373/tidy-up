import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, shadow } from "../theme";
import { subscribeToLeaderboard } from "../services/leaderboard";
import { useAuthStore } from "../store/useAuthStore";
import { AppUser } from "../types/models";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardScreen() {
  const user = useAuthStore((s) => s.user);
  const [members, setMembers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.homeId) return;

    const unsubscribe = subscribeToLeaderboard(user.homeId, (result) => {
      setMembers(result);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.homeId]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Leaderboard ✨</Text>
      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.border}
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.row,
                item.id === user?.id && styles.rowHighlight,
                index === 0 && styles.rowFirst,
              ]}
            >
              <Text style={styles.medal}>
                {index < 3 ? MEDALS[index] : `${index + 1}.`}
              </Text>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
                {item.id === user?.id ? " (you)" : ""}
              </Text>
              <View style={styles.pointsPill}>
                <Text style={styles.points}>{item.points} pts</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🌸</Text>
              <Text style={styles.emptyText}>No members yet.</Text>
            </View>
          }
          contentContainerStyle={
            members.length === 0 ? styles.emptyContainer : styles.list
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow,
  },
  rowHighlight: {
    backgroundColor: "#E8F0FF",
  },
  rowFirst: {
    backgroundColor: colors.accent,
  },
  medal: {
    fontSize: 24,
    width: 38,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  pointsPill: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  points: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
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
