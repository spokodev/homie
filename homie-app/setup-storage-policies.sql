-- ============================================
-- Storage Bucket Policies for HomieLife App
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. TASK-PHOTOS BUCKET POLICIES
-- ============================================

-- Allow authenticated users to view photos in their household
CREATE POLICY "Users can view task photos in their household"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-photos' AND
  EXISTS (
    SELECT 1 FROM task_photos tp
    JOIN tasks t ON t.id = tp.task_id
    JOIN members m ON m.household_id = t.household_id
    WHERE
      tp.photo_url LIKE '%' || storage.objects.name AND
      m.user_id = auth.uid()
  )
);

-- Allow users to upload photos for tasks they're completing
CREATE POLICY "Users can upload photos for tasks they complete"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-photos' AND
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN members m ON m.household_id = t.household_id
    WHERE
      m.user_id = auth.uid() AND
      (t.assignee_id = m.id OR t.assignee_id IS NULL)
  )
);

-- Allow users to delete their own uploaded photos
CREATE POLICY "Users can delete their own task photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-photos' AND
  EXISTS (
    SELECT 1 FROM task_photos tp
    JOIN members m ON m.id = tp.uploaded_by
    WHERE
      tp.photo_url LIKE '%' || storage.objects.name AND
      m.user_id = auth.uid()
  )
);

-- 2. AVATARS BUCKET POLICIES
-- ============================================

-- Allow users to view all avatars in their household
CREATE POLICY "Users can view avatars in their household"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' AND
  EXISTS (
    SELECT 1 FROM members m1
    JOIN members m2 ON m1.household_id = m2.household_id
    WHERE
      m1.user_id = auth.uid() AND
      (m2.avatar LIKE '%' || storage.objects.name OR
       storage.objects.name LIKE m2.id::text || '/%')
  )
);

-- Allow users to upload/update their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  EXISTS (
    SELECT 1 FROM members m
    WHERE
      m.user_id = auth.uid() AND
      storage.objects.name LIKE m.id::text || '/%'
  )
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  EXISTS (
    SELECT 1 FROM members m
    WHERE
      m.user_id = auth.uid() AND
      storage.objects.name LIKE m.id::text || '/%'
  )
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  EXISTS (
    SELECT 1 FROM members m
    WHERE
      m.user_id = auth.uid() AND
      storage.objects.name LIKE m.id::text || '/%'
  )
);

-- 3. VERIFY BUCKETS EXIST
-- ============================================
SELECT
  name,
  public,
  created_at,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name IN ('task-photos', 'avatars');

-- 4. UPDATE BUCKET SETTINGS (Optional)
-- ============================================

-- Set file size limit to 5MB for task photos
UPDATE storage.buckets
SET file_size_limit = 5242880, -- 5MB in bytes
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
WHERE name = 'task-photos';

-- Set file size limit to 2MB for avatars
UPDATE storage.buckets
SET file_size_limit = 2097152, -- 2MB in bytes
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE name = 'avatars';

-- Make buckets public for reading (optional - depends on your security needs)
-- UPDATE storage.buckets SET public = true WHERE name IN ('task-photos', 'avatars');

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Storage policies created successfully!' as status;