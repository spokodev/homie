# Виправлення Email Verification та Password Reset

## Проблема

Після реєстрації в TestFlight, користувач отримує email з посиланням на `https://tryhomie.app/...`, яке веде на неіснуючу веб-сторінку (404 помилка).

## Рішення

Додано обробку deep links для автоматичного відкриття додатку при кліку на посилання в email.

---

## Що було зроблено в коді

### 1. Створено Hook для Deep Links ✅

**Файл:** `src/hooks/useDeepLinking.ts`

Hook автоматично обробляє:
- Email verification (підтвердження реєстрації)
- Password reset (відновлення пароля)
- Інші auth-related deep links

Коли користувач клікає на посилання в email, додаток:
1. Отримує `access_token` з URL
2. Автоматично встановлює сесію в Supabase
3. Перенаправляє на потрібну сторінку

### 2. Додано Hook до Root Layout ✅

**Файл:** `app/_layout.tsx`

Додано `useDeepLinking()` в NavigationContent, щоб він працював глобально в усьому додатку.

---

## Що потрібно налаштувати в Supabase

### Крок 1: Redirect URLs ✅ (Вже зроблено)

В **Authentication → URL Configuration** додано:
```
homie://auth/reset-password
homie://**
https://tryhomie.app/**
```

### Крок 2: Site URL ✅ (Вже зроблено)

Site URL встановлено на:
```
https://tryhomie.app
```

### Крок 3: Email Templates (ПОТРІБНО ЗРОБИТИ)

Це найважливіший крок! Потрібно змінити email templates, щоб вони використовували deep links замість веб URLs.

#### Для Email Confirmation (Confirm signup)

1. Перейдіть в **Authentication → Email Templates**
2. Виберіть **Confirm signup**
3. Знайдіть рядок з `{{ .ConfirmationURL }}`
4. Замініть URL на deep link format

**Оригінальний код (приблизно):**
```html
<a href="{{ .ConfirmationURL }}">Confirm your email</a>
```

**Новий код:**
```html
<a href="homie://auth/verify?token={{ .Token }}&type=signup&access_token={{ .Token }}&refresh_token={{ .Token }}">Confirm your email</a>
```

Або простіше - використайте наявний ConfirmationURL, але переконайтеся що він генерується з deep link схемою.

#### Альтернативний підхід (Простіший):

Supabase має special placeholder для redirect URLs. Спробуйте змінити template на:

```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
```

А потім в **URL Configuration** встановіть:
- **Site URL**: `homie://` (замість `https://tryhomie.app`)

**АБО** (якщо перший варіант не спрацює):

Залиште Site URL як є, але переконайтеся що в Redirect URLs є `homie://**` і він має вищий пріоритет.

---

## Як це працює тепер

### Сценарій 1: Email Verification (Підтвердження реєстрації)

1. Користувач реєструється в додатку
2. Supabase відправляє email з посиланням
3. Користувач клікає на посилання:
   - **На мобільному пристрої:** додаток автоматично відкривається
   - **На desktop:** показується помилка 404 (це нормально, бо це мобільний додаток)
4. Додаток обробляє deep link і:
   - Встановлює сесію автоматично
   - Перенаправляє на головну сторінку (/(tabs)/)
5. Користувач залогінений і може користуватися додатком

### Сценарій 2: Password Reset (Відновлення пароля)

1. Користувач натискає "Forgot Password?"
2. Вводить email і отримує посилання
3. Клікає на посилання - додаток відкривається
4. Додаток автоматично:
   - Встановлює сесію з recovery token
   - Перенаправляє на сторінку reset-password
5. Користувач вводить новий пароль
6. Успіх! Перенаправлення на login

---

## Тестування

### В Симуляторі:

Якщо ви отримали email з посиланням типу:
```
https://tryhomie.app/auth/confirm?token=xxx&type=signup
```

Замініть на deep link:
```bash
xcrun simctl openurl booted "homie://auth/verify?token=xxx&type=signup"
```

### На TestFlight (Реальний пристрій):

1. Зареєструйтеся в додатку
2. Отримайте email
3. Клікніть на посилання **на iPhone** (де встановлений додаток)
4. iOS автоматично запропонує відкрити в HomieLife
5. Додаток відкриється і ви будете залогінені

**Важливо:** Посилання треба відкривати на тому ж пристрої, де встановлений додаток через TestFlight.

---

## Проблеми та Вирішення

### ❌ Помилка: 404 NOT_FOUND при кліку на посилання

**Причина:** Email містить веб-URL (`https://tryhomie.app`) замість deep link

**Рішення:**
1. Змініть Site URL в Supabase на `homie://` АБО
2. Налаштуйте email templates для використання deep links (див. вище)

### ❌ Посилання не відкриває додаток

**Причина:** Deep link схема не зареєстрована або додаток не встановлений

**Рішення:**
1. Переконайтеся що додаток встановлений через TestFlight
2. Перевірте що в `app.json` є `"scheme": "homie"` ✅ (вже є)
3. Переінсталюйте додаток після змін в app.json

### ❌ Додаток відкривається, але нічого не відбувається

**Причина:** Hook не обробляє deep link або токен невалідний

**Рішення:**
1. Перевірте console logs (в Xcode або через Expo)
2. Подивіться чи є помилки від Supabase
3. Токени мають термін дії - запитайте новий email

---

## Наступні кроки

1. ✅ Код додатку готовий - deep links обробляються
2. ⏳ Налаштуйте email templates в Supabase (див. Крок 3 вище)
3. ⏳ Зробіть новий build і загрузіть на TestFlight
4. ⏳ Протестуйте реєстрацію та password reset

---

## Додаткова інформація

### Формат Deep Links

Додаток підтримує такі deep links:

```
homie://auth/reset-password?access_token=xxx&refresh_token=yyy&type=recovery
homie://auth/verify?access_token=xxx&type=signup
homie://** (будь-який інший auth-related URL)
```

### Файли, що були змінені:

1. `src/hooks/useDeepLinking.ts` - новий hook
2. `app/_layout.tsx` - додано useDeepLinking()
3. `src/lib/supabase.ts` - оновлено redirectTo для password reset
4. `app/(auth)/reset-password.tsx` - сторінка для reset password
5. `app/(auth)/_layout.tsx` - додано маршрути

### Build не потрібен для:

- Змін в Supabase Dashboard (працює одразу)
- Тестування в симуляторі з наявною версією

### Build потрібен для:

- Тестування в TestFlight на реальному пристрої
- Після змін в app.json або нативних залежностях
