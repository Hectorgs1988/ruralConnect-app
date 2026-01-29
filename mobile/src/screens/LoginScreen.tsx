import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '@context/AuthContext';

// Colores de la web
const COLORS = {
  primary: '#fce500',
  primaryStrong: '#F4C400',
  background: '#f5f2e9',
  surface: '#FFFFFF',
  surfaceMuted: '#f5f2e9',
  muted: '#6B7280',
  borderSoft: '#F3E8C9',
  dark: '#1b1b1b',
  error: '#B91C1C',
};

export const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err?.message ?? 'Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('@/../../assets/Campos.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Image
              source={require('@/../../assets/RuralConnect.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.title}>Bienvenido/a a Rural Connect</Text>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Usuario"
                placeholderTextColor={COLORS.muted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!loading}
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Contraseña"
                  placeholderTextColor={COLORS.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.showPasswordButton}
                >
                  <Text style={styles.showPasswordText}>
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </Text>
                </TouchableOpacity>
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Iniciando sesión...' : 'Login'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: `${COLORS.surface}F2`, // 95% opacity
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.08,
    shadowRadius: 45,
    elevation: 8,
  },
  logo: {
    width: '100%',
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: COLORS.dark,
    marginBottom: 16,
  },
  form: {
    gap: 8,
  },
  input: {
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: COLORS.dark,
    marginBottom: 8,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  passwordInput: {
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    borderRadius: 6,
    padding: 12,
    paddingRight: 80,
    fontSize: 14,
    color: COLORS.dark,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  showPasswordText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginBottom: 8,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    marginTop: 12,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: COLORS.muted,
    fontSize: 14,
  },
});
