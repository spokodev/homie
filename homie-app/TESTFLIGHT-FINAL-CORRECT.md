# ✅ TestFlight для HomieLife - ПРАВИЛЬНІ ДАНІ

## 📱 Ваш додаток вже створений в App Store Connect!

### Правильні дані (від вас):
- **Bundle ID:** `com.spoko-dev.homie` (з дефісом!)
- **SKU:** `SPOKOHOMIEAPP`
- **Apple ID:** `6754356088`
- **Team ID:** `26667929BT`

## 🔧 КРОК 1: Оновіть Bundle ID в Xcode

### В Xcode (вже відкритий):
1. Виберіть проект **HomieLife** (синя іконка зліва)
2. Виберіть target **HomieLife**
3. Перейдіть в **General** tab
4. Змініть **Bundle Identifier** на: `com.spoko-dev.homie`
5. В **Signing & Capabilities**:
   - ✅ Automatically manage signing
   - Team: **Yaroslav Hrydkovets (Individual)**

## 🏗️ КРОК 2: Створіть архів

### В Xcode:
1. Виберіть схему **HomieLife** (зверху зліва)
2. Виберіть destination: **Any iOS Device (arm64)**
3. **Product → Archive** (або Cmd+Shift+B)
4. Чекайте 5-10 хвилин

### Або через термінал (після оновлення Bundle ID):
```bash
cd /Users/yarchik/Homie/homie-app/ios
xcodebuild -workspace HomieLife.xcworkspace \
  -scheme HomieLife \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath build/HomieLife.xcarchive \
  archive \
  -allowProvisioningUpdates \
  PRODUCT_BUNDLE_IDENTIFIER=com.spoko-dev.homie
```

## 📤 КРОК 3: Завантажте в TestFlight

### В Xcode Organizer (відкриється після архіву):
1. Виберіть ваш архів
2. Натисніть **Distribute App**
3. **App Store Connect** → Next
4. **Upload** → Next
5. Налаштування:
   - ✅ Include bitcode
   - ✅ Upload symbols
   - ✅ Manage Version and Build Number
6. **Automatically manage signing** → Next
7. **Upload**

### Перевірка в App Store Connect:
1. Відкрийте https://appstoreconnect.apple.com
2. My Apps → **Homie App**
3. TestFlight tab
4. Через 15-30 хв з'явиться ваш білд

## 👥 КРОК 4: Додайте тестерів

### Внутрішні тестери (миттєво):
1. TestFlight → Internal Testing
2. App Store Connect Users → **+**
3. Додайте email адреси (до 100 людей)

### Зовнішні тестери (після перевірки Apple):
1. TestFlight → External Testing
2. **Add External Testers** → Add New Testers
3. Введіть emails (до 10,000 людей)

### Публічне посилання (НАЙКРАЩЕ):
1. External Groups → Add Group
2. Створіть групу "Public Beta"
3. **Enable Public Link**
4. Скопіюйте посилання: `https://testflight.apple.com/join/XXXXXX`
5. Поділіться з ким завгодно!

## 📲 Для тестерів:

1. Встановити **TestFlight** з App Store
2. Відкрити ваше посилання
3. Натиснути **Accept** → **Install**

## ⚠️ Важливі моменти:

### Bundle ID:
- **Правильний:** `com.spoko-dev.homie` (з дефісом)
- **Неправильний:** `com.spokodev.homie` (без дефіса)
- Це критично! Інакше не зможете завантажити в TestFlight

### Version та Build Number:
- Кожен новий білд повинен мати більший Build Number
- В Xcode: General → Identity → Build: збільшіть на 1

### Якщо помилка "Bundle ID not found":
1. Переконайтесь що в Xcode: `com.spoko-dev.homie`
2. В app.json також має бути: `com.spoko-dev.homie`
3. Перезапустіть Xcode після змін

## 🎯 Швидкий чеклист:

- [ ] Bundle ID в Xcode: `com.spoko-dev.homie` ✓
- [ ] Team вибраний: Yaroslav Hrydkovets ✓
- [ ] Archive створений
- [ ] Завантажено в App Store Connect
- [ ] TestFlight активований
- [ ] Публічне посилання створене
- [ ] Тестери можуть встановити

## 📊 Статус:

**App Store Connect:** ✅ Додаток створений (ID: 6754356088)
**Bundle ID:** ⚠️ Потрібно оновити в Xcode на `com.spoko-dev.homie`
**Архів:** ⏳ Готовий до створення після оновлення Bundle ID

## 💡 Наступний крок:

**Зараз в Xcode:**
1. Змініть Bundle ID на `com.spoko-dev.homie`
2. Product → Archive
3. Distribute App → Upload

Через 30 хвилин ваш додаток буде в TestFlight!