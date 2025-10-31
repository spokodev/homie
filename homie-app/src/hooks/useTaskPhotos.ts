import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useHousehold } from '@/contexts/HouseholdContext';
import * as ImagePicker from 'expo-image-picker';
// import * as ImageManipulator from 'expo-image-manipulator';

export interface TaskPhoto {
  id: string;
  task_id: string;
  photo_url: string;
  uploaded_by: string;
  caption?: string;
  uploaded_at: string;
  uploader?: {
    name: string;
    avatar?: string;
  };
}

interface UploadPhotoInput {
  taskId: string;
  uri: string;
  caption?: string;
}

const STORAGE_BUCKET = 'task-photos';
const MAX_PHOTOS_PER_TASK = 3;
// const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB - Reserved for future image validation

/**
 * Hook to fetch photos for a specific task
 */
export function useTaskPhotos(taskId?: string) {
  return useQuery<TaskPhoto[]>({
    queryKey: ['task-photos', taskId],
    queryFn: async () => {
      if (!taskId) return [];

      const { data, error } = await supabase
        .from('task_photos')
        .select(`
          *,
          uploader:members!task_photos_uploaded_by_fkey(
            id,
            name,
            avatar
          )
        `)
        .eq('task_id', taskId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!taskId,
  });
}

/**
 * Hook to upload a photo for a task
 */
export function useUploadTaskPhoto() {
  const queryClient = useQueryClient();
  const { member, household } = useHousehold();

  return useMutation({
    mutationFn: async ({ taskId, uri, caption }: UploadPhotoInput) => {
      if (!member || !household) {
        throw new Error('No member or household found');
      }

      // Check if task already has max photos
      const { count } = await supabase
        .from('task_photos')
        .select('*', { count: 'exact', head: true })
        .eq('task_id', taskId);

      if (count && count >= MAX_PHOTOS_PER_TASK) {
        throw new Error(`Maximum ${MAX_PHOTOS_PER_TASK} photos allowed per task`);
      }

      // Skip compression for now - use original image
      // TODO: Re-enable compression when expo-image-manipulator is fixed
      // const compressedImage = await ImageManipulator.manipulateAsync(
      //   uri,
      //   [{ resize: { width: 1920 } }], // Max width 1920px
      //   { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      // );

      // Create file path
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const fileName = `${household.id}/${taskId}/${timestamp}_${randomStr}.jpg`;

      // Convert URI to blob
      const response = await fetch(uri); // Use original uri instead of compressed
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName);

      // Save photo record to database
      const { data: photoRecord, error: dbError } = await supabase
        .from('task_photos')
        .insert({
          task_id: taskId,
          photo_url: publicUrl,
          uploaded_by: member.id,
          caption,
        })
        .select()
        .single();

      if (dbError) {
        // If database insert fails, delete the uploaded file
        await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([fileName]);
        throw dbError;
      }

      return photoRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-photos', data.task_id] });
    },
  });
}

/**
 * Hook to delete a task photo
 */
export function useDeleteTaskPhoto() {
  const queryClient = useQueryClient();
  const { member } = useHousehold();

  return useMutation({
    mutationFn: async (photoId: string) => {
      if (!member) {
        throw new Error('No member found');
      }

      // Get photo details
      const { data: photo, error: fetchError } = await supabase
        .from('task_photos')
        .select('*')
        .eq('id', photoId)
        .single();

      if (fetchError) throw fetchError;

      // Check if user can delete this photo
      if (photo.uploaded_by !== member.id) {
        throw new Error('You can only delete your own photos');
      }

      // Extract file path from URL
      const urlParts = photo.photo_url.split('/');
      const filePath = urlParts.slice(-3).join('/'); // household_id/task_id/filename.jpg

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('task_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      return photo;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-photos', data.task_id] });
    },
  });
}

/**
 * Hook to pick an image from camera or gallery
 */
export function useImagePicker() {
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    return {
      camera: cameraStatus === 'granted',
      library: libraryStatus === 'granted',
    };
  };

  const pickImageFromLibrary = async () => {
    const permissions = await requestPermissions();
    if (!permissions.library) {
      throw new Error('Camera roll permissions are required');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  };

  const takePhotoWithCamera = async () => {
    const permissions = await requestPermissions();
    if (!permissions.camera) {
      throw new Error('Camera permissions are required');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  };

  return {
    pickImageFromLibrary,
    takePhotoWithCamera,
    requestPermissions,
  };
}

/**
 * Generate thumbnail URL from original photo URL
 */
export function getThumbnailUrl(photoUrl: string): string {
  // For now, return the same URL
  // In future, we can implement thumbnail generation
  return photoUrl;
}

/**
 * Check if user can upload photos for a task
 */
export async function canUploadPhoto(taskId: string, userId?: string): Promise<boolean> {
  if (!userId) return false;

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      id,
      assignee_id,
      household_id,
      members!inner(
        id,
        user_id
      )
    `)
    .eq('id', taskId)
    .eq('members.user_id', userId)
    .single();

  if (error || !data) return false;

  // User can upload if they're assigned to the task or task is unassigned
  return !data.assignee_id || data.assignee_id === (data.members as any)[0]?.id;
}