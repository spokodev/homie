# 🚀 ШВИДКИЙ СТАРТ HOMIE

## ✅ Все готово для запуску!

### 1. База даних Supabase
✅ **Підключення налаштовано**
- URL: `https://ojmmvaoztddrgvthcjit.supabase.co`
- Ключі додані в `.env.local`

**Запустіть SQL скрипт:**
1. Відкрийте: https://supabase.com/dashboard/project/ojmmvaoztddrgvthcjit/sql
2. Скопіюйте весь вміст файлу `SETUP-SUPABASE.sql`
3. Вставте в SQL Editor
4. Натисніть "Run"

### 2. Запуск на iPhone

**Варіант А: Expo Go (швидко)**
```bash
cd homie-app
npx expo start
```
- Скануйте QR код в Expo Go

**Варіант Б: Development Build**
```bash
cd homie-app
npx expo run:ios --device
```

### 3. GitHub
✅ **Repository підключено**
```bash
git add .
git commit -m "Initial Homie setup"
git push -u origin main
```

### 4. Apple Developer
✅ **Налаштовано**
- Team ID: `26667929BT`
- Bundle ID: `com.spoko-dev.homie`

### 5. TestFlight Deploy
```bash
cd homie-app
eas build --platform ios --profile production
eas submit --platform ios
```

## 📱 Структура проекту

```
/Homie
├── homie-app/           # React Native проект
│   ├── app/            # Екрани
│   ├── src/            # Компоненти
│   └── .env.local      # Ваші ключі
├── Homie-docs/         # Документація
└── SETUP-SUPABASE.sql  # SQL для бази даних
```

## 🔑 Ваші дані (вже налаштовані)

✅ **Supabase**: ojmmvaoztddrgvthcjit
✅ **Bundle ID**: com.spoko-dev.homie
✅ **Team ID**: 26667929BT
✅ **GitHub**: github.com/spokodev/homie
✅ **Domain**: tryhomie.app

## ⚡ Команди

```bash
# Перейти в проект
cd /Users/yarchik/Homie/homie-app

# Запустити
npm start

# iOS симулятор
npm run ios

# Побудувати для TestFlight
eas build --platform ios
```

## 🎯 Що далі?

1. ✅ Запустіть SQL в Supabase
2. ✅ Протестуйте в Expo Go
3. ⏳ Налаштуйте RevenueCat для підписок
4. ⏳ Додайте Sentry для моніторингу

---

**Проект готовий до запуску! 🎉**