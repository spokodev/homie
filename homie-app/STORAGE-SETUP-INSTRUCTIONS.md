# 📸 Налаштування Storage для фотографій

## ✅ Що вже зроблено:

1. **Створено 2 bucket'и в Supabase Storage:**
   - `task-photos` - для фото підтвердження завдань
   - `avatars` - для аватарів користувачів

2. **Створено код для роботи з фото:**
   - `useTaskPhotos` hook - завантаження/видалення фото
   - `PhotoUpload` компонент - UI для роботи з фото
   - Інтеграція в `task-details.tsx`

## ⚠️ ЩО ПОТРІБНО ЗРОБИТИ:

### 1. Налаштувати RLS політики для Storage

**Відкрийте SQL Editor в Supabase:**
https://supabase.com/dashboard/project/ojmmvaoztddrgvthcjit/sql/new

**Виконайте SQL з файлу:**
```bash
cat setup-storage-policies.sql
```

Або скопіюйте та виконайте цей SQL:

```sql
-- Allow authenticated users to view photos
CREATE POLICY "Anyone can view task photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'task-photos');

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload task photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own task photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'task-photos');

-- Similar for avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
```

### 2. Зробити bucket'и публічними (опціонально)

Якщо хочете, щоб фото були доступні без аутентифікації:

**В Supabase Dashboard:**
1. Storage → task-photos → Settings
2. Toggle "Public bucket" → ON
3. Повторити для avatars

### 3. Перевірити налаштування

**Запустіть додаток і перевірте:**
```bash
npx expo start --tunnel
```

1. Відкрийте завдання
2. Натисніть "Add Photo"
3. Виберіть фото з галереї або зробіть нове
4. Переконайтеся, що фото завантажується

## 📁 Структура зберігання:

```
storage/
├── task-photos/
│   └── {household_id}/
│       └── {task_id}/
│           └── {timestamp}_{random}.jpg
└── avatars/
    └── {member_id}/
        └── avatar.jpg
```

## 🔧 Технічні деталі:

### Обмеження:
- **Розмір фото:** максимум 5MB для task-photos, 2MB для avatars
- **Формати:** JPEG, PNG, WebP, HEIC
- **Кількість:** максимум 3 фото на завдання

### Автоматична обробка:
- Стиснення до 80% якості
- Максимальна ширина 1920px
- Автоматичне видалення при видаленні завдання

## 🚨 Важливо:

1. **Обов'язково виконайте SQL для RLS політик!**
   Без них користувачі не зможуть завантажувати фото.

2. **Перевірте permissions в додатку:**
   - Доступ до камери
   - Доступ до галереї

3. **Environment variables:**
   Переконайтеся, що в `.env.local` є:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://ojmmvaoztddrgvthcjit.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## ✅ Після налаштування:

Користувачі зможуть:
- 📸 Додавати до 3 фото при виконанні завдання
- 🖼️ Переглядати фото на весь екран
- 🗑️ Видаляти свої фото
- 👤 Бачити хто завантажив кожне фото

## 🎉 Готово!

Після виконання SQL для політик, функція завантаження фото буде повністю працювати!