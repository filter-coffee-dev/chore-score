import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontSize, shadow } from '../theme';

interface Props {
  streak: number;
}

export function StreakBadge({ streak }: Props) {
  if (streak === 0) return null;

  const label = streak === 1
    ? '1 day streak — you started! 🌱'
    : streak >= 30
    ? `${streak} day streak — LEGENDARY 🔥🔥🔥`
    : streak >= 7
    ? `${streak} day streak — on fire 🔥`
    : `${streak} day streak 🔥`;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignSelf: 'center',
    marginVertical: spacing.sm,
    ...shadow.sm,
  },
  text: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text.primary,
  },
});
