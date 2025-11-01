import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useNotificationPreferences, useToggleNotification } from '@/hooks/useNotificationPreferences';
import { useToast } from '@/components/Toast';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationSettingItem {
  key: 'task_assigned' | 'task_completed' | 'task_due_soon' | 'new_message' | 'captain_rotation' | 'rating_request';
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const NOTIFICATION_SETTINGS: NotificationSettingItem[] = [
  {
    key: 'task_assigned',
    title: 'Task Assigned',
    description: 'When someone assigns you a task',
    icon: 'checkbox-outline',
  },
  {
    key: 'task_completed',
    title: 'Task Completed',
    description: 'When a household member completes a task',
    icon: 'checkmark-done-outline',
  },
  {
    key: 'task_due_soon',
    title: 'Task Due Soon',
    description: 'Reminders for upcoming task deadlines',
    icon: 'time-outline',
  },
  {
    key: 'new_message',
    title: 'New Messages',
    description: 'When someone sends a message in chat',
    icon: 'chatbubble-outline',
  },
  {
    key: 'captain_rotation',
    title: 'Captain Rotation',
    description: 'When a new captain is selected',
    icon: 'trophy-outline',
  },
  {
    key: 'rating_request',
    title: 'Rating Requests',
    description: 'When you need to rate the captain',
    icon: 'star-outline',
  },
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { member } = useHousehold();
  const { showToast } = useToast();
  const { expoPushToken, enableNotifications, disableNotifications } = useNotifications();

  const { data: preferences, isLoading } = useNotificationPreferences(member?.id);
  const toggleNotification = useToggleNotification();

  const styles = createStyles(colors);

  const handleToggle = async (key: NotificationSettingItem['key'], currentValue: boolean) => {
    if (!member?.id) return;

    try {
      await toggleNotification.mutateAsync({
        memberId: member.id,
        type: key,
        enabled: !currentValue,
      });
    } catch (error) {
      console.error('Failed to toggle notification:', error);
      showToast('Failed to update notification settings', 'error');
    }
  };

  const handleTogglePushNotifications = async (enabled: boolean) => {
    try {
      if (enabled) {
        await enableNotifications();
        showToast('Push notifications enabled', 'success');
      } else {
        await disableNotifications();
        showToast('Push notifications disabled', 'success');
      }
    } catch (error) {
      console.error('Failed to toggle push notifications:', error);
      showToast('Failed to update push notifications', 'error');
    }
  };

  const allNotificationsEnabled = preferences ? Object.values({
    task_assigned: preferences.task_assigned,
    task_completed: preferences.task_completed,
    task_due_soon: preferences.task_due_soon,
    new_message: preferences.new_message,
    captain_rotation: preferences.captain_rotation,
    rating_request: preferences.rating_request,
  }).every(Boolean) : false;

  const handleToggleAll = async (enabled: boolean) => {
    if (!member?.id) return;

    try {
      for (const setting of NOTIFICATION_SETTINGS) {
        await toggleNotification.mutateAsync({
          memberId: member.id,
          type: setting.key,
          enabled,
        });
      }
      showToast(enabled ? 'All notifications enabled' : 'All notifications disabled', 'success');
    } catch (error) {
      console.error('Failed to toggle all notifications:', error);
      showToast('Failed to update notification settings', 'error');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Settings</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Push Notifications Master Toggle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Push Notifications</Text>
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Push Notifications</Text>
              <Text style={styles.settingDescription}>
                {expoPushToken ? 'Receiving notifications' : 'Notifications are disabled'}
              </Text>
            </View>
            <Switch
              value={!!expoPushToken}
              onValueChange={handleTogglePushNotifications}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={expoPushToken ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>

        {/* Toggle All */}
        {expoPushToken && (
          <View style={styles.section}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>All Notifications</Text>
                <Text style={styles.settingDescription}>
                  {allNotificationsEnabled ? 'All types enabled' : 'Some types disabled'}
                </Text>
              </View>
              <Switch
                value={allNotificationsEnabled}
                onValueChange={handleToggleAll}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={allNotificationsEnabled ? colors.primary : colors.textSecondary}
                disabled={!expoPushToken}
              />
            </View>
          </View>
        )}

        {/* Individual Settings */}
        {expoPushToken && preferences && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notification Types</Text>
            {NOTIFICATION_SETTINGS.map((setting, index) => (
              <View
                key={setting.key}
                style={[
                  styles.settingItem,
                  index > 0 && styles.settingItemBorder,
                ]}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name={setting.icon} size={20} color={colors.primary} />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>{setting.title}</Text>
                    <Text style={styles.settingDescription}>{setting.description}</Text>
                  </View>
                </View>
                <Switch
                  value={preferences[setting.key]}
                  onValueChange={() => handleToggle(setting.key, preferences[setting.key])}
                  trackColor={{ false: colors.border, true: colors.primary + '60' }}
                  thumbColor={preferences[setting.key] ? colors.primary : colors.textSecondary}
                  disabled={toggleNotification.isPending}
                />
              </View>
            ))}
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            You can customize which notifications you receive. Make sure notifications are enabled
            in your device settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...Typography.h4,
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: BorderRadius.large,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...Typography.h5,
    color: colors.text,
  },
  sectionLabel: {
    ...Typography.labelMedium,
    color: colors.textSecondary,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  settingItemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    ...Typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  infoText: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
});
