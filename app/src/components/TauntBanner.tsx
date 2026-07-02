import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../theme';

interface Props {
  taunt: string;
}

export function TauntBanner({ taunt }: Props) {
  if (!taunt) return null;
  return (
    <LinearGradient
      colors={['#B4DD52', '#8FC23A']}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <Text style={styles.emoji}>😤</Text>
      <View style={styles.textWrap}>
        <Text style={styles.label}>Taunt</Text>
        <Text style={styles.text}>{taunt}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 22,
    marginTop: 10,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#8FC23A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 6,
  },
  emoji: {
    fontSize: 22,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontFamily: fonts.bodyExtraBold,
    color: '#1f6e3a',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  text: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: '#1f6e3a',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
