import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppStore } from '@/stores/app.store';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useNotifications } from '@/hooks/useNotifications';

export default function SettingsScreen() {
  const router = useRouter();
  const { household } = useHousehold();
  const { colors, colorScheme, toggleTheme, isSystemTheme, setIsSystemTheme } = useTheme();
  const { notificationsEnabled, setNotificationsEnabled } = useAppStore();
  const { enableNotifications, disableNotifications } = useNotifications();

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (value) {
      await enableNotifications();
    } else {
      await disableNotifications();
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This feature is coming soon. For now, please contact support to delete your account.',
      [{ text: 'OK' }]
    );
  };

  const styles = createStyles(colors);

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background.primary }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: themeColors.surface.primary, borderBottomColor: themeColors.border.default }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={themeColors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text.primary }]}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Household Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Household</Text>
          <View style={styles.infoCard}>
            <View style={styles.householdInfo}>
              <Text style={styles.householdIcon}>{household?.icon || '🏠'}</Text>
              <View>
                <Text style={styles.householdName}>{household?.name || 'Loading...'}</Text>
                <Text style={styles.householdLabel}>Your household</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          {/* Theme Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons
                name={colorScheme === 'dark' ? 'moon-outline' : 'sunny-outline'}
                size={20}
                color={colors.primary.default}
              />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Dark Mode</Text>
                <Text style={styles.settingDescription}>
                  {colorScheme === 'dark' ? 'Dark theme enabled' : 'Light theme enabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={colorScheme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border.default, true: colors.primary.default + '50' }}
              thumbColor={colorScheme === 'dark' ? colors.primary.default : colors.border.default}
            />
          </View>

          {/* System Theme Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.primary.default} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Use System Theme</Text>
                <Text style={styles.settingDescription}>
                  Follow your device's appearance settings
                </Text>
              </View>
            </View>
            <Switch
              value={isSystemTheme}
              onValueChange={setIsSystemTheme}
              trackColor={{ false: colors.border.default, true: colors.primary.default + '50' }}
              thumbColor={isSystemTheme ? colors.primary.default : colors.border.default}
            />
          </View>
        </View>

        {/* Task Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Management</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(modals)/recurring-tasks')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="repeat-outline" size={20} color={colors.primary.default} />
              <Text style={styles.menuItemText}>Recurring Tasks</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(modals)/notification-settings')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="settings-outline" size={20} color={colors.primary.default} />
              <Text style={styles.menuItemText}>Notification Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(modals)/notifications')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="list-outline" size={20} color={colors.primary.default} />
              <Text style={styles.menuItemText}>View Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary.default} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Get notified about tasks and updates
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: colors.border.default, true: colors.primary.default + '50' }}
              thumbColor={notificationsEnabled ? colors.primary.default : colors.text.tertiary}
            />
          </View>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary.default} />
              <Text style={styles.menuItemText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary.default} />
              <Text style={styles.menuItemText}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary.default} />
              <Text style={styles.menuItemText}>Version</Text>
            </View>
            <Text style={styles.versionText}>1.0.0</Text>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.error.default }]}>Danger Zone</Text>
          <TouchableOpacity
            style={[styles.menuItem, styles.dangerItem]}
            onPress={handleDeleteAccount}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="trash-outline" size={20} color={colors.error.default} />
              <Text style={[styles.menuItemText, { color: colors.error.default }]}>Delete Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.error.default} />
          </TouchableOpacity>
        </View>

        {/* Coming Soon Note */}
        <View style={styles.comingSoonCard}>
          <Ionicons name="construct" size={24} color={colors.primary.default} />
          <View style={{ flex: 1 }}>
            <Text style={styles.comingSoonTitle}>More Settings Coming Soon</Text>
            <Text style={styles.comingSoonText}>
              Theme customization, language options, and more features are on the way!
            </Text>
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.surface.primary,
  },
  headerTitle: {
    ...Typography.h4,
    color: colors.text.primary,
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
    color: colors.text.primary,
    marginBottom: Spacing.md,
  },
  infoCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    shadowColor: colors.shadow.medium,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  householdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  householdIcon: {
    fontSize: 32,
  },
  householdName: {
    ...Typography.bodyLarge,
    color: colors.text.primary,
    fontWeight: '600',
  },
  householdLabel: {
    ...Typography.bodySmall,
    color: colors.text.secondary,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    shadowColor: colors.shadow.medium,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    ...Typography.bodyLarge,
    color: colors.text.primary,
    marginBottom: 2,
  },
  settingDescription: {
    ...Typography.bodySmall,
    color: colors.text.secondary,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: colors.shadow.medium,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuItemText: {
    ...Typography.bodyLarge,
    color: colors.text.primary,
  },
  versionText: {
    ...Typography.bodyMedium,
    color: colors.text.secondary,
  },
  dangerItem: {
    borderWidth: 1,
    borderColor: colors.error.subtle,
  },
  comingSoonCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary.subtle,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  comingSoonTitle: {
    ...Typography.labelLarge,
    color: colors.text.primary,
    marginBottom: Spacing.xs,
  },
  comingSoonText: {
    ...Typography.bodyMedium,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
