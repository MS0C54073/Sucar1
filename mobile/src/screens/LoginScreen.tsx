import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getRequiredRole, getAppDisplayName } from '../config/appVariant';
import AuthThemeToggle from '../components/auth/AuthThemeToggle';
import type { AuthThemePalette } from '../constants/sucarTheme';

type Step = 'phone' | 'code';

const LoginScreen = () => {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | undefined>();

  const { sendPhoneCode, loginWithPhone } = useAuth();
  const insets = useSafeAreaInsets();
  const { authTheme: C } = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);

  const role = getRequiredRole();
  const roleLabel = role === 'driver' ? 'Driver' : 'Client';

  // Normalize to E.164-ish for Zambia: strip spaces, map leading 0 to +260.
  const normalizePhone = (raw: string) => {
    let p = raw.replace(/[^\d+]/g, '');
    if (p.startsWith('0')) p = `+260${p.slice(1)}`;
    else if (!p.startsWith('+')) p = `+${p}`;
    return p;
  };

  const onSendCode = async () => {
    const p = normalizePhone(phone);
    if (p.replace(/\D/g, '').length < 10) {
      Alert.alert('Invalid number', 'Please enter a valid phone number.');
      return;
    }
    setLoading(true);
    try {
      const { devCode } = await sendPhoneCode(p);
      setPhone(p);
      setDevCode(devCode);
      if (devCode) setCode(devCode); // dev convenience: prefill the returned code
      setStep('code');
    } catch (e: any) {
      Alert.alert('Could not send code', e?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    if (code.trim().length < 4) {
      Alert.alert('Enter the code', 'Type the verification code we sent you.');
      return;
    }
    setLoading(true);
    try {
      await loginWithPhone(phone, code.trim(), name.trim() || undefined);
    } catch (e: any) {
      const msg = e?.message || 'Verification failed.';
      if (/name/i.test(msg)) {
        Alert.alert('One more thing', 'Looks like this is your first time. Please add your full name, then verify again.');
        setStep('phone');
      } else {
        Alert.alert('Verification failed', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle={C.statusBar} backgroundColor={C.background} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.hero}>
            <AuthThemeToggle colors={C} style={styles.themeToggle} />
            <View style={styles.logoFrame}>
              <View style={[styles.logoInner, { backgroundColor: C.logoInner }]}>
                <Image source={require('../../assets/Sucarcar.jpeg')} style={styles.logoImage} resizeMode="contain" />
              </View>
            </View>
            <Text style={styles.brand}>SuCAR</Text>
            <Text style={styles.tagline}>{getAppDisplayName()}</Text>
          </View>

          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            {step === 'phone' ? (
              <>
                <Text style={styles.welcome}>Enter your phone</Text>
                <Text style={styles.signingAs}>
                  We'll text you a code to sign in as <Text style={styles.signingAsAccent}>{roleLabel}</Text>
                </Text>

                <View style={styles.field}>
                  <Ionicons name="call-outline" size={20} color={C.textDim} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 0977 123 456"
                    placeholderTextColor={C.textDim}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoFocus
                  />
                </View>

                <View style={styles.field}>
                  <Ionicons name="person-outline" size={20} color={C.textDim} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full name (first time only)"
                    placeholderTextColor={C.textDim}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                  onPress={onSendCode}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Send code</Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFF" />
                    </>
                  )}
                </TouchableOpacity>

                <Text style={styles.hint}>
                  By continuing you agree to receive a one time SMS verification code.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.welcome}>Enter the code</Text>
                <Text style={styles.signingAs}>
                  Sent to <Text style={styles.signingAsAccent}>{phone}</Text>
                </Text>

                <View style={styles.field}>
                  <Ionicons name="keypad-outline" size={20} color={C.textDim} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    placeholder="6 digit code"
                    placeholderTextColor={C.textDim}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>

                {!!devCode && (
                  <Text style={styles.devHint}>Dev code: {devCode}</Text>
                )}

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                  onPress={onVerify}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Verify and continue</Text>
                      <Ionicons name="checkmark" size={20} color="#FFF" />
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.codeActions}>
                  <TouchableOpacity onPress={() => { setStep('phone'); setCode(''); }} hitSlop={8}>
                    <Text style={styles.linkText}>Change number</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onSendCode} disabled={loading} hitSlop={8}>
                    <Text style={styles.linkText}>Resend code</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const createStyles = (C: AuthThemePalette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    flex: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    hero: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      minHeight: 200,
    },
    themeToggle: { position: 'absolute', top: 8, right: 20 },
    logoFrame: {
      width: 88,
      height: 88,
      borderRadius: 44,
      borderWidth: 2,
      borderColor: C.logoBorder,
      backgroundColor: C.logoRing,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    logoInner: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    logoImage: { width: 48, height: 48 },
    brand: { fontSize: 32, fontWeight: '800', color: C.text, letterSpacing: 0.5, marginBottom: 8 },
    tagline: { fontSize: 15, color: C.textMuted, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
    sheet: {
      backgroundColor: C.sheet,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 24,
    },
    welcome: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 4 },
    signingAs: { fontSize: 14, color: C.textMuted, marginBottom: 20 },
    signingAsAccent: { color: C.primary, fontWeight: '700' },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.inputBg,
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 12,
      marginBottom: 14,
      minHeight: 52,
    },
    fieldIcon: { marginLeft: 14 },
    input: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontSize: 16, color: C.text },
    codeInput: { letterSpacing: 8, fontSize: 20, fontWeight: '700' },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: C.primary,
      borderRadius: 12,
      minHeight: 52,
      marginTop: 6,
      marginBottom: 14,
    },
    primaryBtnDisabled: { opacity: 0.65 },
    primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    hint: { fontSize: 12, color: C.textDim, textAlign: 'center', lineHeight: 18 },
    devHint: { fontSize: 12, color: C.textDim, textAlign: 'center', marginBottom: 12 },
    codeActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    linkText: { fontSize: 14, fontWeight: '600', color: C.primary },
  });

export default LoginScreen;
