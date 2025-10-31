import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, Shadows } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useMembers } from '@/hooks/useMembers';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/components/Toast';
import { TextInput } from '@/components/Form/TextInput';
import { COMMON_ICONS } from '@/constants';
import { supabase } from '@/lib/supabase';
import { trackEvent, ANALYTICS_EVENTS } from '@/utils/analytics';

export default function HouseholdSettingsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { household, member } = useHousehold();
  const { data: members = [] } = useMembers(household?.id);
  const { data: tasks = [] } = useTasks(household?.id);
  const { showToast } = useToast();

  const [isEditingName, setIsEditingName] = useState(false);
  const [householdName, setHouseholdName] = useState(household?.name || '');
  const [selectedIcon, setSelectedIcon] = useState(household?.icon || '🏠');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = member?.role === 'admin';

  const handleSaveName = async () => {
    if (!household || !isAdmin) return;

    if (!householdName.trim()) {
      showToast('Household name cannot be empty', 'error');
      return;
    }

    if (householdName.trim().length < 2) {
      showToast('Household name must be at least 2 characters', 'error');
      return;
    }

    if (householdName.trim().length > 50) {
      showToast('Household name must be less than 50 characters', 'error');
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('households')
        .update({
          name: householdName.trim(),
          icon: selectedIcon,
        })
        .eq('id', household.id);

      if (error) throw error;

      trackEvent(ANALYTICS_EVENTS.HOUSEHOLD_UPDATED, {
        household_id: household.id,
        updated_fields: ['name', 'icon'],
      });

      showToast('Household updated successfully!', 'success');
      setIsEditingName(false);
      // Household will update automatically via real-time subscription
    } catch (error: any) {
      showToast(error.message || 'Failed to update household', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHousehold = () => {
    if (!household || !isAdmin) return;

    Alert.alert(
      'Delete Household',
      `Are you sure you want to delete "${household.name}"? This will permanently delete all members, tasks, and data. This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);

              // Delete household (cascade will delete members, tasks, etc.)
              const { error } = await supabase
                .from('households')
                .delete()
                .eq('id', household.id);

              if (error) throw error;

              trackEvent(ANALYTICS_EVENTS.HOUSEHOLD_DELETED, {
                household_id: household.id,
              });

              showToast('Household deleted', 'success');

              // Navigate to onboarding to create/join new household
              router.replace('/(auth)/onboarding');
            } catch (error: any) {
              showToast(error.message || 'Failed to delete household', 'error');
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (!household || !member) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Calculate total points
  const totalPoints = members.reduce((sum, m) => sum + (m.points || 0), 0);

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Household Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Household Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Household Information</Text>

          {isEditingName ? (
            <View style={styles.editCard}>
              {/* Icon Selector */}
              <Text style={styles.label}>Icon</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.iconScroll}
              >
                {COMMON_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconButton,
                      selectedIcon === icon && styles.iconButtonSelected,
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Text style={styles.iconButtonText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Name Input */}
              <TextInput
                label="Household Name"
                value={householdName}
                onChangeText={setHouseholdName}
                placeholder="e.g., Smith Family"
                autoFocus
                maxLength={50}
                editable={!isSaving}
                containerStyle={styles.inputContainer}
              />

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => {
                    setHouseholdName(household.name);
                    setSelectedIcon(household.icon || '🏠');
                    setIsEditingName(false);
                  }}
                  disabled={isSaving}
                >
                  <Text style={styles.buttonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleSaveName}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={colors.card} />
                  ) : (
                    <Text style={styles.buttonPrimaryText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.infoCard}>
              <View style={styles.householdInfo}>
                <Text style={styles.householdIcon}>{household.icon || '🏠'}</Text>
                <View style={styles.householdDetails}>
                  <Text style={styles.householdName}>{household.name}</Text>
                  <Text style={styles.householdMeta}>
                    {members.length} {members.length === 1 ? 'member' : 'members'}
                  </Text>
                </View>
              </View>
              {isAdmin && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsEditingName(true)}
                >
                  <Ionicons name="pencil" size={20} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Household Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={32} color={colors.primary} />
              <Text style={styles.statValue}>{members.length}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={32} color={colors.success} />
              <Text style={styles.statValue}>{tasks.length}</Text>
              <Text style={styles.statLabel}>Active Tasks</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="star" size={32} color={colors.accent} />
              <Text style={styles.statValue}>{totalPoints}</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
          </View>
        </View>

        {/* Captain Rotation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Captain System</Text>
          <View style={styles.infoCard}>
            <View style={styles.captainInfo}>
              <Ionicons name="shield" size={24} color={colors.primary} />
              <View style={styles.captainDetails}>
                <Text style={styles.captainTitle}>Weekly Rotation</Text>
                <Text style={styles.captainSubtext}>
                  Captain changes every 7 days automatically
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="information-circle" size={20} color={colors.secondary} />
            <Text style={styles.tipText}>
              The captain is responsible for keeping the household organized and motivated!
            </Text>
          </View>
        </View>

        {/* Admin Actions */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Actions</Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(modals)/household-members')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="people-outline" size={20} color={colors.primary} />
                <Text style={styles.menuItemText}>Manage Members</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
            </TouchableOpacity>
          </View>
        )}

        {/* Danger Zone */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
            <TouchableOpacity
              style={[styles.menuItem, styles.dangerItem]}
              onPress={handleDeleteHousehold}
              disabled={isDeleting}
            >
              <View style={styles.menuItemLeft}>
                {isDeleting ? (
                  <ActivityIndicator size="small" color={colors.error} />
                ) : (
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                )}
                <Text style={[styles.menuItemText, { color: colors.error }]}>
                  Delete Household
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.error} />
            </TouchableOpacity>
            <View style={styles.warningCard}>
              <Ionicons name="warning" size={20} color={colors.warning} />
              <Text style={styles.warningText}>
                Deleting the household will permanently remove all members, tasks, and data.
                This action cannot be undone.
              </Text>
            </View>
          </View>
        )}

        {!isAdmin && (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={colors.secondary} />
            <Text style={styles.infoText}>
              Only household admins can modify these settings.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    color: colors.text,
    marginBottom: Spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    ...Shadows.small,
  },
  householdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  householdIcon: {
    fontSize: 48,
    marginRight: Spacing.md,
  },
  householdDetails: {
    flex: 1,
  },
  householdName: {
    ...Typography.h3,
    color: colors.text,
    marginBottom: 4,
  },
  householdMeta: {
    ...Typography.bodyMedium,
    color: colors.textSecondary,
  },
  editButton: {
    padding: Spacing.sm,
  },
  editCard: {
    backgroundColor: colors.card,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    ...Shadows.small,
  },
  label: {
    ...Typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  iconScroll: {
    marginBottom: Spacing.md,
  },
  iconButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: Spacing.sm,
  },
  iconButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  iconButtonText: {
    fontSize: 28,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonPrimaryText: {
    ...Typography.bodyLarge,
    color: colors.card,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: colors.border,
  },
  buttonSecondaryText: {
    ...Typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.small,
  },
  statValue: {
    ...Typography.h2,
    color: colors.text,
    marginVertical: Spacing.xs,
  },
  statLabel: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  captainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  captainDetails: {
    flex: 1,
  },
  captainTitle: {
    ...Typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  captainSubtext: {
    ...Typography.bodyMedium,
    color: colors.textSecondary,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.secondary + '15',
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  tipText: {
    ...Typography.bodyMedium,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuItemText: {
    ...Typography.bodyLarge,
    color: colors.text,
  },
  dangerItem: {
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: colors.warning + '15',
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  warningText: {
    ...Typography.bodyMedium,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  infoText: {
    ...Typography.bodyMedium,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
});
