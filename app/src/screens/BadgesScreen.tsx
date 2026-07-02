import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api, Badge, BadgeDef } from '../services/api';
import { useStore } from '../store/useStore';
import { colors, fonts, spacing, radius, shadow } from '../theme';

const MEDAL = require('../../assets/badge-medal.png');
const STAR = require('../../assets/badge-star.png');
const BANNER = require('../../assets/badge-banner.png');

function BadgeCard({ badge, earned }: { badge: BadgeDef; earned?: Badge }) {
  return (
    <View style={[styles.card, earned ? styles.cardEarned : styles.cardLocked]}>
      {/* Icon circle */}
      {earned ? (
        <LinearGradient
          colors={['#D8F0B0', '#A6D44F44']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <Text style={styles.emoji}>{badge.emoji}</Text>
          <Text style={styles.sparkle}>✨</Text>
        </LinearGradient>
      ) : (
        <View style={styles.iconCircleLocked}>
          <Text style={[styles.emoji, styles.emojiLocked]}>{badge.emoji}</Text>
        </View>
      )}

      <Text style={[styles.name, !earned && styles.nameLocked]} numberOfLines={1}>
        {badge.name}
      </Text>
      <Text style={[styles.desc, !earned && styles.descLocked]} numberOfLines={2}>
        {badge.description}
      </Text>

      {earned?.earnedAt ? (
        <View style={styles.dateChip}>
          <Text style={styles.dateText}>
            {new Date(earned.earnedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      ) : (
        <Text style={styles.lock}>🔒</Text>
      )}
    </View>
  );
}

export default function BadgesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { memberBadges, allBadges, userId, setBadges } = useStore();

  const load = useCallback(async () => {
    try {
      const data = await api.badges.get();
      setBadges(data.members, data.allBadges);
    } catch {} finally {
      setLoading(false);
    }
  }, [setBadges]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load();
  }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const myEarned = memberBadges.find(m => m.userId === userId)?.badges.length ?? 0;
  const total = allBadges.length || 10;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          {/* Title row */}
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <Image
                source={MEDAL}
                style={[styles.medalIcon, { mixBlendMode: 'multiply' } as any]}
                resizeMode="contain"
              />
              <Text style={styles.titleText}>Badges</Text>
            </View>
            <View style={styles.earnedPill}>
              <Image
                source={STAR}
                style={[styles.starIcon, { mixBlendMode: 'multiply' } as any]}
                resizeMode="contain"
              />
              <Text style={styles.earnedPillText}>{myEarned}/{total} earned</Text>
            </View>
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Earn badges by completing chores and building great habits!
          </Text>

          {/* Hero banner */}
          <View style={styles.bannerWrap}>
            <Image
              source={BANNER}
              style={[
                styles.bannerImg,
                { objectPosition: 'center 30%', mixBlendMode: 'multiply' } as any,
              ]}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* ── Badge grid (per member) ─────────────────────────────── */}
        {memberBadges.map((member) => {
          const earnedMap = Object.fromEntries(member.badges.map((b) => [b.id, b]));
          const isMe = member.userId === userId;

          return (
            <View key={member.userId} style={styles.memberSection}>
              <Text style={styles.memberName}>{isMe ? 'You' : member.userName}</Text>
              <View style={styles.grid}>
                {allBadges.map((def) => (
                  <BadgeCard key={def.id} badge={def} earned={earnedMap[def.id]} />
                ))}
              </View>
            </View>
          );
        })}

        {loading ? (
          <View style={styles.spinnerWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : memberBadges.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏅</Text>
            <Text style={styles.emptyTitle}>No badges yet!</Text>
            <Text style={styles.emptySub}>Complete chores to unlock achievements.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xl },

  // Header
  header: {
    paddingHorizontal: 14,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  medalIcon: {
    height: 36,
    width: 36,
  },
  titleText: {
    fontSize: 24,
    fontFamily: fonts.headingBold,
    color: '#16463A',
  },
  earnedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#C8DDB8',
    borderRadius: 999,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 6,
    paddingRight: 12,
    gap: 4,
  },
  starIcon: {
    height: 20,
    width: 20,
  },
  earnedPillText: {
    fontSize: 12,
    fontFamily: fonts.bodyExtraBold,
    color: '#16463A',
  },
  subtitle: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: '#7FA689',
    marginBottom: spacing.sm,
    lineHeight: 16,
  },

  // Banner
  bannerWrap: {
    height: 154,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  bannerImg: {
    width: '100%',
    height: '100%',
  },

  // Member section
  memberSection: {
    paddingHorizontal: 14,
    marginBottom: spacing.lg,
  },
  memberName: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  // Badge cards
  card: {
    borderRadius: 20,
    padding: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    width: '47.5%',
  },
  cardEarned: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#C8E8AE',
    ...shadow.sm,
  },
  cardLocked: {
    backgroundColor: '#F5F7F2',
  },

  // Icon circles
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  iconCircleLocked: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8EDE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emoji: { fontSize: 24 },
  emojiLocked: { opacity: 0.55 },
  sparkle: { position: 'absolute', top: -4, right: -4, fontSize: 14 },

  // Text
  name: {
    fontSize: 13,
    fontFamily: fonts.headingBold,
    color: '#16463A',
    textAlign: 'center',
    marginBottom: 2,
  },
  nameLocked: { color: '#9EBBA4' },
  desc: {
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    color: '#7FA689',
    textAlign: 'center',
    lineHeight: 14,
  },
  descLocked: { color: '#B8CCBA' },

  // Date chip
  dateChip: {
    marginTop: spacing.xs,
    backgroundColor: '#D8F0B0',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dateText: {
    fontSize: 11,
    fontFamily: fonts.bodyExtraBold,
    color: '#1f6e3a',
  },
  lock: {
    fontSize: 12,
    marginTop: spacing.xs,
    opacity: 0.4,
  },

  // Spinner
  spinnerWrap: { paddingVertical: spacing.xxl, alignItems: 'center' },

  // Empty state
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyEmoji: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { fontSize: 18, fontFamily: fonts.headingBold, color: colors.ink, marginBottom: spacing.sm },
  emptySub: { fontSize: 13, fontFamily: fonts.bodyBold, color: colors.mid, textAlign: 'center' },
});
