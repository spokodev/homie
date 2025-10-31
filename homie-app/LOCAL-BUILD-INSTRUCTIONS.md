# 🚀 Локальні білди HomieLife (без EAS черг!)

## ✅ Що вже зроблено:
1. Згенеровані нативні проекти (ios/ та android/)
2. Встановлений CocoaPods
3. Зупинені EAS білди які були в черзі

## 🔧 Що потрібно зробити вам в терміналі:

### Крок 1: Налаштуйте Xcode
```bash
# Виконайте цю команду в терміналі (потрібен пароль):
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# Перевірте що все працює:
xcodebuild -version
```

### Крок 2: Встановіть iOS залежності
```bash
cd /Users/yarchik/Homie/homie-app

# Встановіть UTF-8 encoding для CocoaPods
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# Встановіть pods
cd ios && pod install && cd ..
```

### Крок 3: Запустіть білд iOS (5-10 хвилин)
```bash
# Для тестування на симуляторі:
npx expo run:ios

# Для release білду (для реального пристрою):
npx expo run:ios --configuration Release --device
```

### Крок 4: Запустіть білд Android (5-10 хвилин)
```bash
# Для debug APK:
npx expo run:android

# Для release APK:
npx expo run:android --variant release
```

## 📦 Де знайти файли після білду:

### iOS (.app файл):
- **Debug:** `ios/build/Build/Products/Debug-iphonesimulator/HomieLife.app`
- **Release:** `ios/build/Build/Products/Release-iphoneos/HomieLife.app`

Щоб створити .ipa файл для TestFlight:
```bash
cd ios
xcodebuild -workspace HomieLife.xcworkspace \
  -scheme HomieLife \
  -configuration Release \
  -archivePath build/HomieLife.xcarchive \
  archive

xcodebuild -exportArchive \
  -archivePath build/HomieLife.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath build/
```

### Android (.apk файл):
- **Debug:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release:** `android/app/build/outputs/apk/release/app-release.apk`

## 🎯 Переваги локальних білдів:

✅ **Без черг** - білд починається миттєво (не як EAS де 40+ хвилин чекання)
✅ **Без лімітів** - скільки завгодно білдів
✅ **Швидше** - 5-10 хвилин замість 20-30
✅ **Дебаг** - можна відкрити проект в Xcode/Android Studio
✅ **Безкоштовно** - не потрібно платити за EAS Priority

## ❗ Якщо виникнуть помилки:

### iOS помилка "No provisioning profile":
1. Відкрийте `ios/HomieLife.xcworkspace` в Xcode
2. Виберіть HomieLife target
3. В Signing & Capabilities виберіть ваш Team
4. Xcode автоматично створить provisioning profile

### Android помилка "SDK not found":
```bash
# Встановіть Android SDK:
brew install --cask android-studio
# Або завантажте з https://developer.android.com/studio
```

### CocoaPods помилка:
```bash
# Очистіть кеш:
cd ios
pod deintegrate
pod cache clean --all
pod install
```

## 🚀 Альтернатива: GitHub Actions

Якщо хочете автоматичні білди без локального налаштування, я можу допомогти налаштувати GitHub Actions:
- Безкоштовно для публічних репозиторіїв
- 2000 хвилин/місяць для приватних
- Білди починаються одразу (без черг)
- Автоматичне завантаження в TestFlight/Play Store

## 📝 Примітки:

- Перший білд займе більше часу (кешування залежностей)
- Release білди потребують підписання сертифікатами
- Android білд працює на будь-якій ОС, iOS тільки на macOS
- Нативні папки (ios/, android/) вже згенеровані і готові до використання

---

**Головне:** Виконайте команди з Кроку 1 і 2 в терміналі, потім запустіть білди!