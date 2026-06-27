import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Score } from '../services/api';
import { colors, radius, spacing, fontSize, shadow } from '../theme';

interface Props {
  score: Score;
  isMe: boolean;
  isLeading: boolean;
}

export function ScoreCard({ score, isMe, isLeading }: Props) {
  return (
    <View style={[styles.card, isLeading && styles.leading, isMe && styles.mine]}>
      {isLeading && <Text style={styles.crown}>👑</Text>}
      <Text style={styles.name} numberOfLines={1}>
        {isMe ? 'You' : score.userName}
      </Text>
      <Text style={styles.points}>{score.totalPoints}</Text>
      <Text style={styles.label}>pts</Text>
      <Text style={styles.completions}>{score.totalCompletions} chores</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    ...shadow.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mine: {
    borderColor: colors.secondary,
  },
  leading: {
    backgroundColor: colors.highlight,
    borderColor: colors.secondary,
  },
  crown: {
    fontSize: 20,
    marginBottom: 2,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  points: {
    fontSize: fontSize.hero,
    fontWeight: '900',
    color: colors.text.primary,
    lineHeight: fontSize.hero + 4,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text.light,
  },
  completions: {
    fontSize: fontSize.xs,
    color: colors.text.light,
    marginTop: spacing.xs,
  },
});
