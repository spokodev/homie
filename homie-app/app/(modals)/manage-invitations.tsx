import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useHouseholdInvitations, useCancelInvitation } from '@/hooks/useInvitations';
import { useToast } from '@/components/Toast';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';

export default function ManageInvitationsModal() {
  const router = useRouter();
  const { household, member } = useHousehold();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<string | null>(null);

  const { data: invitations, isLoading, refetch } = useHouseholdInvitations(household?.id || '');
  const cancelInvitation = useCancelInvitation();

  // Filter active invitations
  const activeInvitations = invitations?.filter(
    inv => inv.status === 'pending' && new Date(inv.expires_at) > new Date()
  ) || [];

  const expiredInvitations = invitations?.filter(
    inv => inv.status === 'expired' || (inv.status === 'pending' && new Date(inv.expires_at) <= new Date())
  ) || [];

  const claimedInvitations = invitations?.filter(inv => inv.status === 'claimed') || [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    showToast('Code copied!', 'success');
  };

  const handleCancelInvitation = (invitationId: string, memberName: string) => {
    Alert.alert(
      'Cancel Invitation',
      `Are you sure you want to cancel the invitation for ${memberName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelInvitation.mutateAsync(invitationId);
              showToast('Invitation cancelled', 'success');
              refetch();
            } catch (error: any) {
              showToast(error.message || 'Failed to cancel invitation', 'error');
            }
          },
        },
      ]
    );
  };

  const formatTimeLeft = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expired';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Less than 1h';
  };

  const InvitationCard = ({ invitation, type }: { invitation: any; type: 'active' | 'expired' | 'claimed' }) => {
    const isExpanded = selectedInvitation === invitation.id;

    return (
      <View style={styles.invitationCard}>
        <TouchableOpacity
          style={styles.invitationHeader}
          onPress={() => setSelectedInvitation(isExpanded ? null : invitation.id)}
        >
          <View style={styles.invitationInfo}>
            <Text style={styles.memberName}>{invitation.member_name}</Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>Code:</Text>
              <Text style={styles.codeText}>{invitation.invite_code}</Text>
              {type === 'active' && (
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => handleCopyCode(invitation.invite_code)}
                >
                  <Ionicons name="copy-outline" size={16} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            {type === 'active' && (
              <Text style={styles.expiresText}>{formatTimeLeft(invitation.expires_at)}</Text>
            )}
            {type === 'claimed' && invitation.claimed_at && (
              <Text style={styles.claimedText}>
                Joined {new Date(invitation.claimed_at).toLocaleDateString()}
              </Text>
            )}
          </View>

          <View style={styles.invitationActions}>
            {type === 'active' && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelInvitation(invitation.id, invitation.member_name)}
              >
                <Ionicons name="close-circle" size={24} color={Colors.error} />
              </TouchableOpacity>
            )}
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && type === 'active' && (
          <View style={styles.qrSection}>
            <QRCode
              value={`homielife://join/${invitation.invite_code}`}
              size={150}
              backgroundColor="white"
              color={Colors.primary}
            />
            <Text style={styles.qrHint}>Scan to join</Text>
          </View>
        )}
      </View>
    );
  };

  if (!member || member.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Invitations</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>Only admins can manage invitations</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Invitations</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            {/* Active Invitations */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Active Invitations ({activeInvitations.length})
              </Text>
              {activeInvitations.length > 0 ? (
                activeInvitations.map(invitation => (
                  <InvitationCard
                    key={invitation.id}
                    invitation={invitation}
                    type="active"
                  />
                ))
              ) : (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>No active invitations</Text>
                </View>
              )}
            </View>

            {/* Claimed Invitations */}
            {claimedInvitations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Joined Members ({claimedInvitations.length})
                </Text>
                {claimedInvitations.map(invitation => (
                  <InvitationCard
                    key={invitation.id}
                    invitation={invitation}
                    type="claimed"
                  />
                ))}
              </View>
            )}

            {/* Expired Invitations */}
            {expiredInvitations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Expired ({expiredInvitations.length})
                </Text>
                {expiredInvitations.map(invitation => (
                  <InvitationCard
                    key={invitation.id}
                    invitation={invitation}
                    type="expired"
                  />
                ))}
              </View>
            )}

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color={Colors.secondary} />
              <Text style={styles.infoText}>
                Invitations expire 7 days after creation. Members can join by entering
                the code or scanning the QR code when signing up.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray300,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h5,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  invitationCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  invitationInfo: {
    flex: 1,
  },
  memberName: {
    ...Typography.bodyLarge,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  codeLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  codeText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  copyButton: {
    marginLeft: Spacing.xs,
    padding: 4,
  },
  expiresText: {
    ...Typography.bodySmall,
    color: Colors.warning,
  },
  claimedText: {
    ...Typography.bodySmall,
    color: Colors.success,
  },
  invitationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cancelButton: {
    padding: 4,
  },
  qrSection: {
    alignItems: 'center',
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: Spacing.md,
  },
  qrHint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  emptySection: {
    padding: Spacing.lg,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  emptySectionText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.secondary + '15',
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoText: {
    ...Typography.bodySmall,
    color: Colors.text,
    flex: 1,
    lineHeight: 18,
  },
});