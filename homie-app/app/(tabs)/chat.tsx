import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useMessages, useSendMessage, useDeleteMessage, useEditMessage, Message } from '@/hooks/useMessages';
import { useToggleReaction, COMMON_REACTIONS } from '@/hooks/useMessageReactions';
import { MessageReactions } from '@/components/Chat/MessageReactions';
import { useToast } from '@/components/Toast';
import { logError } from '@/utils/errorHandling';

export default function ChatScreen() {
  const colors = useThemeColors();
  const { household, member } = useHousehold();
  const { data: messages = [], isLoading, error } = useMessages(household?.id);
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();
  const editMessage = useEditMessage();
  const toggleReaction = useToggleReaction();
  const { showToast } = useToast();


  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const styles = createStyles(colors);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText || !household?.id || !member?.id) return;

    setIsSending(true);
    try {
      // If editing, update the message
      if (editingMessage) {
        await editMessage.mutateAsync({
          messageId: editingMessage.id,
          content: trimmedText,
          householdId: household.id,
        });
        setEditingMessage(null);
        showToast('Message updated', 'success');
      } else {
        // Otherwise send new message
        await sendMessage.mutateAsync({
          household_id: household.id,
          member_id: member.id,
          member_name: member.name,
          member_avatar: member.avatar,
          content: trimmedText,
          type: 'text',
          reply_to_id: replyingTo?.id,
        } as any);
        setReplyingTo(null);
      }
      setInputText('');
    } catch (err: any) {
      logError(err, editingMessage ? 'Edit Message' : 'Send Message');
      showToast(`Failed to ${editingMessage ? 'edit' : 'send'} message. Please try again.`, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = (message: Message) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMessage.mutateAsync({
                messageId: message.id,
                householdId: message.household_id,
              });
              showToast('Message deleted', 'success');
            } catch (err: any) {
              logError(err, 'Delete Message');
              showToast('Failed to delete message', 'error');
            }
          },
        },
      ]
    );
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!household?.id) return;

    try {
      await toggleReaction.mutateAsync({
        messageId,
        emoji,
        householdId: household.id,
      });
      setShowReactionsFor(null);
    } catch (error: any) {
      logError(error, 'Toggle Reaction');
      showToast('Failed to add reaction', 'error');
    }
  };

  const handleMessageLongPress = (message: Message) => {
    const isOwnMessage = message.member_id === member?.id;
    const isAdmin = member?.role === 'admin';

    const options = [];

    // Add reaction option
    options.push({
      text: '👍 Add Reaction',
      onPress: () => setShowReactionsFor(message.id),
    });

    // Reply option (for all messages)
    options.push({
      text: 'Reply',
      onPress: () => {
        setReplyingTo(message);
        setInputText('');
      },
    });

    // Edit option (only for own messages)
    if (isOwnMessage && message.type === 'text') {
      options.push({
        text: 'Edit',
        onPress: () => {
          setEditingMessage(message);
          setInputText(message.content);
          setReplyingTo(null);
        },
      });
    }

    // Only allow deleting own messages or if admin
    if (isOwnMessage || isAdmin) {
      options.push({
        text: 'Delete',
        style: 'destructive' as const,
        onPress: () => handleDeleteMessage(message),
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' as const });

    if (options.length > 1) {
      Alert.alert('Message Options', undefined, options);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.member_id === member?.id;
    const isSystemMessage = item.type === 'system';

    if (isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.content}</Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isOwnMessage && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{item.member_avatar || '😊'}</Text>
          </View>
        )}
        <View style={{ maxWidth: '75%' }}>
          <Pressable
            onLongPress={() => handleMessageLongPress(item)}
            style={[
              styles.messageBubble,
              isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
            ]}
          >
            <Text style={[
              styles.senderName,
              isOwnMessage && styles.ownSenderName
            ]}>
              {item.member_name || 'Unknown'}
            </Text>
            <Text
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              ]}
            >
              {item.content}
            </Text>
            <Text
              style={[
                styles.timestamp,
                isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp,
              ]}
            >
              {formatTimestamp(item.created_at)}
            </Text>
          </Pressable>

          <MessageReactions
            messageId={item.id}
            onReact={(emoji) => handleReaction(item.id, emoji)}
            showPicker={showReactionsFor === item.id}
            currentMemberId={member?.id}
          />
        </View>
        {isOwnMessage && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{item.member_avatar || '😊'}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color={colors.text.tertiary} />
      <Text style={styles.emptyStateTitle}>No messages yet</Text>
      <Text style={styles.emptyStateText}>
        Start a conversation with your household!
      </Text>
      <TouchableOpacity
        style={styles.createChannelButton}
        onPress={() => router.push('/(modals)/channels')}
      >
        <Ionicons name="add-circle" size={20} color={colors.primary.default} />
        <Text style={styles.createChannelButtonText}>Create Group or Direct Message</Text>
      </TouchableOpacity>
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error.default} />
          <Text style={styles.errorText}>Failed to load messages</Text>
          <Text style={styles.errorHint}>Please check your connection and try again</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Family Chat',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                console.log('Opening channels modal');
                router.push('/(modals)/channels');
              }}
              style={{
                marginRight: 8,
                backgroundColor: colors.primary.default,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                New
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>General Chat</Text>
            <Text style={styles.subtitle}>{household?.name || 'Loading...'}</Text>
          </View>

        {/* Messages List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.default} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          {/* Edit/Reply indicator */}
          {(editingMessage || replyingTo) && (
            <View style={styles.inputModeIndicator}>
              <View style={styles.inputModeContent}>
                <Ionicons
                  name={editingMessage ? 'pencil' : 'return-down-forward'}
                  size={16}
                  color={colors.primary.default}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputModeText}>
                    {editingMessage ? 'Editing message' : `Replying to ${replyingTo?.member_name}`}
                  </Text>
                  {replyingTo && (
                    <Text style={styles.inputModePreview} numberOfLines={1}>
                      {replyingTo.content}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setEditingMessage(null);
                  setReplyingTo(null);
                  setInputText('');
                }}
              >
                <Ionicons name="close" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={colors.text.tertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isSending}
            />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <Ionicons name="send" size={20} color={colors.text.inverse} />
            )}
          </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  title: {
    ...Typography.h3,
    color: colors.text.primary,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.h4,
    color: colors.error.default,
    marginTop: Spacing.md,
  },
  errorHint: {
    ...Typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  messagesList: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyStateTitle: {
    ...Typography.h4,
    color: colors.text.primary,
    marginTop: Spacing.md,
  },
  emptyStateText: {
    ...Typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  createChannelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: colors.primary.default + '15',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.large,
    marginTop: Spacing.lg,
  },
  createChannelButtonText: {
    ...Typography.bodyMedium,
    color: colors.primary.default,
    fontWeight: '600',
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: Spacing.xs,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  avatar: {
    fontSize: 18,
  },
  messageBubble: {
    padding: Spacing.md,
    borderRadius: BorderRadius.large,
  },
  ownMessageBubble: {
    backgroundColor: colors.primary.default,
    borderBottomRightRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  otherMessageBubble: {
    backgroundColor: colors.surface.primary,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border.default,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  senderName: {
    ...Typography.labelSmall,
    color: colors.primary.default,
    marginBottom: 2,
    fontWeight: '600',
  },
  ownSenderName: {
    color: colors.text.inverse,
    opacity: 0.9,
  },
  messageText: {
    ...Typography.bodyMedium,
    lineHeight: 20,
  },
  ownMessageText: {
    color: colors.text.inverse,
  },
  otherMessageText: {
    color: colors.text.primary,
  },
  timestamp: {
    ...Typography.bodySmall,
    fontSize: 11,
    marginTop: 4,
  },
  ownTimestamp: {
    color: colors.text.inverse,
    opacity: 0.8,
  },
  otherTimestamp: {
    color: colors.text.secondary,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  systemMessageText: {
    ...Typography.bodySmall,
    color: colors.text.secondary,
    backgroundColor: colors.border.default,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  inputContainer: {
    backgroundColor: colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    padding: Spacing.md,
  },
  inputModeIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: colors.primary.default + '15',
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
  },
  inputModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  inputModeText: {
    ...Typography.bodySmall,
    color: colors.primary.default,
    fontWeight: '600',
  },
  inputModePreview: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    ...Typography.bodyMedium,
    color: colors.text.primary,
    backgroundColor: colors.surface.secondary,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingTop: Spacing.sm,
    maxHeight: 100,
    marginRight: Spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.text.tertiary,
    opacity: 0.5,
  },
});