import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { ERRORS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const styles = createStyles(colors);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = ERRORS.validation.required('Email');
    } else if (!email.includes('@')) {
      newErrors.email = ERRORS.validation.invalidEmail;
    }

    if (!password) {
      newErrors.password = ERRORS.validation.required('Password');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await signIn(email.trim(), password);

      if (result.error) {
        Alert.alert('Login Failed', result.error.message || ERRORS.auth.invalidCredentials);
        return;
      }

      // Successfully logged in
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Error', error?.message || ERRORS.auth.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Welcome Back Message */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>Welcome Back! 👋</Text>
              <Text style={styles.subtitle}>Sign in to continue managing your home</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email ? styles.inputError : undefined]}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.text.tertiary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors({ ...errors, email: undefined });
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={[styles.passwordInput, errors.password ? styles.inputError : undefined]}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.text.tertiary}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) {
                        setErrors({ ...errors, password: undefined });
                      }
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    <Text style={styles.eyeIconText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.text.inverse} />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/signup')}
                disabled={loading}
              >
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  headerSection: {
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.h2,
    color: colors.text.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: colors.text.secondary,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.labelLarge,
    color: colors.text.primary,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.text.primary,
    backgroundColor: colors.surface.primary,
  },
  passwordInputWrapper: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    paddingRight: 50,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.text.primary,
    backgroundColor: colors.surface.primary,
  },
  eyeIcon: {
    position: 'absolute',
    right: Spacing.md,
    top: Spacing.md,
    padding: Spacing.xs,
  },
  eyeIconText: {
    fontSize: 20,
  },
  inputError: {
    borderColor: colors.error.default,
  },
  errorText: {
    ...Typography.bodySmall,
    color: colors.error.default,
    marginTop: Spacing.xs,
  },
  forgotPassword: {
    ...Typography.bodyMedium,
    color: colors.primary.default,
    textAlign: 'right',
    marginBottom: Spacing.xl,
  },
  loginButton: {
    backgroundColor: colors.primary.default,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    ...Typography.button,
    color: colors.text.inverse,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  signUpText: {
    ...Typography.bodyMedium,
    color: colors.text.secondary,
  },
  signUpLink: {
    ...Typography.bodyMedium,
    color: colors.primary.default,
    fontWeight: '600',
  },
});