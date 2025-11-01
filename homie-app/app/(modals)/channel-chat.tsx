import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useChatChannel, useLeaveChannel, useToggleChannelMute, useUpdateLastRead } from '@/hooks/useChatChannels';
import { useMessages, useSendMessage, useDeleteMessage } from '@/hooks/useMessages';
import { useToggleReaction } from '@/hooks/useMessageReactions';
import { MessageReactions } from '@/components/Chat/MessageReactions';
import { useHousehold } from '@/contexts/HouseholdContext';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  created_at: string;
  edited_at?: string;
  reply_to_id?: string;
}

export default function ChannelChatScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const { household, member } = useHousehold();

  const [message, setMessage] = useState('');
  const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const { data: channel, isLoading: channelLoading } = useChatChannel(channelId);
  const { data: messages = [], isLoading: messagesLoading } = useMessages(household?.id, channelId);
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();
  const toggleReaction = useToggleReaction();
  const leaveChannel = useLeaveChannel();
  const toggleMute = useToggleChannelMute();
  const updateLastRead = useUpdateLastRead();

  // Update last read when opening channel
  useEffect(() => {
    if (channelId && member?.id) {
      updateLastRead.mutate({
        channelId,
        memberId: member.id,
      });
    }
  }, [channelId, member?.id]);

  // Subscribe to new messages
  useEffect(() => {
    if (!channelId) return;

    const channel = supabase
      .channel(`channel-messages-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        () => {
          // Refetch messages
          // React Query will handle this automatically
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  const handleSend = async () => {
    if (!message.trim() || !household?.id || !member?.id) return;

    const messageText = message.trim();
    setMessage('');

    try {
      await sendMessage.mutateAsync({
        content: messageText,
        household_id: household.id,
        member_id: member.id,
        member_name: member.name,
        member_avatar: member.avatar,
        channel_id: channelId,
      } as any);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessage(messageText);
    }
  };

  const handleDeleteMessage = (messageToDelete: Message) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (!household?.id) return;
            deleteMessage.mutate({
              messageId: messageToDelete.id,
              householdId: household.id,
              channelId,
            });
          },
        },
      ]
    );
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!household?.id) return;

    toggleReaction.mutate({
      messageId,
      emoji,
      householdId: household.id,
    });

    setShowReactionsFor(null);
  };

  const handleMessageLongPress = (msg: Message) => {
    const isOwnMessage = msg.sender_id === member?.id;
    const isAdmin = member?.role === 'admin';

    const options: any[] = [
      {
        text: 'Add Reaction',
        onPress: () => setShowReactionsFor(msg.id),
      },
    ];

    if (isOwnMessage || isAdmin) {
      options.push({
        text: 'Delete',
        style: 'destructive',
        onPress: () => handleDeleteMessage(msg),
      });
    }

    options.push({
      text: 'Cancel',
      style: 'cancel',
    });

    Alert.alert('Message Options', undefined, options);
  };

  const handleChannelOptions = () => {
    if (!channel || !member) return;

    const currentMember = channel.members?.find(m => m.member_id === member.id);
    const isMuted = currentMember?.is_muted || false;
    const canLeave = channel.type !== 'general' && !channel.is_default;

    const options: any[] = [];

    // Mute/Unmute
    options.push({
      text: isMuted ? 'Unmute' : 'Mute',
      onPress: () => {
        if (!household?.id) return;
        toggleMute.mutate({
          channelId: channel.id,
          memberId: member.id,
          isMuted: !isMuted,
        });
      },
    });

    // View members (for group channels)
    if (channel.type === 'group') {
      options.push({
        text: 'View Members',
        onPress: () => {
          Alert.alert(
            'Channel Members',
            channel.members?.map(m => m.member_name).join('\n') || 'No members'
          );
        },
      });
    }

    // Leave channel (except general/default)
    if (canLeave) {
      options.push({
        text: 'Leave Channel',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Leave Channel',
            'Are you sure you want to leave this channel?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Leave',
                style: 'destructive',
                onPress: () => {
                  if (!household?.id) return;
                  leaveChannel.mutate(
                    {
                      channelId: channel.id,
                      memberId: member.id,
                      householdId: household.id,
                    },
                    {
                      onSuccess: () => {
                        router.back();
                      },
                    }
                  );
                },
              },
            ]
          );
        },
      });
    }

    options.push({
      text: 'Cancel',
      style: 'cancel',
    });

    Alert.alert('Channel Options', undefined, options);
  };

  const getChannelTitle = () => {
    if (!channel) return 'Chat';

    if (channel.type === 'direct') {
      // Show other member's name
      const otherMember = channel.members?.find(m => m.member_id !== member?.id);
      return otherMember?.member_name || 'Direct Message';
    }

    if (channel.type === 'private') {
      return 'My Notes';
    }

    return channel.name || 'Channel';
  };

  const getChannelIcon = () => {
    if (!channel) return '💬';
    return channel.icon || '💬';
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === member?.id;

    return (
      <TouchableOpacity
        onLongPress={() => handleMessageLongPress(item)}
        activeOpacity={0.7}
        style={styles.messageContainer}
      >
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}>
          {!isOwnMessage && (
            <Text style={styles.senderName}>{item.sender_name}</Text>
          )}
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.timestamp,
            isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp,
          ]}>
            {new Date(item.created_at).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
            {item.edited_at && ' (edited)'}
          </Text>
        </View>

        <MessageReactions
          messageId={item.id}
          onReact={(emoji) => handleReaction(item.id, emoji)}
          showPicker={showReactionsFor === item.id}
          currentMemberId={member?.id}
        />
      </TouchableOpacity>
    );
  };

  if (channelLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!channel) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Channel not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `${getChannelIcon()} ${getChannelTitle()}`,
          headerRight: () => (
            <TouchableOpacity onPress={handleChannelOptions}>
              <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        {messagesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.border} />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start the conversation!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !message.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
          >
            <Ionicons
              name="send"
              size={20}
              color={message.trim() ? colors.card : colors.border}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
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
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: colors.background,
  },
  emptyText: {
    ...Typography.body,
    color: colors.text,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  messagesList: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  messageContainer: {
    marginBottom: Spacing.md,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: Spacing.md,
    borderRadius: BorderRadius.large,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  senderName: {
    ...Typography.labelSmall,
    color: colors.primary,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  messageText: {
    ...Typography.body,
  },
  ownMessageText: {
    color: colors.card,
  },
  otherMessageText: {
    color: colors.text,
  },
  timestamp: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    fontSize: 11,
  },
  ownTimestamp: {
    color: colors.card + 'CC',
  },
  otherTimestamp: {
    color: colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: BorderRadius.large,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    maxHeight: 100,
    ...Typography.body,
    color: colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
});
