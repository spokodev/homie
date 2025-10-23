# 💰 RevenueCat Setup для Homie

## ✅ Що вже готово

### 1. SDK Інтеграція
- ✅ `react-native-purchases` встановлено
- ✅ RevenueCat сервіс створено (`src/lib/revenuecat.ts`)
- ✅ Premium Store (Zustand) налаштовано
- ✅ Екран підписки готовий
- ✅ Hooks для використання (`usePremium`)

### 2. Product IDs
```
PREMIUM_MONTHLY: com.spoko-dev.homie.premium_monthly
PREMIUM_YEARLY: com.spoko-dev.homie.premium_yearly
```

### 3. Ціни
- Monthly: **$4.99/місяць**
- Yearly: **$49.99/рік** (економія $10)

---

## 📋 Покрокова інструкція

### Крок 1: Створіть акаунт RevenueCat

1. Перейдіть на https://app.revenuecat.com
2. Створіть акаунт (якщо ще немає)
3. Створіть новий проект "Homie"

### Крок 2: Налаштуйте iOS додаток в RevenueCat

1. **Projects** → **Homie** → **Apps**
2. Натисніть **+ New**
3. Виберіть **iOS**
4. Заповніть:
   - **App Name**: Homie (або ваша назва)
   - **Bundle ID**: `com.spoko-dev.homie`
   - **Shared Secret**: Отримайте з App Store Connect
5. Збережіть

### Крок 3: Отримайте Shared Secret з App Store Connect

1. Відкрийте https://appstoreconnect.apple.com
2. **Users and Access** → **Integrations** → **App-Specific Shared Secret**
3. Знайдіть ваш додаток або створіть новий
4. Скопіюйте **Shared Secret**
5. Вставте в RevenueCat

### Крок 4: Створіть Entitlement

1. У RevenueCat: **Entitlements** → **+ New**
2. **Identifier**: `premium`
3. **Display Name**: `Premium Access`
4. Збережіть

### Крок 5: Створіть продукти в App Store Connect

1. Відкрийте https://appstoreconnect.apple.com
2. **My Apps** → ваш додаток → **In-App Purchases**
3. Створіть **Auto-Renewable Subscription**:

   **Продукт 1: Monthly**
   - **Reference Name**: Homie Premium Monthly
   - **Product ID**: `com.spoko-dev.homie.premium_monthly`
   - **Subscription Group**: Homie Premium
   - **Subscription Duration**: 1 Month
   - **Price**: $4.99

   **Продукт 2: Yearly**
   - **Reference Name**: Homie Premium Yearly
   - **Product ID**: `com.spoko-dev.homie.premium_yearly`
   - **Subscription Group**: Homie Premium
   - **Subscription Duration**: 1 Year
   - **Price**: $49.99

4. Додайте локалізації (опис підписки)
5. Submit for Review

### Крок 6: Створіть продукти в RevenueCat

1. У RevenueCat: **Products** → **+ New**
2. Виберіть **App Store**

   **Monthly Product:**
   - **Identifier**: `premium_monthly`
   - **Store Product Identifier**: `com.spoko-dev.homie.premium_monthly`
   - **Type**: Subscription
   - **Duration**: 1 month

   **Yearly Product:**
   - **Identifier**: `premium_yearly`
   - **Store Product Identifier**: `com.spoko-dev.homie.premium_yearly`
   - **Type**: Subscription
   - **Duration**: 1 year

### Крок 7: Прикріпіть продукти до Entitlement

1. **Entitlements** → **premium** → **Attach Products**
2. Виберіть обидва продукти:
   - `premium_monthly`
   - `premium_yearly`
3. Збережіть

### Крок 8: Створіть Offering

1. **Offerings** → **+ New**
2. **Identifier**: `default`
3. Додайте пакети:
   - **Monthly Package**: `premium_monthly`
   - **Annual Package**: `premium_yearly`
4. Зробіть `default` активним
5. Збережіть

### Крок 9: Отримайте API ключі

1. У RevenueCat: **Project Settings** → **API Keys**
2. Скопіюйте:
   - **Apple App Store**: iOS API Key

### Крок 10: Додайте ключі в .env.local

Відкрийте `/homie-app/.env.local` та замініть:

```bash
EXPO_PUBLIC_REVENUECAT_IOS_KEY=YOUR_IOS_KEY_HERE
```

на ваш реальний ключ:

```bash
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxxxxx
```

---

## 🧪 Тестування

### 1. Sandbox Testing

1. **iOS Settings** → **App Store** → **Sandbox Account**
2. Додайте тестовий акаунт з App Store Connect
3. Запустіть додаток і спробуйте купити підписку

### 2. Перевірка в RevenueCat Dashboard

1. Після тестової покупки перейдіть в RevenueCat
2. **Customer Lists** → знайдіть свого тестового користувача
3. Перевірте, що підписка активна

### 3. Restore Purchases

Протестуйте кнопку "Restore Purchases" на екрані підписки

---

## 🔧 Як використовувати в додатку

### 1. Перевірка Premium статусу

```typescript
import { usePremium } from '@/hooks/usePremium';

function MyComponent() {
  const { isPremium } = usePremium();

  if (isPremium) {
    return <PremiumFeature />;
  }

  return <FreeFeature />;
}
```

### 2. Показати екран підписки

```typescript
import { usePremium } from '@/hooks/usePremium';

function MyComponent() {
  const { showPremiumModal } = usePremium();

  return (
    <Button onPress={showPremiumModal}>
      Upgrade to Premium
    </Button>
  );
}
```

### 3. Вимагати Premium для функції

```typescript
import { usePremium } from '@/hooks/usePremium';

function MyComponent() {
  const { requirePremium } = usePremium();

  const handlePremiumAction = () => {
    requirePremium(() => {
      // Ця функція виконається тільки якщо користувач Premium
      console.log('Premium action!');
    });
  };

  return (
    <Button onPress={handlePremiumAction}>
      Premium Feature
    </Button>
  );
}
```

---

## 📱 App Store Connect - Налаштування SKU

При створенні додатку в App Store Connect:

**SKU**: `HOMIEAPP2024`

Альтернативи:
- `HOMIE001`
- `SPOKODEVHOMIE`
- `HOMIEIOS2024`

---

## 🎯 Назва додатку в App Store

Якщо "Homie" зайнята, використайте:

1. **Homie App** ⭐ (рекомендовано)
2. **Homie - Home Manager**
3. **MyHomie**
4. **Homie Family**
5. **Homie Hub**

---

## 📊 Premium Features в Homie

| Feature | Free | Premium |
|---------|------|---------|
| Households | 1 | ∞ |
| Members | 5 | ∞ |
| Room Notes | 3/room | ∞ |
| Badges | 5 | 20+ |
| Analytics | ❌ | ✅ |
| Max Level | 20 | 50 |
| Themes | 1 | 5+ |

---

## ✅ Чеклист

- [ ] Створити акаунт RevenueCat
- [ ] Налаштувати iOS додаток в RevenueCat
- [ ] Отримати Shared Secret з App Store Connect
- [ ] Створити Entitlement "premium"
- [ ] Створити продукти в App Store Connect
- [ ] Створити продукти в RevenueCat
- [ ] Прикріпити продукти до Entitlement
- [ ] Створити Offering "default"
- [ ] Додати API ключі в .env.local
- [ ] Протестувати в Sandbox режимі
- [ ] Перевірити Restore Purchases

---

## 🆘 Troubleshooting

### "No packages found"
- Перевірте, що продукти створені в App Store Connect
- Перевірте, що Product IDs співпадають
- Почекайте 1-2 години після створення продуктів

### "Purchase failed"
- Перевірте Sandbox акаунт
- Вийдіть та увійдіть знову в Sandbox
- Перевірте, що Bundle ID співпадає

### "Restore failed"
- Перевірте, що ви використовуєте той самий Sandbox акаунт
- Спробуйте видалити та перевстановити додаток

---

**Готово! RevenueCat налаштовано! 🎉**