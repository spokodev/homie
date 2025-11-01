import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { TextInput } from '@/components/Form/TextInput';
import { Button } from '@/components/Button/Button';
import { useToast } from '@/components/Toast';
import { useCheckInvitation, useClaimInvitation } from '@/hooks/useInvitations';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function JoinHouseholdScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Check invitation as user types
  const { data: invitation, isLoading: isChecking } = useCheckInvitation(inviteCode);
  const claimInvitation = useClaimInvitation();

  const handleJoinHousehold = async () => {
    if (!inviteCode || inviteCode.length < 4) {
      showToast('Please enter a valid invitation code', 'error');
      return;
    }

    if (!invitation) {
      showToast('Invalid or expired invitation code', 'error');
      return;
    }

    setIsJoining(true);

    try {
      const result = await claimInvitation.mutateAsync(inviteCode);

      if (result.success) {
        showToast(`Welcome to ${invitation.household.name}! 🎉`, 'success');

        // Navigate to main app
        router.replace('/(tabs)/');
      } else {
        showToast(result.message || 'Failed to join household', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to join household', 'error');
    } finally {
      setIsJoining(false);
    }
  };

  const handleSkip = () => {
    // Go to regular onboarding to create new household
    router.replace('/(auth)/onboarding');
  };

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    setShowScanner(false);

    // Parse QR code data (format: homielife://join/CODE)
    const match = data.match(/homielife:\/\/join\/([A-Z0-9]+)/);
    if (match) {
      const code = match[1];
      setInviteCode(code);
      showToast('Code scanned successfully!', 'success');
    } else {
      showToast('Invalid QR code', 'error');
    }
  };

  const openScanner = async () => {
    if (!permission) {
      showToast('Requesting camera permission...', 'info');
      return;
    }
    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        showToast('Camera permission denied', 'error');
        return;
      }
    }
    setShowScanner(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipButton}>Create New</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🏠</Text>
            </View>

            <Text style={styles.title}>Join a Household</Text>
            <Text style={styles.subtitle}>
              Enter the invitation code from your household admin
            </Text>

            {/* Code Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="Invitation Code"
                    placeholder="Enter 6-digit code"
                    value={inviteCode}
                    onChangeText={(text) => setInviteCode(text.toUpperCase())}
                    maxLength={8}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    autoFocus
                    inputStyle={styles.codeInput}
                  />
                </View>
                <TouchableOpacity style={styles.scanButton} onPress={openScanner}>
                  <Ionicons name="qr-code" size={24} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              {isChecking && inviteCode.length >= 4 && (
                <View style={styles.checkingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.checkingText}>Checking...</Text>
                </View>
              )}

              {invitation && !isChecking && (
                <View style={styles.validContainer}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.validText}>
                    Found: {invitation.household.name} {invitation.household.icon}
                  </Text>
                </View>
              )}

              {!invitation && !isChecking && inviteCode.length >= 4 && (
                <View style={styles.invalidContainer}>
                  <Ionicons name="close-circle" size={20} color={Colors.error} />
                  <Text style={styles.invalidText}>Invalid or expired code</Text>
                </View>
              )}
            </View>

            {/* Household Preview */}
            {invitation && (
              <View style={styles.householdPreview}>
                <Text style={styles.previewTitle}>You'll be joining:</Text>
                <View style={styles.householdCard}>
                  <Text style={styles.householdIcon}>{invitation.household.icon}</Text>
                  <View style={styles.householdInfo}>
                    <Text style={styles.householdName}>{invitation.household.name}</Text>
                    <Text style={styles.memberName}>as "{invitation.member_name}"</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Button
                title={isJoining ? 'Joining...' : 'Join Household'}
                onPress={handleJoinHousehold}
                disabled={!invitation || isJoining}
                loading={isJoining}
                style={styles.joinButton}
              />

              <TouchableOpacity
                style={styles.createNewButton}
                onPress={handleSkip}
                disabled={isJoining}
              >
                <Text style={styles.createNewText}>Create a new household instead</Text>
              </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color={Colors.secondary} />
              <Text style={styles.infoText}>
                Invitation codes are provided by household admins and expire after 7 days.
                Ask your admin for a new code if yours has expired.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* QR Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.scannerContainer}>
          <SafeAreaView style={styles.scannerSafeArea}>
            <View style={styles.scannerHeader}>
              <TouchableOpacity onPress={() => setShowScanner(false)}>
                <Ionicons name="close" size={30} color={Colors.white} />
              </TouchableOpacity>
              <Text style={styles.scannerTitle}>Scan QR Code</Text>
              <View style={{ width: 30 }} />
            </View>
          </SafeAreaView>

          <CameraView
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={handleBarCodeScanned}
          />

          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame}>
              <View style={[styles.scannerCorner, styles.scannerCornerTL]} />
              <View style={[styles.scannerCorner, styles.scannerCornerTR]} />
              <View style={[styles.scannerCorner, styles.scannerCornerBL]} />
              <View style={[styles.scannerCorner, styles.scannerCornerBR]} />
            </View>
            <Text style={styles.scannerHint}>
              Point camera at HomieLife QR code
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  skipButton: {
    ...Typography.bodyLarge,
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  codeInput: {
    fontSize: 24,
    letterSpacing: 4,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  checkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  checkingText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  validContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  validText: {
    ...Typography.bodyMedium,
    color: Colors.success,
    fontWeight: '600',
  },
  invalidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  invalidText: {
    ...Typography.bodyMedium,
    color: Colors.error,
  },
  householdPreview: {
    marginBottom: Spacing.xl,
  },
  previewTitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  householdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    gap: Spacing.md,
  },
  householdIcon: {
    fontSize: 40,
  },
  householdInfo: {
    flex: 1,
  },
  householdName: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 4,
  },
  memberName: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  actions: {
    marginBottom: Spacing.xl,
  },
  joinButton: {
    marginBottom: Spacing.md,
  },
  createNewButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  createNewText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    textDecorationLine: 'underline',
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  scanButton: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.gray300,
    padding: Spacing.md,
    marginBottom: 24,
  },
  // QR Scanner styles
  scannerContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  scannerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  scannerTitle: {
    ...Typography.h4,
    color: Colors.white,
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  scannerCorner: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderColor: Colors.white,
  },
  scannerCornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  scannerCornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  scannerCornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  scannerCornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scannerHint: {
    ...Typography.bodyLarge,
    color: Colors.white,
    marginTop: Spacing.xl,
    textAlign: 'center',
  },
});