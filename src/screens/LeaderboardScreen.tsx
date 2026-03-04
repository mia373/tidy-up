import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme";
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
          color={colors.primary}
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View
              style={[styles.row, item.id === user?.id && styles.rowHighlight]}
            >
              <Text style={styles.medal}>
                {index < 3 ? MEDALS[index] : `${index + 1}.`}
              </Text>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
                {item.id === user?.id ? " (you)" : ""}
              </Text>
              <Text style={styles.points}>{item.points} pts</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>🌸 No members yet.</Text>
            </View>
          }
          contentContainerStyle={members.length === 0 ? styles.emptyContainer : undefined}
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
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  loader: {
    marginTop: spacing.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowHighlight: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  medal: {
    fontSize: 22,
    width: 36,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  points: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  empty: {
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: colors.muted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
});
