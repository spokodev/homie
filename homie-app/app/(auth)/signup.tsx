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

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const styles = createStyles(colors);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!name) {
      newErrors.name = ERRORS.validation.required('Name');
    }

    if (!email) {
      newErrors.email = ERRORS.validation.required('Email');
    } else if (!email.includes('@')) {
      newErrors.email = ERRORS.validation.invalidEmail;
    }

    if (!password) {
      newErrors.password = ERRORS.validation.required('Password');
    } else if (password.length < 8) {
      newErrors.password = ERRORS.auth.weakPassword;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = ERRORS.validation.required('Confirm Password');
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await signUp(email.trim(), password, {
        full_name: name.trim(),
      });

      if (result.error) {
        Alert.alert('Signup Failed', result.error.message || 'Failed to create account');
        return;
      }

      // Check if email confirmation is required
      if (result.data?.user && !result.data.session) {
        Alert.alert(
          'Verify Your Email',
          'We sent you a confirmation email. Please check your inbox and click the link to verify your account.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
        return;
      }

      // Successfully signed up and logged in
      // Show option to join existing household or create new one
      Alert.alert(
        'Welcome to HomieLife! 🎉',
        'Would you like to join an existing household or create a new one?',
        [
          {
            text: 'Join Existing',
            onPress: () => router.replace('/(auth)/join-household'),
          },
          {
            text: 'Create New',
            onPress: () => router.replace('/(auth)/onboarding'),
          },
        ],
        { cancelable: false }
      );
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
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
            {/* Header */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>Create Account 🏠</Text>
              <Text style={styles.subtitle}>Join your family's home management</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={[styles.input, errors.name ? styles.inputError : undefined]}
                  placeholder="Your name"
                  placeholderTextColor={colors.text.tertiary}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) {
                      setErrors({ ...errors, name: undefined });
                    }
                  }}
                  autoCapitalize="words"
                  editable={!loading}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

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
                <TextInput
                  style={[styles.input, errors.password ? styles.inputError : undefined]}
                  placeholder="Min 8 characters"
                  placeholderTextColor={colors.text.tertiary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors({ ...errors, password: undefined });
                    }
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                />
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={[styles.input, errors.confirmPassword ? styles.inputError : undefined]}
                  placeholder="Re-enter password"
                  placeholderTextColor={colors.text.tertiary}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: undefined });
                    }
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                />
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              {/* Invitation Code Option */}
              <View style={styles.inviteOption}>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Have an invitation code?</Text>
                  <View style={styles.dividerLine} />
                </View>
                <TouchableOpacity
                  style={styles.inviteButton}
                  onPress={() => router.push('/(auth)/join-household')}
                  disabled={loading}
                >
                  <Text style={styles.inviteButtonText}>Enter Code</Text>
                </TouchableOpacity>
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                style={[styles.signupButton, loading && styles.buttonDisabled]}
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.text.inverse} />
                ) : (
                  <Text style={styles.signupButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Sign In Link */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login')}
                disabled={loading}
              >
                <Text style={styles.signInLink}>Sign In</Text>
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
  inputError: {
    borderColor: colors.error.default,
  },
  errorText: {
    ...Typography.bodySmall,
    color: colors.error.default,
    marginTop: Spacing.xs,
  },
  signupButton: {
    backgroundColor: colors.primary.default,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    ...Typography.button,
    color: colors.text.inverse,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  signInText: {
    ...Typography.bodyMedium,
    color: colors.text.secondary,
  },
  signInLink: {
    ...Typography.bodyMedium,
    color: colors.primary.default,
    fontWeight: '600',
  },
  inviteOption: {
    marginVertical: Spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  dividerText: {
    ...Typography.bodySmall,
    color: colors.text.secondary,
    paddingHorizontal: Spacing.sm,
  },
  inviteButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: colors.primary.default,
    alignItems: 'center',
  },
  inviteButtonText: {
    ...Typography.bodyMedium,
    color: colors.primary.default,
    fontWeight: '600',
  },
});