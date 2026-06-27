import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontSize, shadow } from '../theme';

interface Props {
  taunt: string;
}

export function TauntBanner({ taunt }: Props) {
  if (!taunt) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.quote}>"</Text>
      <Text style={styles.text}>{taunt}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.accent,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    ...shadow.sm,
  },
  quote: {
    fontSize: 32,
    fontWeight: '900',
    color: 'rgba(26,58,46,0.2)',
    lineHeight: 24,
    marginBottom: -4,
  },
  text: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text.primary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
});
