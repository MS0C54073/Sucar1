import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import GradientBackground from '../components/common/GradientBackground';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

/**
 * Login screen for all user roles.
 *
 * Uses AuthContext.login to authenticate, then redirects the user
 * to the correct home screen based on their role.
 */
const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigation = useNavigation();
  const { theme, toggle } = useTheme();
  const { width } = Dimensions.get('window');

  const MovingCar: React.FC<{delay?: number; top?: number; color?: string}> = ({ delay = 0, top = 20, color = '#fff' }) => {
    const translateX = React.useRef(new Animated.Value(-120)).current;

    React.useEffect(() => {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(translateX, {
            toValue: width + 120,
            duration: 4200,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: -120,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }, [delay, translateX]);

    return (
      <Animated.View
        style={[styles.movingCar, { top, transform: [{ translateX }] }]}
        pointerEvents="none"
      >
        <View style={[styles.carBody, { backgroundColor: color }]} />
        <View style={[styles.carWheel, { left: 6 }]} />
        <View style={[styles.carWheel, { right: 6 }]} />
      </Animated.View>
    );
  };

  const WashingBubbles: React.FC<{top?: number}> = ({ top = 110 }) => {
    const scales = [React.useRef(new Animated.Value(0)).current, React.useRef(new Animated.Value(0)).current, React.useRef(new Animated.Value(0)).current];
    React.useEffect(() => {
      const animations = scales.map((s, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 300),
            Animated.timing(s, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(s, { toValue: 0, duration: 800, useNativeDriver: true }),
          ])
        )
      );
      animations.forEach(a => a.start());
      return () => animations.forEach(a => a.stop());
    }, [scales]);

    return (
      <View style={[styles.bubblesContainer, { top }]} pointerEvents="none">
        {scales.map((s, i) => (
          <Animated.View
            key={i}
            style={[
              styles.bubble,
              { transform: [{ scale: s }], opacity: s },
            ]}
          />
        ))}
      </View>
    );
  };

  React.useEffect(() => {
    if (user) {
      console.log(`🔄 User logged in, navigating based on role: ${user.role}`);
      // Use reset to replace the navigation stack and prevent going back to login
      if (user.role === 'client' || user.role === 'admin') {
        // Admin can use ClientHome for now, or create a separate AdminHome
        navigation.reset({
          index: 0,
          routes: [{ name: 'ClientHome' as never }],
        });
      } else if (user.role === 'driver') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'DriverHome' as never }],
        });
      } else if (user.role === 'carwash') {
        // Car wash can use ClientHome for now
        navigation.reset({
          index: 0,
          routes: [{ name: 'ClientHome' as never }],
        });
      }
    }
  }, [user, navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Navigation will happen automatically via useEffect when user is set
      // The useEffect will trigger when user state updates
      console.log('✅ Login completed, waiting for navigation...');
    } catch (error: any) {
      // Error is now a string message from AuthContext
      let errorMessage = error?.message || error?.toString() || 'Login failed. Please try again.';
      
      // Format error message for better display
      // Replace newlines with spaces for Alert (Alerts don't support multi-line well)
      errorMessage = errorMessage.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      
      // If it's a connection error, provide actionable steps
      if (errorMessage.includes('Cannot connect to server') || 
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('Network Error') ||
          errorMessage.includes('Network request failed')) {
        Alert.alert(
          'Connection Error',
          'Cannot connect to backend server.\n\n🔧 Quick Fix:\n1. Open PowerShell in project root\n2. Run: .\\start-backend-for-mobile.ps1\n\nOr manually:\n• cd backend\n• npm run dev\n• Wait for "✅ Supabase connected successfully"\n• Wait for "🚀 SuCAR API Server"\n\nThen try again!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Login Failed', errorMessage);
      }
      
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animatable.View
          style={[styles.headerSection, { backgroundColor: theme.colors.headerGradientStart }]}
          animation="fadeInDown"
          duration={700}
          useNativeDriver
        >
          <TouchableOpacity onPress={toggle} style={styles.themeToggle}>
            <Text style={{ color: theme.colors.textPrimary }}>{theme.name === 'light' ? '🌤' : '🌙'}</Text>
          </TouchableOpacity>
          <MovingCar delay={0} top={28} color="#ffd166" />
          <MovingCar delay={900} top={68} color="#06d6a0" />
          <Animatable.View
            style={styles.imageContainer}
            animation="bounceIn"
            duration={800}
            useNativeDriver
          >
            <Image
              source={require('../../assets/Sucar.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animatable.View>
          <WashingBubbles top={140} />
          <Text style={styles.title}>SuCAR</Text>
          <Text style={styles.subtitle}>Car Wash Booking System</Text>
        </Animatable.View>
        
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.gray400}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.gray400}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          
          <Animatable.View
            animation={loading ? undefined : 'pulse'}
            iterationCount={loading ? 0 : 'infinite'}
            duration={1400}
            useNativeDriver
          >
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color={Colors.white} />
                  <Text style={styles.buttonText}>Login</Text>
                </>
              )}
            </TouchableOpacity>
          </Animatable.View>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('Register' as never)}
            style={styles.linkButton}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkTextBold}>Register</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  imageContainer: {
    width: 180,
    height: 180,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: Spacing.md,
    ...Shadows.xl,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: Typography['5xl'],
    fontWeight: Typography.bold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.lg,
    color: Colors.white,
    opacity: 0.95,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  movingCar: {
    position: 'absolute',
    left: -120,
    width: 100,
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 0,
  },
  carBody: {
    width: 80,
    height: 22,
    borderRadius: 6,
  },
  carWheel: {
    position: 'absolute',
    bottom: -6,
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: '#111',
  },
  bubblesContainer: {
    position: 'absolute',
    left: '50%',
    marginLeft: -40,
    width: 80,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  bubble: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    opacity: 0.6,
  },
  form: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.gray50,
  },
  inputIcon: {
    marginLeft: Spacing.md,
  },
  input: {
    flex: 1,
    padding: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  linkButton: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
  },
  linkTextBold: {
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  themeToggle: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)'
  },
});

export default LoginScreen;
