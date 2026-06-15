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
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getRequiredRole } from '../config/appVariant';
import AuthThemeToggle from '../components/auth/AuthThemeToggle';
import AuthRolePills, { SignInRole } from '../components/auth/AuthRolePills';
import type { AuthThemePalette } from '../constants/sucarTheme';

const DEV_HINTS: Record<SignInRole, string> = {
  client: 'Test: john.mwansa@email.com / client123',
  driver: 'Test: james.mulenga@driver.com / driver123',
};

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signInRole, setSignInRole] = useState<SignInRole>(getRequiredRole());
  const { login } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { authTheme: C } = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const buildRole = getRequiredRole();

  const onRoleChange = (role: SignInRole) => {
    if (role !== buildRole) {
      Alert.alert(
        'Different app',
        role === 'driver'
          ? 'Driver accounts use the SuCAR Driver app. Install that build or sign in as Client here.'
          : 'Client accounts use the SuCAR Client app. Install that build or sign in as Driver here.',
        [{ text: 'OK' }],
      );
      return;
    }
    setSignInRole(role);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error: any) {
      let errorMessage =
        error?.message || error?.toString() || 'Login failed. Please try again.';
      errorMessage = errorMessage.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

      if (
        errorMessage.includes('Cannot connect to server') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('Network Error') ||
        errorMessage.includes('Network request failed')
      ) {
        Alert.alert(
          'Connection Error',
          'Cannot connect to backend server. Start the backend (npm run dev in /backend) and try again.',
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert('Login Failed', errorMessage);
      }
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = signInRole === 'client' ? 'Client' : 'Driver';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle={C.statusBar} backgroundColor={C.background} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
              <Image
                source={require('../../assets/Sucarcar.jpeg')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.brand}>SuCAR</Text>
          <Text style={styles.tagline}>Book your car wash, on demand</Text>
        </View>

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <AuthRolePills colors={C} value={signInRole} onChange={onRoleChange} />

          <Text style={styles.welcome}>Welcome back</Text>
          <Text style={styles.signingAs}>
            Signing in as <Text style={styles.signingAsAccent}>{roleLabel}</Text>
          </Text>

          <View style={styles.field}>
            <Ionicons name="mail-outline" size={20} color={C.textDim} style={styles.fieldIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={C.textDim}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Ionicons name="lock-closed-outline" size={20} color={C.textDim} style={styles.fieldIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={C.textDim}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={12}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={C.textDim}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => Alert.alert('Forgot password', 'Coming soon.')} style={styles.forgotWrap}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.loginBtnText}>Log in</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={() => Alert.alert('Google sign-in', 'Coming soon.')}
            activeOpacity={0.8}
          >
            <View style={styles.googleMark}>
              <Text style={styles.googleG}>G</Text>
            </View>
            <Text style={styles.googleLabel}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => (navigation as any).navigate('Register', { role: signInRole })}
            style={styles.footer}
            activeOpacity={0.7}
          >
            <Text style={styles.footerText}>
              No account? <Text style={styles.footerLink}>Create one</Text>
            </Text>
          </TouchableOpacity>

          {__DEV__ && <Text style={styles.devHint}>{DEV_HINTS[signInRole]}</Text>}
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
      minHeight: 180,
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
    brand: {
      fontSize: 32,
      fontWeight: '800',
      color: C.text,
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    tagline: {
      fontSize: 15,
      color: C.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 280,
    },
    sheet: {
      backgroundColor: C.sheet,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 22,
    },
    welcome: {
      fontSize: 22,
      fontWeight: '700',
      color: C.text,
      marginBottom: 4,
    },
    signingAs: {
      fontSize: 14,
      color: C.textMuted,
      marginBottom: 18,
    },
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
    input: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 12,
      fontSize: 16,
      color: C.text,
    },
    eyeBtn: { paddingRight: 14, paddingLeft: 4 },
    forgotWrap: { alignSelf: 'flex-end', marginBottom: 20, marginTop: 2 },
    forgot: { fontSize: 14, fontWeight: '600', color: C.primary },
    loginBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: C.primary,
      borderRadius: 12,
      minHeight: 52,
      marginBottom: 22,
    },
    loginBtnDisabled: { opacity: 0.65 },
    loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
      gap: 12,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: C.divider },
    dividerText: { fontSize: 13, color: C.textDim },
    googleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.googleBg,
      borderWidth: 1,
      borderColor: C.googleBorder,
      borderRadius: 12,
      minHeight: 52,
      gap: 10,
      marginBottom: 24,
    },
    googleMark: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#FFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    googleG: { fontSize: 14, fontWeight: '800', color: '#4285F4' },
    googleLabel: { fontSize: 16, fontWeight: '600', color: C.text },
    footer: { alignItems: 'center' },
    footerText: { fontSize: 15, color: C.textMuted },
    footerLink: { color: C.primary, fontWeight: '700' },
    devHint: {
      marginTop: 16,
      fontSize: 11,
      color: C.textDim,
      textAlign: 'center',
    },
  });

export default LoginScreen;
