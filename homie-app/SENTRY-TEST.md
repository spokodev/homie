# 🧪 Як Протестувати Sentry

## ✅ Sentry Тепер Увімкнений в Development!

Sentry налаштовано для роботи в обох режимах:
- 🟢 Development: `enabled: true` + `debug: true` (детальні логи)
- 🟢 Production: `enabled: true` + `debug: false`

---

## 📋 Що Змінилось

### Було:
```typescript
enabled: !__DEV__, // Only enable in production ❌
debug: false,
```

### Стало:
```typescript
enabled: true, // Enable in both development and production ✅
debug: __DEV__, // Enable debug logs in development ✅
```

---

## 🧪 Методи Тестування Sentry

### Метод 1: Тест з Console (Найпростіший)

Запустіть додаток і подивіться в console:

```bash
npx expo start
```

Ви побачите Sentry debug логи:
```
[Sentry] SDK initialized successfully
[Sentry] DSN: https://...ingest.de.sentry.io/...
[Sentry] Environment: development
[Sentry] Debug mode: enabled
```

---

### Метод 2: Ручна Відправка Тестової Помилки

Додайте цей код в будь-який екран (наприклад, Home):

```typescript
import * as Sentry from '@sentry/react-native';
import { Button } from 'react-native';

// В компоненті:
const testSentry = () => {
  console.log('🧪 Тестуємо Sentry...');
  
  // Відправка повідомлення
  Sentry.captureMessage('✅ Sentry Test Message from Development!');
  
  // Відправка помилки
  try {
    throw new Error('🧪 Sentry Test Error - Все працює!');
  } catch (error) {
    Sentry.captureException(error);
  }
  
  console.log('✅ Тестові події відправлено на Sentry!');
};

// В JSX:
<Button title="🧪 Test Sentry" onPress={testSentry} />
```

Після натискання кнопки перевірте Sentry Dashboard:
👉 https://sentry.io/organizations/your-org/issues/

---

### Метод 3: Автоматичний Crash Test

Додайте кнопку для тестового краша:

```typescript
const crashTest = () => {
  throw new Error('💥 Crash Test - Sentry має це спіймати!');
};

<Button title="💥 Test Crash" onPress={crashTest} />
```

Error Boundary спіймає помилку і відправить на Sentry.

---

### Метод 4: Performance Tracking Test

```typescript
import * as Sentry from '@sentry/react-native';

const testPerformance = () => {
  // Start transaction
  const transaction = Sentry.startTransaction({
    name: 'Test Transaction',
    op: 'test',
  });

  // Simulate some work
  setTimeout(() => {
    // Add breadcrumb
    Sentry.addBreadcrumb({
      category: 'test',
      message: 'Test breadcrumb',
      level: 'info',
    });

    // Finish transaction
    transaction.finish();
    console.log('✅ Performance tracking test sent!');
  }, 1000);
};
```

---

## 📊 Що Побачите на Sentry Dashboard

### Issues Tab
- Всі помилки та exceptions
- Stack traces
- Device info
- User context
- Breadcrumbs (події до помилки)

### Performance Tab
- Transactions (операції)
- Load times
- Slow operations
- Database queries

### Releases Tab
- Різні версії додатку
- Помилки по версіях
- Deploy tracking

---

## 🎯 Очікувані Логи в Console

Після запуску `npx expo start` ви побачите:

```bash
[Sentry] Initializing SDK...
[Sentry] DSN set to: https://9bf074eaa16d...@o4510161421139968.ingest.de.sentry.io/4510284527435856
[Sentry] Environment: development
[Sentry] Debug mode: enabled
[Sentry] Auto session tracking: enabled
[Sentry] Session tracking interval: 30000ms
[Sentry] SDK initialized
```

---

## ✅ Checklist Перевірки

- [ ] Запустити додаток: `npx expo start`
- [ ] Перевірити Sentry логи в console
- [ ] Додати тестову кнопку (Метод 2)
- [ ] Натиснути кнопку і відправити test event
- [ ] Відкрити Sentry Dashboard: https://sentry.io
- [ ] Знайти тестову подію в Issues
- [ ] Перевірити деталі події (stack trace, breadcrumbs)
- [ ] ✅ Sentry працює!

---

## 🔍 Troubleshooting

### Проблема: Не бачу логів Sentry
**Рішення**: Переконайтеся, що:
1. DSN правильний в `.env.local`
2. Додаток перезапущений після змін
3. Console відкритий

### Проблема: Події не з'являються на Dashboard
**Рішення**:
1. Почекайте 1-2 хвилини (затримка обробки)
2. Перевірте Environment filter (має бути "development")
3. Перевірте інтернет з'єднання

### Проблема: DSN не знайдено
**Рішення**: Перевірте `.env.local`:
```bash
cat .env.local | grep SENTRY
```

---

## 🎉 Готово!

Sentry тепер **активний в development** і ready для тестування!

**Dashboard**: https://sentry.io
**Environment**: development
**Debug**: enabled
**Status**: ✅ Ready to test!
