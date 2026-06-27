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
      <Text style={styles.text}>"{taunt}"</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    ...shadow.sm,
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
