# 📱 Нативні білди БЕЗ Expo

## iOS білд через Xcode (без Expo)

### Крок 1: Відкрийте проект в Xcode
```bash
cd /Users/yarchik/Homie/homie-app/ios
open HomieLife.xcworkspace
```

### Крок 2: В Xcode:
1. Виберіть **HomieLife** схему зверху
2. Виберіть ваш пристрій або **Any iOS Device**
3. Перейдіть в **Signing & Capabilities**:
   - Team: Виберіть ваш Apple Developer Team (26667929BT)
   - Bundle Identifier: `com.spokodev.homie`
   - Автоматично створяться сертифікати

### Крок 3: Створіть архів
**Варіант А - через Xcode UI:**
1. Product → Archive
2. Почекайте 5-10 хвилин
3. Xcode Organizer відкриється автоматично

**Варіант Б - через термінал (вже запущено):**
```bash
cd /Users/yarchik/Homie/homie-app/ios
xcodebuild -workspace HomieLife.xcworkspace \
  -scheme HomieLife \
  -configuration Release \
  archive \
  -archivePath build/HomieLife.xcarchive \
  -allowProvisioningUpdates
```

### Крок 4: Експорт IPA
```bash
xcodebuild -exportArchive \
  -archivePath build/HomieLife.xcarchive \
  -exportPath build/ \
  -exportOptionsPlist ExportOptions.plist
```

### Крок 5: Завантажте в TestFlight
**Через Xcode Organizer:**
1. Виберіть архів
2. Натисніть **Distribute App**
3. Виберіть **App Store Connect**
4. Upload

**Через Transporter:**
1. Завантажте Transporter з Mac App Store
2. Перетягніть IPA файл
3. Натисніть Deliver

## Android білд через Gradle (без Expo)

### Крок 1: Встановіть Java JDK
```bash
# Якщо ще не встановлено:
brew install openjdk@17
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Крок 2: Створіть Release APK
```bash
cd /Users/yarchik/Homie/homie-app/android
./gradlew clean
./gradlew assembleRelease
```

### Крок 3: Знайдіть APK
```bash
# APK буде тут:
ls -la app/build/outputs/apk/release/app-release.apk
```

### Крок 4: Підпишіть APK (опційно)
Якщо потрібен підписаний APK:
```bash
# Створіть keystore (один раз):
keytool -genkey -v -keystore my-release-key.keystore \
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Підпишіть APK:
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore my-release-key.keystore \
  app/build/outputs/apk/release/app-release.apk my-key-alias
```

## 🎯 Переваги нативних білдів:

✅ **Повний контроль** - ви бачите всі налаштування
✅ **Швидкість** - 5-10 хвилин локально
✅ **Без Expo** - чистий React Native
✅ **Без черг** - миттєвий старт
✅ **Безкоштовно** - крім Apple Developer ($99/рік)

## 📊 Поточний статус:

- **iOS архів:** Зараз створюється через xcodebuild
- **Android:** Потребує Java JDK для білду

## 🔧 Troubleshooting:

### iOS: "No account for team"
- Відкрийте Xcode
- Preferences → Accounts
- Додайте ваш Apple ID
- Виберіть team в проекті

### iOS: "No provisioning profile"
- Xcode → Preferences → Accounts
- Виберіть team → Download Manual Profiles
- Або використайте `-allowProvisioningUpdates` флаг

### Android: "Java not found"
- Встановіть JDK 17 через Homebrew
- Перезапустіть термінал після додавання PATH

## 📱 Результат:

**iOS:**
- `.xcarchive` для Xcode Organizer
- `.ipa` файл для TestFlight/App Store

**Android:**
- `.apk` файл для прямої установки
- `.aab` для Google Play (використайте `bundleRelease` замість `assembleRelease`)

---

**Головне:** Тепер ви маєте повний контроль над білдами без будь-яких Expo залежностей!