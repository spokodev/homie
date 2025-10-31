import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/theme';
import {
  useTaskPhotos,
  useUploadTaskPhoto,
  useDeleteTaskPhoto,
  useImagePicker,
} from '@/hooks/useTaskPhotos';
import { useToast } from '@/components/Toast';

interface PhotoUploadProps {
  taskId: string;
  disabled?: boolean;
  onPhotosChange?: (photos: any[]) => void;
}

export function PhotoUpload({ taskId, disabled, onPhotosChange }: PhotoUploadProps) {
  const { data: photos = [], isLoading } = useTaskPhotos(taskId);
  const uploadPhoto = useUploadTaskPhoto();
  const deletePhoto = useDeleteTaskPhoto();
  const { pickImageFromLibrary, takePhotoWithCamera } = useImagePicker();
  const { showToast } = useToast();
  const [showOptions, setShowOptions] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const MAX_PHOTOS = 3;
  const canAddMore = photos.length < MAX_PHOTOS;

  const handleAddPhoto = () => {
    if (!canAddMore) {
      showToast(`Maximum ${MAX_PHOTOS} photos allowed`, 'error');
      return;
    }
    setShowOptions(true);
  };

  const handleImageSource = async (source: 'camera' | 'library') => {
    setShowOptions(false);

    try {
      const uri = source === 'camera'
        ? await takePhotoWithCamera()
        : await pickImageFromLibrary();

      if (uri) {
        setUploading(true);
        await uploadPhoto.mutateAsync({
          taskId,
          uri,
          caption: '',
        });
        showToast('Photo uploaded successfully!', 'success');
        onPhotosChange?.(photos);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to upload photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePhoto.mutateAsync(photoId);
              showToast('Photo deleted', 'success');
              onPhotosChange?.(photos.filter(p => p.id !== photoId));
            } catch (error: any) {
              showToast(error.message || 'Failed to delete photo', 'error');
            }
          },
        },
      ]
    );
  };

  const handleViewPhoto = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Photos ({photos.length}/{MAX_PHOTOS})
        </Text>
        {canAddMore && !disabled && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddPhoto}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="camera" size={18} color={Colors.white} />
                <Text style={styles.addButtonText}>Add Photo</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {photos.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photosScroll}
        >
          {photos.map((photo) => (
            <View key={photo.id} style={styles.photoWrapper}>
              <TouchableOpacity
                onPress={() => handleViewPhoto(photo.photo_url)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: photo.photo_url }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              </TouchableOpacity>
              {!disabled && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePhoto(photo.id)}
                >
                  <Ionicons name="close-circle" size={24} color={Colors.error} />
                </TouchableOpacity>
              )}
              {photo.uploader && (
                <View style={styles.uploaderInfo}>
                  <Text style={styles.uploaderName}>
                    {photo.uploader.avatar || '📸'} {photo.uploader.name}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={48} color={Colors.gray400} />
          <Text style={styles.emptyText}>No photos yet</Text>
          {canAddMore && !disabled && (
            <Text style={styles.emptyHint}>Tap "Add Photo" to upload</Text>
          )}
        </View>
      )}

      {/* Photo Source Options Modal */}
      <Modal
        visible={showOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Photo Source</Text>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleImageSource('camera')}
            >
              <Ionicons name="camera" size={24} color={Colors.primary} />
              <Text style={styles.optionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleImageSource('library')}
            >
              <Ionicons name="images" size={24} color={Colors.primary} />
              <Text style={styles.optionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, styles.cancelButton]}
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Full Screen Photo Viewer */}
      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <TouchableOpacity
          style={styles.photoViewerOverlay}
          activeOpacity={1}
          onPress={() => setSelectedPhoto(null)}
        >
          <Image
            source={{ uri: selectedPhoto || '' }}
            style={styles.fullScreenPhoto}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.closeViewer}
            onPress={() => setSelectedPhoto(null)}
          >
            <Ionicons name="close" size={32} color={Colors.white} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.labelLarge,
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  addButtonText: {
    ...Typography.bodyMedium,
    color: Colors.white,
    fontWeight: '600',
  },
  photosScroll: {
    flexGrow: 0,
  },
  photoWrapper: {
    marginRight: Spacing.sm,
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.gray200,
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
  },
  uploaderInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: Spacing.xs,
    borderBottomLeftRadius: BorderRadius.medium,
    borderBottomRightRadius: BorderRadius.medium,
  },
  uploaderName: {
    ...Typography.bodySmall,
    color: Colors.white,
    fontSize: 10,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.medium,
  },
  emptyText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  emptyHint: {
    ...Typography.bodySmall,
    color: Colors.gray500,
    marginTop: Spacing.xs,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  modalTitle: {
    ...Typography.h5,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.gray100,
    marginBottom: Spacing.sm,
  },
  optionText: {
    ...Typography.bodyLarge,
    color: Colors.text,
  },
  cancelButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray300,
    marginTop: Spacing.sm,
    justifyContent: 'center',
  },
  cancelText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
  },
  // Photo viewer styles
  photoViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenPhoto: {
    width: '100%',
    height: '100%',
  },
  closeViewer: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: Spacing.sm,
  },
});