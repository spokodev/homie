import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import {
  useChatChannels,
  useCreateDirectChannel,
  useCreateGroupChannel,
  useCreatePrivateChannel,
  ChatChannel,
} from '@/hooks/useChatChannels';
import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';

export default function ChannelsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { household, member } = useHousehold();
  const { showToast } = useToast();

  const { data: channels = [], isLoading } = useChatChannels(household?.id);
  const { data: members = [] } = useMembers(household?.id);
  const createDirect = useCreateDirectChannel();
  const createGroup = useCreateGroupChannel();
  const createPrivate = useCreatePrivateChannel();

  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupIcon, setGroupIcon] = useState('👥');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const styles = createStyles(colors);

  const handleCreatePrivate = async () => {
    if (!household?.id) return;

    try {
      const result = await createPrivate.mutateAsync({ householdId: household.id });
      showToast('Private notes created', 'success');
      router.push({
        pathname: '/(modals)/channel-chat',
        params: { channelId: result.channelId },
      });
    } catch (error: any) {
      showToast(error.message || 'Failed to create private channel', 'error');
    }
  };

  const handleCreateDirect = (memberId: string) => {
    if (!household?.id) return;

    Alert.alert(
      'Create Direct Message',
      `Start a conversation with ${members.find(m => m.id === memberId)?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            try {
              const result = await createDirect.mutateAsync({
                otherMemberId: memberId,
                householdId: household.id,
              });
              showToast('DM created', 'success');
              router.push({
                pathname: '/(modals)/channel-chat',
                params: { channelId: result.channelId },
              });
            } catch (error: any) {
              showToast(error.message || 'Failed to create DM', 'error');
            }
          },
        },
      ]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      showToast('Please enter a group name', 'error');
      return;
    }

    if (selectedMembers.length === 0) {
      showToast('Please select at least one member', 'error');
      return;
    }

    if (!household?.id) return;

    try {
      const result = await createGroup.mutateAsync({
        name: groupName.trim(),
        icon: groupIcon,
        memberIds: selectedMembers,
        householdId: household.id,
      });
      showToast('Group created', 'success');
      setShowGroupForm(false);
      setGroupName('');
      setGroupIcon('👥');
      setSelectedMembers([]);
      router.push({
        pathname: '/(modals)/channel-chat',
        params: { channelId: result.channelId },
      });
    } catch (error: any) {
      showToast(error.message || 'Failed to create group', 'error');
    }
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const getChannelDisplayName = (channel: ChatChannel) => {
    if (channel.name) return channel.name;

    if (channel.type === 'direct') {
      // Find the other member
      const otherMember = channel.members?.find(m => m.member_id !== member?.id);
      return otherMember?.member_name || 'Direct Message';
    }

    if (channel.type === 'private') {
      return 'My Notes';
    }

    return 'Channel';
  };

  const getChannelSubtitle = (channel: ChatChannel) => {
    if (channel.description) return channel.description;

    if (channel.type === 'direct') {
      return 'Direct message';
    }

    if (channel.type === 'group') {
      const count = channel.members?.length || 0;
      return `${count} member${count !== 1 ? 's' : ''}`;
    }

    if (channel.type === 'private') {
      return 'Your private notes';
    }

    return 'Household chat';
  };

  const renderChannel = ({ item }: { item: ChatChannel }) => (
    <TouchableOpacity
      style={styles.channelCard}
      onPress={() => {
        router.push({
          pathname: '/(modals)/channel-chat',
          params: { channelId: item.id },
        });
      }}
    >
      <View style={styles.channelIcon}>
        <Text style={styles.channelIconText}>{item.icon}</Text>
      </View>
      <View style={styles.channelInfo}>
        <View style={styles.channelHeader}>
          <Text style={styles.channelName}>{getChannelDisplayName(item)}</Text>
          {item.is_default && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
        </View>
        <Text style={styles.channelSubtitle}>{getChannelSubtitle(item)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderCreateMenu = () => (
    <View style={styles.createMenu}>
      <TouchableOpacity
        style={styles.createMenuItem}
        onPress={() => {
          setShowCreateMenu(false);
          setShowGroupForm(true);
        }}
      >
        <Ionicons name="people" size={24} color={colors.primary} />
        <Text style={styles.createMenuText}>Create Group</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.createMenuItem}
        onPress={() => {
          setShowCreateMenu(false);
          handleCreatePrivate();
        }}
      >
        <Ionicons name="document-text" size={24} color={colors.primary} />
        <Text style={styles.createMenuText}>Private Notes</Text>
      </TouchableOpacity>

      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Start Direct Message</Text>

      {members
        .filter(m => m.id !== member?.id)
        .map(m => (
          <TouchableOpacity
            key={m.id}
            style={styles.memberItem}
            onPress={() => {
              setShowCreateMenu(false);
              handleCreateDirect(m.id);
            }}
          >
            <Text style={styles.memberAvatar}>{m.avatar}</Text>
            <Text style={styles.memberName}>{m.name}</Text>
          </TouchableOpacity>
        ))}
    </View>
  );

  const renderGroupForm = () => (
    <View style={styles.groupForm}>
      <Text style={styles.formTitle}>Create Group</Text>

      <View style={styles.formField}>
        <Text style={styles.label}>Group Icon</Text>
        <TextInput
          style={styles.iconInput}
          value={groupIcon}
          onChangeText={setGroupIcon}
          maxLength={2}
        />
      </View>

      <View style={styles.formField}>
        <Text style={styles.label}>Group Name</Text>
        <TextInput
          style={styles.input}
          value={groupName}
          onChangeText={setGroupName}
          placeholder="e.g., Weekend Plans"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.formField}>
        <Text style={styles.label}>Members</Text>
        {members
          .filter(m => m.id !== member?.id)
          .map(m => (
            <TouchableOpacity
              key={m.id}
              style={styles.memberCheckbox}
              onPress={() => toggleMember(m.id)}
            >
              <Ionicons
                name={selectedMembers.includes(m.id) ? 'checkbox' : 'square-outline'}
                size={24}
                color={selectedMembers.includes(m.id) ? colors.primary : colors.gray400}
              />
              <Text style={styles.memberAvatar}>{m.avatar}</Text>
              <Text style={styles.memberName}>{m.name}</Text>
            </TouchableOpacity>
          ))}
      </View>

      <View style={styles.formActions}>
        <Button
          title="Cancel"
          onPress={() => {
            setShowGroupForm(false);
            setGroupName('');
            setGroupIcon('👥');
            setSelectedMembers([]);
          }}
          variant="outline"
          style={{ flex: 1 }}
        />
        <Button
          title="Create"
          onPress={handleCreateGroup}
          style={{ flex: 1 }}
          loading={createGroup.isPending}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Channels</Text>
        <TouchableOpacity
          onPress={() => setShowCreateMenu(!showCreateMenu)}
          style={styles.addButton}
        >
          <Ionicons name={showCreateMenu ? 'close' : 'add'} size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {showCreateMenu && renderCreateMenu()}
      {showGroupForm && renderGroupForm()}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading channels...</Text>
        </View>
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(item) => item.id}
          renderItem={renderChannel}
          contentContainerStyle={styles.channelsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.gray400} />
              <Text style={styles.emptyText}>No channels yet</Text>
              <Text style={styles.emptyHint}>Create a channel to get started</Text>
            </View>
          }
        />
      )}
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
    padding: Spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    ...Typography.h3,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: Spacing.xs,
  },
  createMenu: {
    backgroundColor: colors.card,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    maxHeight: 400,
  },
  createMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
    backgroundColor: colors.background,
  },
  createMenuText: {
    ...Typography.bodyLarge,
    color: colors.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: Spacing.md,
  },
  sectionTitle: {
    ...Typography.labelMedium,
    color: colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.xs,
  },
  memberAvatar: {
    fontSize: 24,
  },
  memberName: {
    ...Typography.bodyLarge,
    color: colors.text,
  },
  groupForm: {
    backgroundColor: colors.card,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  formTitle: {
    ...Typography.h4,
    color: colors.text,
    marginBottom: Spacing.md,
  },
  formField: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.labelMedium,
    color: colors.text,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  input: {
    ...Typography.bodyLarge,
    color: colors.text,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
  },
  iconInput: {
    ...Typography.bodyLarge,
    color: colors.text,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    fontSize: 32,
    textAlign: 'center',
    width: 80,
  },
  memberCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: Spacing.md,
  },
  channelsList: {
    padding: Spacing.lg,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  channelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  channelIconText: {
    fontSize: 24,
  },
  channelInfo: {
    flex: 1,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  channelName: {
    ...Typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
  },
  defaultBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
  },
  defaultBadgeText: {
    ...Typography.labelSmall,
    color: colors.accent,
    fontSize: 10,
  },
  channelSubtitle: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyText: {
    ...Typography.h4,
    color: colors.text,
    marginTop: Spacing.md,
  },
  emptyHint: {
    ...Typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
