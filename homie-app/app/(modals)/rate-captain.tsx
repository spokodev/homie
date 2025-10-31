import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, Shadows } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useRateCaptain, useHasRatedCaptain } from '@/hooks/useRatings';
import { useHousehold } from '@/contexts/HouseholdContext';
import { TextArea } from '@/components/Form/TextArea';
import { useToast } from '@/components/Toast';
import { trackEvent, ANALYTICS_EVENTS } from '@/utils/analytics';

export default function RateCaptainModal() {
  const router = useRouter();
  const colors = useThemeColors();
  const { captainId, captainName, rotationStart, rotationEnd } =
    useLocalSearchParams<{
      captainId: string;
      captainName: string;
      rotationStart: string;
      rotationEnd: string;
    }>();
  const { household, member } = useHousehold();
  const { showToast } = useToast();

  const rateCaptain = useRateCaptain();
  const { data: hasRated, isLoading: checkingRated } = useHasRatedCaptain(
    household?.id,
    captainId,
    member?.id,
    rotationStart
  );

  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    if (selectedRating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }

    if (!household || !member || !captainId || !rotationStart || !rotationEnd) {
      showToast('Missing required information', 'error');
      return;
    }

    try {
      await rateCaptain.mutateAsync({
        household_id: household.id,
        captain_member_id: captainId,
        rated_by_member_id: member.id,
        rating: selectedRating,
        comment: comment.trim() || undefined,
        rotation_start: rotationStart,
        rotation_end: rotationEnd,
      });

      // Track rating event
      trackEvent(ANALYTICS_EVENTS.CAPTAIN_RATED, {
        rating: selectedRating,
        has_comment: !!comment.trim(),
      });

      showToast('Rating submitted successfully!', 'success');
      router.back();
    } catch (error: any) {
      showToast(error.message || 'Failed to submit rating', 'error');
    }
  };

  if (checkingRated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (hasRated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelButton}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rate Captain</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.alreadyRatedContainer}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          <Text style={styles.alreadyRatedTitle}>Already Rated!</Text>
          <Text style={styles.alreadyRatedText}>
            You've already submitted your rating for this captain rotation.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Captain</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={rateCaptain.isPending}>
          {rateCaptain.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.submitButton}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Captain Info */}
        <View style={styles.captainInfoCard}>
          <Ionicons name="person-circle" size={48} color={colors.primary} />
          <Text style={styles.captainNameText}>{captainName}</Text>
          <Text style={styles.captainSubtext}>Captain of the Week</Text>
        </View>

        {/* Star Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How did they do?</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setSelectedRating(star)}
                style={styles.starButton}
                disabled={rateCaptain.isPending}
              >
                <Ionicons
                  name={selectedRating >= star ? 'star' : 'star-outline'}
                  size={48}
                  color={selectedRating >= star ? colors.accent : colors.gray500}
                />
              </TouchableOpacity>
            ))}
          </View>
          {selectedRating > 0 && (
            <Text style={styles.ratingLabel}>{getRatingLabel(selectedRating)}</Text>
          )}
        </View>

        {/* Comment (Optional) */}
        <TextArea
          label="Comments (Optional)"
          placeholder="Share your feedback..."
          value={comment}
          onChangeText={setComment}
          numberOfLines={4}
          maxLength={300}
          showCounter
          editable={!rateCaptain.isPending}
          containerStyle={styles.section}
        />

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>⭐</Text>
          <Text style={styles.infoText}>
            High ratings (4-5 stars) award bonus points to the captain!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getRatingLabel(rating: number): string {
  const labels = {
    1: 'Needs Improvement',
    2: 'Below Average',
    3: 'Good',
    4: 'Great!',
    5: 'Excellent! ⭐',
  };
  return labels[rating as keyof typeof labels] || '';
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerTitle: {
    ...Typography.h4,
    color: colors.text,
  },
  cancelButton: {
    ...Typography.bodyLarge,
    color: colors.textSecondary,
  },
  submitButton: {
    ...Typography.bodyLarge,
    color: colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alreadyRatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  alreadyRatedTitle: {
    ...Typography.h3,
    color: colors.text,
    marginTop: Spacing.md,
  },
  alreadyRatedText: {
    ...Typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  captainInfoCard: {
    backgroundColor: colors.card,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  captainNameText: {
    ...Typography.h3,
    color: colors.text,
    marginTop: Spacing.sm,
  },
  captainSubtext: {
    ...Typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: colors.text,
    marginBottom: Spacing.md,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  starButton: {
    padding: Spacing.xs,
  },
  ratingLabel: {
    ...Typography.bodyLarge,
    color: colors.accent,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.accent + '15',
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
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
});
