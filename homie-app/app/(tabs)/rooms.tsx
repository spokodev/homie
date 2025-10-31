import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/theme';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useRooms, Room } from '@/hooks/useRooms';
import { NetworkErrorView } from '@/components/NetworkErrorView';

export default function RoomsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { household } = useHousehold();
  const { data: rooms = [], isLoading, error, isError, refetch } = useRooms(household?.id);
  const styles = createStyles(colors);

  const handleAddRoom = () => {
    router.push('/(modals)/add-room');
  };

  const handleRoomPress = (room: Room) => {
    router.push({
      pathname: '/(modals)/room-details',
      params: { roomId: room.id, roomName: room.name },
    });
  };

  const renderRoom = ({ item }: { item: Room }) => (
    <TouchableOpacity style={styles.roomCard} onPress={() => handleRoomPress(item)}>
      <View style={styles.roomIconContainer}>
        <Text style={styles.roomIcon}>{item.icon}</Text>
      </View>
      <Text style={styles.roomName} numberOfLines={1}>
        {item.name}
      </Text>
      {item.notes_count !== undefined && item.notes_count > 0 && (
        <View style={styles.notesCountBadge}>
          <Ionicons name="document-text" size={12} color={colors.white} />
          <Text style={styles.notesCountText}>{item.notes_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="home-outline" size={64} color={colors.gray500} />
      <Text style={styles.emptyStateTitle}>No rooms yet</Text>
      <Text style={styles.emptyStateText}>
        Add rooms to organize your household tasks and notes
      </Text>
      <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddRoom}>
        <Ionicons name="add" size={20} color={colors.white} />
        <Text style={styles.emptyStateButtonText}>Add First Room</Text>
      </TouchableOpacity>
    </View>
  );

  // Show error state with retry option
  if (isError && !isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <NetworkErrorView
          onRetry={() => refetch()}
          message="Failed to load rooms"
          retrying={false}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Rooms & Notes</Text>
        {rooms.length > 0 && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddRoom}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Rooms Grid */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading rooms...</Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          renderItem={renderRoom}
          numColumns={2}
          contentContainerStyle={styles.roomsList}
          ListEmptyComponent={renderEmptyState}
          columnWrapperStyle={rooms.length > 0 ? styles.row : undefined}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...Typography.h3,
    color: colors.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent + '30',
    justifyContent: 'center',
    alignItems: 'center',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.h4,
    color: colors.error,
    marginTop: Spacing.md,
  },
  errorHint: {
    ...Typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  roomsList: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
  },
  roomCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    margin: Spacing.xs,
    alignItems: 'center',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  roomIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  roomIcon: {
    fontSize: 32,
  },
  roomName: {
    ...Typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  notesCountBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    gap: 2,
  },
  notesCountText: {
    ...Typography.labelSmall,
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyStateTitle: {
    ...Typography.h4,
    color: colors.text,
    marginTop: Spacing.md,
  },
  emptyStateText: {
    ...Typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  emptyStateButtonText: {
    ...Typography.button,
    color: colors.white,
  },
});