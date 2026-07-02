import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radius, spacing, shadow } from '../theme';

interface Props {
  streak: number;
  style?: object;
}

export function StreakBadge({ streak, style }: Props) {
  if (streak === 0) return null;

  return (
    <LinearGradient
      colors={['#B4DD52', '#8FC23A']}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.container, style]}
    >
      <Text style={styles.fire}>🔥</Text>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{streak}-day team streak!</Text>
        <Text style={styles.sub}>Clear today's list to keep it alive.</Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeNum}>{streak}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: 12,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: '#8FC23A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 6,
  },
  fire: { fontSize: 22 },
  textWrap: { flex: 1 },
  title: {
    fontSize: 14,
    fontFamily: fonts.bodyExtraBold,
    color: '#1f6e3a',
  },
  sub: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: '#37702a',
    marginTop: 1,
  },
  badge: {
    backgroundColor: 'rgba(31,110,58,0.15)',
    borderRadius: radius.full,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNum: {
    fontSize: 18,
    fontFamily: fonts.headingBold,
    color: '#1f6e3a',
  },
});
