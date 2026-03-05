import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, spacing, shadow } from "../theme";
import { supabase } from "../services/supabase";
import {
  subscribeToWishlist,
  redeemItem,
  deleteItem,
} from "../services/wishlist";
import { useAuthStore } from "../store/useAuthStore";
import { AppStackParamList, WishlistItem } from "../types/models";
import { mapUser } from "../utils/mappers";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function WishlistScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [showRedeemed, setShowRedeemed] = useState(false);

  const availableItems = items.filter((i) => i.status === "available");
  const redeemedItems = items.filter((i) => i.status === "redeemed");

  useEffect(() => {
    if (!user?.homeId) return;
    const unsub = subscribeToWishlist(user.homeId, (data) => {
      setItems(data);
      setLoading(false);
    });
    return unsub;
  }, [user?.homeId]);

  const refreshUserPoints = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    if (data) setUser(mapUser(data as Record<string, unknown>));
  };

  const handleRedeem = (item: WishlistItem) => {
    if (!user) return;
    const remaining = user.points - item.cost;
    Alert.alert(
      "Redeem Item?",
      `Redeem "${item.title}" for ${item.cost} pts?\nYou'll have ${remaining} pts remaining.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem",
          onPress: async () => {
            try {
              setRedeeming(item.id);
              await redeemItem(item.id, user.id);
              await refreshUserPoints();
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof Error ? err.message : "Something went wrong"
              );
            } finally {
              setRedeeming(null);
            }
          },
        },
      ]
    );
  };

  const handleDelete = (item: WishlistItem) => {
    Alert.alert(
      "Remove Item?",
      `Remove "${item.title}" from the wishlist?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteItem(item.id);
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof Error ? err.message : "Something went wrong"
              );
            }
          },
        },
      ]
    );
  };

  const renderAvailableItem = (item: WishlistItem) => {
    const canAfford = (user?.points ?? 0) >= item.cost;
    const shortage = item.cost - (user?.points ?? 0);
    const isRedeeming = redeeming === item.id;
    const isCreator = item.createdBy === user?.id;

    return (
      <View key={item.id} style={styles.itemCard}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemEmoji}>🎁</Text>
        </View>
        <View style={styles.itemCenter}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.description ? (
            <Text style={styles.itemDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          {!canAfford && (
            <Text style={styles.shortageText}>Need {shortage} more pts</Text>
          )}
        </View>
        <View style={styles.itemRight}>
          <View style={styles.costBadge}>
            <Text style={styles.costText}>{item.cost}</Text>
            <Text style={styles.costPts}>pts</Text>
          </View>
          <TouchableOpacity
            style={[styles.redeemBtn, (!canAfford || isRedeeming) && styles.redeemBtnDisabled]}
            onPress={() => handleRedeem(item)}
            disabled={!canAfford || isRedeeming}
            activeOpacity={0.8}
          >
            {isRedeeming ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.redeemBtnText}>
                {canAfford ? "Redeem" : "Locked"}
              </Text>
            )}
          </TouchableOpacity>
          {isCreator && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderRedeemedItem = (item: WishlistItem) => (
    <View key={item.id} style={styles.redeemedCard}>
      <Text style={styles.redeemedTitle}>{item.title}</Text>
      <Text style={styles.redeemedMeta}>
        {item.cost} pts · Redeemed by {item.redeemerName ?? "someone"}
        {item.redeemedAt ? ` · ${formatDate(item.redeemedAt)}` : ""}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Wishlist 🎁</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate("AddWishlistItem")}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Points balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your Balance</Text>
          <Text style={styles.balancePoints}>{user?.points ?? 0} pts ✨</Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loader}
          />
        ) : (
          <>
            {/* Available items */}
            <Text style={styles.sectionLabel}>Available Rewards</Text>
            {availableItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🛍️</Text>
                <Text style={styles.emptyText}>No rewards yet.</Text>
                <Text style={styles.emptyHint}>
                  Tap "+ Add" to add something worth working towards!
                </Text>
              </View>
            ) : (
              availableItems.map(renderAvailableItem)
            )}

            {/* Redeemed section */}
            {redeemedItems.length > 0 && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.redeemedToggle}
                  onPress={() => setShowRedeemed((v) => !v)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.redeemedToggleText}>
                    Redeemed ({redeemedItems.length})
                  </Text>
                  <Text style={styles.redeemedChevron}>
                    {showRedeemed ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>
                {showRedeemed && redeemedItems.map(renderRedeemedItem)}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    borderWidth: 2.5,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadow,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  balanceCard: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    ...shadow,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    opacity: 0.7,
  },
  balancePoints: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
  },
  loader: {
    marginTop: spacing.xl,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    opacity: 0.5,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  // --- Available item card ---
  itemCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: "flex-start",
    ...shadow,
  },
  itemLeft: {
    marginRight: spacing.sm,
    paddingTop: 2,
  },
  itemEmoji: {
    fontSize: 28,
  },
  itemCenter: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 4,
  },
  shortageText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.error,
  },
  itemRight: {
    alignItems: "center",
    gap: spacing.xs,
  },
  costBadge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignItems: "center",
  },
  costText: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.text,
    lineHeight: 20,
  },
  costPts: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text,
    opacity: 0.6,
  },
  redeemBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 70,
    alignItems: "center",
  },
  redeemBtnDisabled: {
    backgroundColor: colors.muted,
    borderColor: colors.muted,
    opacity: 0.5,
  },
  redeemBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: "700",
  },
  // --- Redeemed section ---
  divider: {
    height: 2,
    backgroundColor: colors.border,
    opacity: 0.15,
    borderRadius: 1,
    marginVertical: spacing.md,
  },
  redeemedToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  redeemedToggleText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    opacity: 0.5,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  redeemedChevron: {
    fontSize: 12,
    color: colors.muted,
  },
  redeemedCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    opacity: 0.7,
  },
  redeemedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  redeemedMeta: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },
  // --- Empty state ---
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
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
  emptyHint: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
});
