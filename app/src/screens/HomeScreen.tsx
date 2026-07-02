import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Animated, Image, Dimensions, PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { showAlert } from '../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { useStore } from '../store/useStore';
import { ScoreCard } from '../components/ScoreCard';
import { TauntBanner } from '../components/TauntBanner';
import { ChoreItem } from '../components/ChoreItem';
import { colors, fonts, spacing, radius, shadow } from '../theme';

const SCREEN_W = Dimensions.get('window').width;
const SLIDE_H = 210;

const SLIDES = [
  require('../../assets/slide2-cooking.png'),
  require('../../assets/slide2-repairs.png'),
  require('../../assets/slide2-cleaning.png'),
  require('../../assets/slide2-dropoff.png'),
  require('../../assets/slide2-bathroom.png'),
  require('../../assets/slide2-laundry.png'),
  require('../../assets/slide2-roadtrip.png'),
  require('../../assets/slide2-p1.png'),
  require('../../assets/slide2-p2.png'),
  require('../../assets/slide2-p3.png'),
];

function isoWeek(): number {
  const d = new Date();
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function ChoreSlideshow() {
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5 && Math.abs(gs.dx) > 8,
      onPanResponderMove: (_, gs) => {
        translateX.setValue(-activeRef.current * SCREEN_W + gs.dx);
      },
      onPanResponderRelease: (_, gs) => {
        const threshold = SCREEN_W * 0.25;
        let next = activeRef.current;
        if (gs.dx < -threshold && next < SLIDES.length - 1) next++;
        else if (gs.dx > threshold && next > 0) next--;
        activeRef.current = next;
        setActive(next);
        Animated.timing(translateX, {
          toValue: -next * SCREEN_W,
          duration: 300,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: -activeRef.current * SCREEN_W,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    const t = setInterval(() => {
      const next = activeRef.current + 1;
      if (next >= SLIDES.length) {
        translateX.setValue(0);
        activeRef.current = 0;
        setActive(0);
      } else {
        activeRef.current = next;
        setActive(next);
        Animated.timing(translateX, {
          toValue: -next * SCREEN_W,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    }, 15000);
    return () => clearInterval(t);
  }, [translateX]);

  return (
    <View style={styles.slideshow} {...panResponder.panHandlers}>
      <Animated.View style={[styles.slideTrack, { transform: [{ translateX }] }]}>
        {SLIDES.map((src, i) => (
          <Image
            key={i}
            source={src}
            style={styles.slide}
            resizeMode="cover"
          />
        ))}
      </Animated.View>

      {/* Top scrim */}
      <LinearGradient
        colors={['rgba(0,0,0,0.38)', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.scrim}
        pointerEvents="none"
      />

      {/* Dots */}
      <View style={styles.dotsRow} pointerEvents="none">
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === active && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const { scores, streak, taunt, chores, userId, userName, setScores, setChores } = useStore();

  const starSpin = useRef(new Animated.Value(0)).current;

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

  useFocusEffect(useCallback(() => {
    load();
    Animated.timing(starSpin, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => starSpin.setValue(0));
  }, [load]));

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

  const unclaimed = chores.filter((c) => !c.completedThisPeriod);

  const spin = starSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const firstName = userName?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Full-bleed slideshow */}
        <ChoreSlideshow />

        {/* Score card */}
        <View style={styles.scoresCard}>
          {/* Card header row */}
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.weekLabel}>WEEK {isoWeek()}</Text>
              <Text style={styles.headerTitle}>It's On.</Text>
            </View>
            {streak > 0 && (
              <View style={styles.streakPill}>
                <Text style={styles.streakPillText}>🔥 {streak} days</Text>
              </View>
            )}
          </View>

          {/* Scores */}
          {scores.length > 0 ? (
            <View style={styles.scoresRow}>
              {myScore && <ScoreCard score={myScore} isMe={true} mascot={myScore.avatar ?? 'guy'} />}
              <View style={styles.vsWrap}>
                <Animated.Text style={[styles.vsStar, { transform: [{ rotate: spin }] }]}>★</Animated.Text>
                <Text style={styles.vsText}>VS</Text>
              </View>
              {partnerScore && <ScoreCard score={partnerScore} isMe={false} mascot={partnerScore.avatar ?? 'girl'} />}
            </View>
          ) : (
            <View style={styles.emptyScores}>
              <Text style={styles.emptyText}>Hey {firstName}! Complete a chore to get on the board 🏆</Text>
            </View>
          )}
        </View>

        {/* Taunt */}
        {taunt ? <TauntBanner taunt={taunt} /> : null}

        {/* Up for grabs */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Up for grabs</Text>
          </View>

          {chores.length === 0 ? (
            <View style={styles.emptyChores}>
              <Text style={styles.emptyChoreEmoji}>🌿</Text>
              <Text style={styles.emptyTitle}>No chores set up yet.</Text>
              <Text style={styles.emptySub}>Go to Chores tab to add some.</Text>
            </View>
          ) : unclaimed.length === 0 ? (
            <View style={styles.emptyChores}>
              <Text style={styles.emptyChoreEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>All done!</Text>
              <Text style={styles.emptySub}>You crushed it today.</Text>
            </View>
          ) : (
            unclaimed.map((chore) => (
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
  scroll: { paddingBottom: spacing.lg },

  // Slideshow
  slideshow: {
    height: SLIDE_H,
    overflow: 'hidden',
    backgroundColor: '#EEF5E6',
  },
  slideTrack: {
    flexDirection: 'row',
    width: SCREEN_W * SLIDES.length,
    height: SLIDE_H,
  },
  slide: {
    width: SCREEN_W,
    height: SLIDE_H,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.53)',
  },
  dotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },

  // Score card
  scoresCard: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
    ...shadow.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0E4',
  },
  weekLabel: {
    fontSize: 10,
    fontFamily: fonts.bodyExtraBold,
    color: '#9EBBA4',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.headingBold,
    color: '#16463A',
    lineHeight: 20,
    marginTop: 1,
  },
  streakPill: {
    backgroundColor: '#EEF5E6',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakPillText: {
    fontSize: 10,
    fontFamily: fonts.bodyExtraBold,
    color: '#15795C',
  },
  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  vsStar: {
    fontSize: 34,
    color: colors.limeLight,
    lineHeight: 36,
  },
  vsText: {
    fontSize: 11,
    fontFamily: fonts.headingBold,
    color: colors.muted,
  },
  emptyScores: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.mid,
    textAlign: 'center',
  },

  // Sections
  section: { paddingHorizontal: 16, paddingTop: spacing.sm },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.headingBold,
    color: colors.ink,
    flex: 1,
  },
  emptyChores: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    ...shadow.sm,
  },
  emptyChoreEmoji: { fontSize: 48, marginBottom: spacing.sm },
  emptyTitle: {
    fontSize: 15,
    fontFamily: fonts.bodyExtraBold,
    color: colors.ink,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.mid,
  },
});
