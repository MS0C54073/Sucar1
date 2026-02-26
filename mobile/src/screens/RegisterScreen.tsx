import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

/**
 * Multi‑role registration screen.
 *
 * Collects different fields depending on whether the user is a client,
 * driver, or car wash, and submits them via AuthContext.register.
 */
const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    nrc: '',
    role: 'client' as 'client' | 'driver' | 'carwash',
    // Client specific
    businessName: '',
    isBusiness: false,
    // Driver specific
    licenseNo: '',
    licenseType: '',
    licenseExpiry: '',
    address: '',
    maritalStatus: '',
    // Car wash specific
    carWashName: '',
    location: '',
    washingBays: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigation = useNavigation();
  const { width } = Dimensions.get('window');
  const { theme, toggle } = useTheme();

  const MovingCar: React.FC<{delay?: number; top?: number; color?: string}> = ({ delay = 0, top = 18, color = '#fff' }) => {
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

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.phone || !formData.nrc) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const registerData: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        nrc: formData.nrc,
        role: formData.role,
      };

      if (formData.role === 'client') {
        if (formData.isBusiness) {
          registerData.businessName = formData.businessName;
        }
        registerData.isBusiness = formData.isBusiness;
      } else if (formData.role === 'driver') {
        registerData.licenseNo = formData.licenseNo;
        registerData.licenseType = formData.licenseType;
        registerData.licenseExpiry = formData.licenseExpiry;
        registerData.address = formData.address;
        registerData.maritalStatus = formData.maritalStatus;
      } else if (formData.role === 'carwash') {
        registerData.carWashName = formData.carWashName;
        registerData.location = formData.location;
        registerData.washingBays = parseInt(formData.washingBays) || 0;
      }

      await register(registerData);
      Alert.alert('Success', 'Registration successful!');
      // Navigation will happen automatically via AuthContext when user is set
    } catch (error: any) {
      // Error is now a string message from AuthContext
      let errorMessage = error?.message || error?.toString() || 'Registration failed. Please try again.';
      
      // Format error message for better display
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
        Alert.alert('Registration Failed', errorMessage);
      }
      
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Animatable.View style={[styles.headerSection, { backgroundColor: theme.colors.headerGradientStart }]} animation="fadeInDown" duration={700} useNativeDriver>
          <MovingCar delay={0} top={18} color="#ffd166" />
          <MovingCar delay={700} top={58} color="#06d6a0" />
          <TouchableOpacity onPress={toggle} style={styles.themeToggle}>
            <Text style={{ color: theme.colors.textPrimary }}>{theme.name === 'light' ? '🌤' : '🌙'}</Text>
          </TouchableOpacity>
          <View style={styles.imageContainer}>
            <Image 
              source={require('../../assets/Sucar.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Register</Text>
        </Animatable.View>
        
        <Text style={styles.label}>Role</Text>
        <View style={styles.roleContainer}>
          {['client', 'driver', 'carwash'].map((role) => (
            <TouchableOpacity
              key={role}
              style={[
                styles.roleButton,
                formData.role === role && styles.roleButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, role: role as any })}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  formData.role === role && styles.roleButtonTextActive,
                ]}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />

        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
          secureTextEntry
        />

        <Text style={styles.label}>Phone *</Text>
        <TextInput
          style={styles.input}
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>NRC *</Text>
        <TextInput
          style={styles.input}
          value={formData.nrc}
          onChangeText={(text) => setFormData({ ...formData, nrc: text })}
        />

        {formData.role === 'client' && (
          <>
            <Text style={styles.label}>Business Name (if business)</Text>
            <TextInput
              style={styles.input}
              value={formData.businessName}
              onChangeText={(text) => setFormData({ ...formData, businessName: text })}
            />
          </>
        )}

        {formData.role === 'driver' && (
          <>
            <Text style={styles.label}>License Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.licenseNo}
              onChangeText={(text) => setFormData({ ...formData, licenseNo: text })}
            />
            <Text style={styles.label}>License Type *</Text>
            <TextInput
              style={styles.input}
              value={formData.licenseType}
              onChangeText={(text) => setFormData({ ...formData, licenseType: text })}
            />
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={styles.input}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
            />
          </>
        )}

        {formData.role === 'carwash' && (
          <>
            <Text style={styles.label}>Car Wash Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.carWashName}
              onChangeText={(text) => setFormData({ ...formData, carWashName: text })}
            />
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
            />
            <Text style={styles.label}>Number of Washing Bays *</Text>
            <TextInput
              style={styles.input}
              value={formData.washingBays}
              onChangeText={(text) => setFormData({ ...formData, washingBays: text })}
              keyboardType="numeric"
            />
          </>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login' as never)}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    width: 150,
    height: 150,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 5,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#667eea',
    alignItems: 'center',
    marginRight: 8,
  },
  roleButtonActive: {
    backgroundColor: '#667eea',
  },
  roleButtonText: {
    color: '#667eea',
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkText: {
    color: '#667eea',
    fontSize: 14,
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

export default RegisterScreen;
