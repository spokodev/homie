import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { validateHouseholdName, validateMemberName } from '@/utils/validation';
import { trackEvent, ANALYTICS_EVENTS } from '@/utils/analytics';

const EMOJI_ICONS = ['🏠', '🏡', '🏘️', '🏰', '🏢', '🏛️', '⛺', '🏕️'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);

  // Track onboarding start
  React.useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_STARTED);
  }, []);

  // Household data
  const [householdName, setHouseholdName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🏠');

  // Member data
  const [memberName, setMemberName] = useState(user?.user_metadata?.full_name || '');
  const [memberAvatar, setMemberAvatar] = useState('😊');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ householdName?: string; memberName?: string }>({});

  const MEMBER_AVATARS = ['😊', '👨', '👩', '👦', '👧', '👴', '👵', '🧒', '👶'];

  const validateStep1 = () => {
    const newErrors: { householdName?: string } = {};

    const householdValidation = validateHouseholdName(householdName);
    if (!householdValidation.isValid) {
      newErrors.householdName = householdValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: { memberName?: string } = {};

    const memberValidation = validateMemberName(memberName);
    if (!memberValidation.isValid) {
      newErrors.memberName = memberValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!validateStep2()) return;
    if (!user) {
      showToast('User not authenticated', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Create household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({
          name: householdName.trim(),
          icon: selectedIcon,
        })
        .select()
        .single();

      if (householdError) throw householdError;

      // Track household created
      trackEvent(ANALYTICS_EVENTS.HOUSEHOLD_CREATED, {
        household_name: householdName,
        household_icon: selectedIcon,
      });

      // 2. Create member (household creator)
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          household_id: household.id,
          user_id: user.id,
          name: memberName.trim(),
          avatar: memberAvatar,
          role: 'admin', // Creator is admin
          type: 'human',
        });

      if (memberError) throw memberError;

      // Track member added
      trackEvent(ANALYTICS_EVENTS.MEMBER_ADDED, {
        member_type: 'human',
        member_role: 'admin',
      });

      // 3. Store household_id in user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { household_id: household.id },
      });

      if (updateError) throw updateError;

      // Track onboarding completed
      trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETED);

      // Success! Navigate to home
      showToast('Welcome to HomieLife! 🎉', 'success');
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      showToast(error.message || 'Failed to create household', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
          <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
          <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
        </View>

        {/* Step 1: Household Setup */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Welcome to HomieLife! 🏠</Text>
            <Text style={styles.stepSubtitle}>
              Let's set up your household to start managing chores together
            </Text>

            <View style={styles.form}>
              <Text style={styles.label}>Household Name</Text>
              <TextInput
                style={[styles.input, errors.householdName ? styles.inputError : undefined]}
                placeholder="e.g., Smith Family, Our Home"
                placeholderTextColor={Colors.gray500}
                value={householdName}
                onChangeText={(text) => {
                  setHouseholdName(text);
                  if (errors.householdName) setErrors({ ...errors, householdName: undefined });
                }}
                autoFocus
                editable={!loading}
              />
              {errors.householdName && (
                <Text style={styles.errorText}>{errors.householdName}</Text>
              )}

              <Text style={[styles.label, { marginTop: Spacing.lg }]}>Choose an Icon</Text>
              <View style={styles.iconGrid}>
                {EMOJI_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconButton,
                      selectedIcon === icon && styles.iconButtonActive,
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Text style={styles.iconEmoji}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Step 2: Your Profile */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Your Profile 👤</Text>
            <Text style={styles.stepSubtitle}>
              Tell us about yourself so your family can recognize you
            </Text>

            <View style={styles.form}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={[styles.input, errors.memberName ? styles.inputError : undefined]}
                placeholder="Enter your name"
                placeholderTextColor={Colors.gray500}
                value={memberName}
                onChangeText={(text) => {
                  setMemberName(text);
                  if (errors.memberName) setErrors({ ...errors, memberName: undefined });
                }}
                editable={!loading}
              />
              {errors.memberName && (
                <Text style={styles.errorText}>{errors.memberName}</Text>
              )}

              <Text style={[styles.label, { marginTop: Spacing.lg }]}>Choose Your Avatar</Text>
              <View style={styles.iconGrid}>
                {MEMBER_AVATARS.map((avatar) => (
                  <TouchableOpacity
                    key={avatar}
                    style={[
                      styles.iconButton,
                      memberAvatar === avatar && styles.iconButtonActive,
                    ]}
                    onPress={() => setMemberAvatar(avatar)}
                  >
                    <Text style={styles.iconEmoji}>{avatar}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoIcon}>💡</Text>
                <Text style={styles.infoText}>
                  You'll be the admin of your household. You can invite other members later!
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep(step - 1)}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextButton, step === 1 && { flex: 1 }]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.nextButtonText}>
                {step === 1 ? 'Next' : 'Complete Setup'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.gray300,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.gray300,
    marginHorizontal: Spacing.sm,
  },
  progressLineActive: {
    backgroundColor: Colors.primary,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  stepSubtitle: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 24,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  label: {
    ...Typography.labelLarge,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  iconButton: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '20',
  },
  iconEmoji: {
    fontSize: 32,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.secondary + '20',
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  infoText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 'auto',
  },
  backButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  backButtonText: {
    ...Typography.button,
    color: Colors.text,
  },
  nextButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  nextButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
});
