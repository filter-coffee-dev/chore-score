import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api, Badge, BadgeDef } from '../services/api';
import { useStore } from '../store/useStore';
import { colors, spacing, fontSize, radius, shadow } from '../theme';

function BadgeCard({ badge, earned }: { badge: BadgeDef; earned?: Badge }) {
  return (
    <View style={[styles.badgeCard, !earned && styles.badgeLocked]}>
      <View style={[styles.badgeIconWrap, earned && styles.badgeIconEarned]}>
        <Text style={[styles.badgeEmoji, !earned && styles.badgeEmojiLocked]}>{badge.emoji}</Text>
      </View>
      <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]}>{badge.name}</Text>
      <Text style={styles.badgeDesc} numberOfLines={2}>{badge.description}</Text>
      {earned?.earnedAt && (
        <Text style={styles.earnedAt}>
          {new Date(earned.earnedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </Text>
      )}
      {!earned && <Text style={styles.locked}>🔒</Text>}
    </View>
  );
}

export default function BadgesScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const { memberBadges, allBadges, userId, setBadges } = useStore();

  const load = useCallback(async () => {
    try {
      const data = await api.badges.get();
      setBadges(data.members, data.allBadges);
    } catch {}
  }, [setBadges]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Badges 🏅</Text>
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {memberBadges.map((member) => {
          const earnedMap = Object.fromEntries(member.badges.map((b) => [b.id, b]));
          const earnedCount = member.badges.length;
          const isMe = member.userId === userId;
          return (
            <View key={member.userId} style={styles.memberSection}>
              <View style={styles.memberHeader}>
                <Text style={styles.memberName}>{isMe ? 'You' : member.userName}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{earnedCount}/{allBadges.length} earned</Text>
                </View>
              </View>
              {earnedCount === 0 && (
                <View style={styles.noBadges}>
                  <Text style={styles.noBadgesText}>No badges yet. Get to work! 💪</Text>
                </View>
              )}
              <View style={styles.grid}>
                {allBadges.map((def) => (
                  <BadgeCard key={def.id} badge={def} earned={earnedMap[def.id]} />
                ))}
              </View>
            </View>
          );
        })}
        {memberBadges.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏅</Text>
            <Text style={styles.emptyTitle}>No badges yet!</Text>
            <Text style={styles.emptySubtext}>Complete chores to unlock achievements. Go on, shoo.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text.primary },
  content: { paddingHorizontal: spacing.md, paddingBottom: 110 },
  memberSection: { marginBottom: spacing.xl },
  memberHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  memberName: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text.primary, flex: 1 },
  countBadge: {
    backgroundColor: colors.secondary, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  countText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.text.primary },
  noBadges: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md, alignItems: 'center',
    ...shadow.sm,
  },
  noBadgesText: { fontSize: fontSize.sm, color: colors.text.secondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badgeCard: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.md, alignItems: 'center',
    width: '47%', ...shadow.md,
  },
  badgeLocked: { opacity: 0.45 },
  badgeIconWrap: {
    width: 56, height: 56, borderRadius: radius.lg,
    backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  badgeIconEarned: { backgroundColor: colors.highlight },
  badgeEmoji: { fontSize: 32 },
  badgeEmojiLocked: { opacity: 0.5 },
  badgeName: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text.primary, textAlign: 'center', marginBottom: 2 },
  badgeNameLocked: { color: colors.text.light },
  badgeDesc: { fontSize: fontSize.xs, color: colors.text.secondary, textAlign: 'center', lineHeight: 16 },
  earnedAt: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '700', marginTop: spacing.xs },
  locked: { fontSize: fontSize.sm, color: colors.text.light, marginTop: spacing.xs },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyEmoji: { fontSize: 64, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text.primary, marginBottom: spacing.sm },
  emptySubtext: { fontSize: fontSize.sm, color: colors.text.secondary, textAlign: 'center' },
});
