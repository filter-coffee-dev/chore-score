import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Image, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { showAlert } from '../../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParams } from '../../navigation';
import { signUp } from '../../services/auth';
import { colors, fonts, spacing, shadow } from '../../theme';

type Props = { navigation: StackNavigationProp<AuthStackParams, 'SignUp'> };

// create-account-hero2.png: 941×1672 portrait — same top-crop pattern as login-hero
const SCREEN_W = Dimensions.get('window').width;
const CA_HERO_NATURAL_H = Math.round(SCREEN_W * 1672 / 941);
const CA_HERO_CROP_H = 310;

export default function SignUpScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!name || !email || !password) return showAlert('Fill everything in. No shortcuts here. 🙅');
    if (password.length < 8) return showAlert('Password needs 8+ characters. Safety first!');
    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
      navigation.navigate('ConfirmSignUp', { email: email.trim() });
    } catch (err: unknown) {
      showAlert('Oops!', (err as Error).message ?? 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero image — top-cropped 270px */}
          <View style={styles.heroWrap}>
            <Image
              source={require('../../../assets/create-account-hero2.png')}
              style={styles.heroImage}
              resizeMode="stretch"
            />

            {/* Frosted pill back button overlaid on hero */}
            <SafeAreaView edges={['top']} style={styles.heroOverlay} pointerEvents="box-none">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[styles.backBtn, { backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' } as any]}
              >
                <Text style={styles.backText}>
                  <Text style={styles.backArrow}>{'← '}</Text>Back
                </Text>
              </TouchableOpacity>
            </SafeAreaView>

            {/* Fade: transparent → mint */}
            <LinearGradient
              colors={['#C8E8CE00', '#C8E8CE']}
              style={styles.heroFade}
              pointerEvents="none"
            />
          </View>

          {/* Title section: mint band */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Time to make it official. Your chores await.</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.label}>Your name</Text>
            <TextInput
              style={styles.input}
              placeholder="What should we call you?"
              placeholderTextColor="#9EBBA4"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#9EBBA4"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="8+ characters"
              placeholderTextColor="#9EBBA4"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity onPress={handleSignUp} disabled={loading} style={styles.btnWrap}>
              <LinearGradient
                colors={['#27A07C', '#15795C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.btn}
              >
                <Text style={styles.btnText}>
                  {loading ? 'Creating account…' : "Let's Do This! 💪"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkWrap}>
              <Text style={styles.linkText}>
                Already have an account?{' '}
                <Text style={styles.linkAccent}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#C8E8CE' },
  scroll: { flexGrow: 1 },

  // Hero
  heroWrap: {
    height: CA_HERO_CROP_H,
    overflow: 'hidden',
    backgroundColor: '#EEF5E6',
  },
  heroImage: {
    width: '100%',
    height: CA_HERO_NATURAL_H,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 999,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 10,
    paddingRight: 14,
  },
  backArrow: {
    fontSize: 16,
    fontFamily: fonts.bodyExtraBold,
    color: '#15795C',
    lineHeight: 20,
  },
  backText: {
    fontSize: 13,
    fontFamily: fonts.bodyExtraBold,
    color: '#15795C',
  },
  heroFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },

  // Title section
  titleSection: {
    backgroundColor: '#C8E8CE',
    paddingHorizontal: 22,
    paddingVertical: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.headingBold,
    color: '#16463A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: '#4E7C5F',
    textAlign: 'center',
  },

  // Card
  card: {
    margin: 8,
    marginHorizontal: 18,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 14,
    paddingHorizontal: 16,
    shadowColor: 'rgba(20,70,56,0.25)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.bodyExtraBold,
    color: '#16463A',
    marginBottom: 4,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: '#EEF5E6',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: '#16463A',
  },
  btnWrap: { marginTop: 4 },
  btn: {
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#15795C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.53,
    shadowRadius: 16,
    elevation: 8,
  },
  btnText: {
    fontSize: 16,
    fontFamily: fonts.headingBold,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  linkWrap: { alignItems: 'center', paddingVertical: spacing.sm, marginTop: 4 },
  linkText: { fontSize: 13, fontFamily: fonts.bodyBold, color: '#4E7C5F' },
  linkAccent: { fontFamily: fonts.bodyExtraBold, color: '#EE8C3C' },
});
