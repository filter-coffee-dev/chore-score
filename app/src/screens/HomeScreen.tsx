import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Image,
} from 'react-native';
import { showAlert } from '../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { useStore } from '../store/useStore';
import { ScoreCard } from '../components/ScoreCard';
import { TauntBanner } from '../components/TauntBanner';
import { StreakBadge } from '../components/StreakBadge';
import { ChoreItem } from '../components/ChoreItem';
import { colors, spacing, fontSize, radius, shadow } from '../theme';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const { scores, streak, taunt, chores, userId, userName, setScores, setChores } = useStore();

  const load = useCallback(async () => {
    try {
      const [scoresData, choresData] = await Promise.all([
        api.scores.get(),
        api.chores.list(),
      ]);
      setScores(scoresData.scores, scoresData.streak, scoresData.taunt);
      setChores(choresData.chores);
    } catch (err: unknown) {
      showAlert('Refresh failed', (err as Error).message);
    }
  }, [setScores, setChores]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleComplete(choreId: string) {
    setCompleting(choreId);
    try {
      const result = await api.chores.complete(choreId);
      showAlert('BOOM! 💥', `+${result.pointsEarned} pts! Look at you go!`);
      await load();
    } catch (err: unknown) {
      showAlert('Oops', (err as Error).message);
    } finally {
      setCompleting(null);
    }
  }

  const myScore = scores.find((s) => s.userId === userId);
  const partnerScore = scores.find((s) => s.userId !== userId);
  const myPoints = myScore?.totalPoints ?? 0;
  const partnerPoints = partnerScore?.totalPoints ?? 0;
  const imLeading = myPoints >= partnerPoints;

  const todayChores = chores.filter((c) => c.frequency === 'daily' || !c.completedThisPeriod);
  const pendingCount = todayChores.filter((c) => !c.completedThisPeriod).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero banner with rounded bottom */}
        <View style={styles.bannerWrap}>
          <Image source={require('../../assets/Banner-Family.png')} style={styles.banner} resizeMode="cover" />
          <View style={styles.bannerOverlay}>
            <Text style={styles.greeting}>Hey {userName?.split(' ')[0]}! 👋</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
              <Text style={styles.refreshIcon}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Score Cards */}
        {scores.length > 0 && (
          <View style={styles.scoresRow}>
            {myScore && <ScoreCard score={myScore} isMe={true} isLeading={imLeading} />}
            {partnerScore && <ScoreCard score={partnerScore} isMe={false} isLeading={!imLeading} />}
          </View>
        )}
        {scores.length === 0 && (
          <View style={styles.emptyScores}>
            <Text style={styles.emptyText}>No scores yet. Complete a chore to get on the board! 🏆</Text>
          </View>
        )}

        {/* Streak */}
        <StreakBadge streak={streak} />

        {/* Taunt */}
        {taunt ? <TauntBanner taunt={taunt} /> : null}

        {/* Today's Chores */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Chores</Text>
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount} left</Text>
              </View>
            )}
            {pendingCount === 0 && chores.length > 0 && (
              <Text style={styles.allDone}>All done! 🎉</Text>
            )}
          </View>

          {todayChores.length === 0 ? (
            <View style={styles.emptyChores}>
              <Text style={styles.emptyEmoji}>🧹</Text>
              <Text style={styles.emptyTitle}>No chores set up yet.</Text>
              <Text style={styles.emptySubtext}>Go to Chores tab to add some. Yes, now.</Text>
            </View>
          ) : (
            todayChores.map((chore) => (
              <ChoreItem
                key={chore.choreId}
                chore={chore}
                onComplete={handleComplete}
                completing={completing === chore.choreId}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 110 },
  bannerWrap: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  banner: { width: '100%', height: 220 },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(26,58,46,0.35)',
  },
  greeting: { fontSize: fontSize.lg, fontWeight: '800', color: colors.white },
  refreshBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: radius.full,
    padding: spacing.sm,
  },
  refreshIcon: { fontSize: 16 },
  scoresRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyScores: {
    margin: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    alignItems: 'center',
    ...shadow.sm,
  },
  section: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text.primary, flex: 1 },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.text.primary },
  allDone: { fontSize: fontSize.sm, fontWeight: '700', color: colors.primary },
  emptyChores: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    ...shadow.sm,
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.sm },
  emptyTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  emptySubtext: { fontSize: fontSize.sm, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xs },
  emptyText: { fontSize: fontSize.md, fontWeight: '600', color: colors.text.secondary, textAlign: 'center' },
});
