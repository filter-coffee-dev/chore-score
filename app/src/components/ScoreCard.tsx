import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Score } from '../services/api';
import { colors, fonts, radius, spacing, shadow } from '../theme';

const GUY = require('../../assets/score-guy.png');
const GIRL = require('../../assets/score-girl.png');

interface Props {
  score: Score;
  isMe: boolean;
  mascot?: 'guy' | 'girl';
}

export function ScoreCard({ score, isMe, mascot = 'guy' }: Props) {
  const displayName = isMe ? 'You' : score.userName.split(' ')[0];
  const target = score.totalPoints;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const duration = 600;
    function step(ts: number) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setDisplayed(Math.round(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    }
    const handle = requestAnimationFrame(step);
    return () => cancelAnimationFrame(handle);
  }, [target]);

  return (
    <View style={styles.card}>
      <Image
        source={mascot === 'girl' ? GIRL : GUY}
        style={styles.mascot}
        resizeMode="contain"
      />
      <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
      <Text style={[styles.score, isMe ? styles.scoreMe : styles.scorePartner]}>
        {displayed}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  mascot: {
    height: 64,
    width: 54,
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: 13,
    fontFamily: fonts.bodyExtraBold,
    color: colors.mid,
    marginBottom: 2,
  },
  score: {
    fontSize: 30,
    fontFamily: fonts.headingBold,
    lineHeight: 36,
  },
  scoreMe: {
    color: colors.primary,
  },
  scorePartner: {
    color: colors.orange,
  },
});
