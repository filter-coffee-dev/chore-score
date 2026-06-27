import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { showAlert } from '../../utils/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParams } from '../../navigation';
import { signUp } from '../../services/auth';
import { colors, spacing, radius, fontSize, shadow } from '../../theme';

type Props = { navigation: StackNavigationProp<AuthStackParams, 'SignUp'> };

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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.back}>← Back</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroSection}>
            <Text style={styles.heroEmoji}>🧹</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Time to make it official. Your chores await.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Your name</Text>
            <TextInput
              style={styles.input}
              placeholder="What should we call you?"
              placeholderTextColor={colors.text.light}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.text.light}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="8+ characters"
              placeholderTextColor={colors.text.light}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.btn} onPress={handleSignUp} disabled={loading}>
              <Text style={styles.btnText}>{loading ? 'Creating account...' : "Let's Do This! 💪"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.link}>
              <Text style={styles.linkText}>Already have an account? Sign in →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, paddingBottom: spacing.xxl },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  backBtn: { alignSelf: 'flex-start' },
  back: { color: colors.primary, fontSize: fontSize.md, fontWeight: '600' },
  heroSection: { alignItems: 'center', paddingVertical: spacing.lg },
  heroEmoji: { fontSize: 48, marginBottom: spacing.sm },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text.primary, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.sm, color: colors.text.secondary },
  card: {
    margin: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.md,
  },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text.secondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadow.sm,
  },
  btnText: { color: colors.white, fontSize: fontSize.md, fontWeight: '700' },
  link: { alignItems: 'center', marginTop: spacing.lg },
  linkText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
});
