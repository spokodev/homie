# Homie Payment & Security Strategy

## Overview
This document outlines the payment processing, subscription management, security measures, and fraud prevention strategies for Homie. The system is designed to be secure, reliable, and compliant with payment industry standards while providing a seamless user experience.

## Payment Infrastructure

### Payment Processors

#### iOS: Apple In-App Purchase (IAP)
**Configuration:**
- StoreKit 2 framework
- Auto-renewable subscriptions
- In-app purchase products configured in App Store Connect
- Support for introductory offers (7-day free trial)
- Family Sharing enabled for Premium subscriptions

**Product IDs:**
- `com.homie.premium.monthly` - $4.99/month
- `com.homie.premium.annual` - $49.99/year
- `com.homie.premium.trial` - Free 7-day trial → monthly

**Commission:**
- Year 1: 30% Apple fee
- Year 2+: 15% Apple fee (for subscribers >1 year)
- Small Business Program: 15% if revenue <$1M/year

#### Android: Google Play Billing
**Configuration:**
- Google Play Billing Library v5+
- Auto-renewable subscriptions
- Base plans and offers configured in Play Console
- Support for free trials
- Billing grace period enabled

**Product IDs:**
- `com.homie.premium.monthly` - $4.99/month
- `com.homie.premium.annual` - $49.99/year
- `com.homie.premium.trial` - Free 7-day trial → monthly

**Commission:**
- Year 1: 30% Google fee
- Year 2+: 15% Google fee (for subscribers >1 year)

#### Web (Future): Stripe
**Configuration:**
- Stripe Checkout for payment collection
- Stripe Billing for subscription management
- PCI DSS Level 1 compliant
- Support for multiple payment methods
- 3D Secure authentication

**Fee:**
- 2.9% + $0.30 per transaction
- Additional 0.5% for international cards

### RevenueCat Integration

#### Why RevenueCat?
- **Cross-platform**: Unified API for iOS, Android, Web
- **Backend receipt validation**: Secure server-side validation
- **Webhook system**: Real-time subscription events
- **Customer data**: Centralized subscriber information
- **Analytics**: Built-in subscription metrics
- **Reduced development time**: Handle complex subscription logic

#### RevenueCat Setup
**SDK Integration:**
```swift
// iOS - Swift
import RevenueCat

func application(_ application: UIApplication, didFinishLaunchingWithOptions...) {
    Purchases.configure(withAPIKey: "REVENUECAT_API_KEY")
    Purchases.logLevel = .debug
}
```

```kotlin
// Android - Kotlin
import com.revenuecat.purchases.Purchases

class MainApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        Purchases.configure(this, "REVENUECAT_API_KEY")
    }
}
```

**Entitlements:**
- `premium` entitlement for all Premium features
- Check entitlement status on app launch and periodically
- Cache entitlement status locally for offline access

**Offerings:**
- Default offering: Monthly and Annual plans
- Trial offering: Free trial with monthly continuation
- Promotional offerings: Discounted rates for special campaigns

## RevenueCat Webhook Verification

### Webhook Security

#### Webhook Endpoint
**URL:** `https://api.homie.app/webhooks/revenuecat`

**Security Measures:**
1. HTTPS only (TLS 1.2+)
2. Webhook signature verification
3. IP whitelist (RevenueCat IPs only)
4. Idempotency checks
5. Rate limiting

#### Signature Verification

**Process:**
1. RevenueCat sends webhook with signature in header
2. Server computes HMAC-SHA256 of payload using secret
3. Compare computed signature with received signature
4. Process only if signatures match

**Implementation:**
```javascript
const crypto = require('crypto');

function verifyWebhook(req) {
    const signature = req.headers['x-revenuecat-signature'];
    const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;

    const computedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

    return signature === computedSignature;
}

app.post('/webhooks/revenuecat', (req, res) => {
    if (!verifyWebhook(req)) {
        return res.status(401).send('Invalid signature');
    }

    // Process webhook
    processWebhookEvent(req.body);
    res.status(200).send('OK');
});
```

### Webhook Events

#### Event Types

**Subscription Lifecycle:**
- `INITIAL_PURCHASE` - First subscription purchase
- `RENEWAL` - Successful subscription renewal
- `CANCELLATION` - User cancelled auto-renew
- `UNCANCELLATION` - User re-enabled auto-renew
- `NON_RENEWING_PURCHASE` - One-time purchase
- `EXPIRATION` - Subscription expired
- `BILLING_ISSUE` - Payment failed

**Trial Events:**
- `TRIAL_STARTED` - Free trial began
- `TRIAL_CONVERTED` - Trial converted to paid
- `TRIAL_CANCELLED` - Trial cancelled before conversion

**Other Events:**
- `PRODUCT_CHANGE` - Changed subscription tier
- `REFUND` - Subscription refunded
- `SUBSCRIBER_ALIAS` - User merged/aliased

#### Event Processing

**INITIAL_PURCHASE Event:**
```javascript
{
    "event": {
        "type": "INITIAL_PURCHASE",
        "app_user_id": "user123",
        "product_id": "com.homie.premium.monthly",
        "purchased_at_ms": 1635724800000,
        "entitlements": ["premium"],
        "price": 4.99,
        "currency": "USD",
        "store": "APP_STORE"
    }
}
```

**Actions:**
- Update user record: `subscription_status = 'active'`
- Set `subscription_tier = 'premium'`
- Set `subscription_expires_at` timestamp
- Send welcome email to Premium user
- Log event for analytics
- Grant premium entitlements in app

**RENEWAL Event:**
```javascript
{
    "event": {
        "type": "RENEWAL",
        "app_user_id": "user123",
        "product_id": "com.homie.premium.monthly",
        "purchased_at_ms": 1638316800000,
        "renewal_number": 2,
        "price": 4.99
    }
}
```

**Actions:**
- Extend `subscription_expires_at` timestamp
- Log successful renewal
- Track revenue for analytics
- Send renewal confirmation email (optional)

**CANCELLATION Event:**
```javascript
{
    "event": {
        "type": "CANCELLATION",
        "app_user_id": "user123",
        "product_id": "com.homie.premium.monthly",
        "cancelled_at_ms": 1637107200000,
        "expiration_at_ms": 1638316800000
    }
}
```

**Actions:**
- Update `auto_renew = false`
- Keep `subscription_status = 'active'` until expiration
- Schedule downgrade for expiration date
- Send cancellation survey email
- Log churn event
- Trigger win-back campaign

**EXPIRATION Event:**
```javascript
{
    "event": {
        "type": "EXPIRATION",
        "app_user_id": "user123",
        "product_id": "com.homie.premium.monthly",
        "expiration_at_ms": 1638316800000,
        "expiration_reason": "CANCELLATION"
    }
}
```

**Actions:**
- Update `subscription_status = 'expired'`
- Set `subscription_tier = 'free'`
- Revoke premium entitlements
- Send downgrade email with win-back offer
- Trigger re-engagement campaign

**BILLING_ISSUE Event:**
```javascript
{
    "event": {
        "type": "BILLING_ISSUE",
        "app_user_id": "user123",
        "product_id": "com.homie.premium.monthly",
        "grace_period_expires_at_ms": 1638576000000
    }
}
```

**Actions:**
- Update `subscription_status = 'grace_period'`
- Send email to update payment method
- Show in-app alert to update billing
- Start 3-day grace period countdown
- Log billing issue for monitoring

### Webhook Reliability

#### Retry Logic
- RevenueCat retries failed webhooks (5xx errors)
- Exponential backoff: 1min, 5min, 15min, 1hr, 6hr, 24hr
- Server must respond with 2xx within 5 seconds
- Implement idempotency to handle duplicate webhooks

#### Idempotency
**Implementation:**
```javascript
const processedWebhooks = new Set(); // In production: Use Redis

async function processWebhookEvent(event) {
    const eventId = event.id;

    // Check if already processed
    if (processedWebhooks.has(eventId)) {
        console.log('Duplicate webhook, skipping:', eventId);
        return;
    }

    // Process event
    await updateUserSubscription(event);

    // Mark as processed
    processedWebhooks.add(eventId);

    // Set expiry (24 hours)
    setTimeout(() => processedWebhooks.delete(eventId), 86400000);
}
```

#### Monitoring
- Track webhook delivery success rate
- Alert on high failure rate (>5%)
- Monitor processing time (<1 second)
- Log all webhook events for debugging
- Dashboard for webhook health

## Subscription State Machine

### Subscription States

#### State Diagram
```
[New User]
    ↓
[Free Tier]
    ↓ (starts trial)
[Trial Active] (7 days)
    ↓ (trial converts)
[Premium Active]
    ↓ (user cancels but still valid)
[Cancelled - Active Until Expiry]
    ↓ (expiration date passes)
[Expired / Free Tier]

[Premium Active]
    ↓ (billing failure)
[Grace Period] (3 days)
    ↓ (payment succeeded)
[Premium Active]
    OR
    ↓ (grace period expires)
[Expired / Free Tier]

[Premium Active]
    ↓ (refund issued)
[Refunded / Free Tier]
```

### State Definitions

#### Free Tier
**Attributes:**
- `subscription_status = 'free'`
- `subscription_tier = 'free'`
- `subscription_expires_at = null`
- `auto_renew = false`

**Capabilities:**
- Limited to 50 items
- 10 tasks per month
- 2 household members max
- Basic features only

#### Trial Active
**Attributes:**
- `subscription_status = 'trial'`
- `subscription_tier = 'premium'`
- `trial_started_at = timestamp`
- `subscription_expires_at = trial_started_at + 7 days`
- `auto_renew = true`

**Capabilities:**
- Full Premium access
- All features unlocked
- Will convert to paid at end of trial unless cancelled

#### Premium Active
**Attributes:**
- `subscription_status = 'active'`
- `subscription_tier = 'premium'`
- `subscription_expires_at = next_billing_date`
- `auto_renew = true`
- `billing_period = 'monthly' | 'annual'`

**Capabilities:**
- Unlimited items, tasks, members
- All Premium features
- Priority support

#### Cancelled (Active Until Expiry)
**Attributes:**
- `subscription_status = 'active'`
- `subscription_tier = 'premium'`
- `subscription_expires_at = end_of_billing_period`
- `auto_renew = false`
- `cancelled_at = timestamp`

**Capabilities:**
- Full Premium access until expiration
- Downgrade warning shown in app
- Ability to re-enable auto-renew

#### Grace Period
**Attributes:**
- `subscription_status = 'grace_period'`
- `subscription_tier = 'premium'`
- `grace_period_expires_at = timestamp + 3 days`
- `billing_issue_reason = 'payment_failed'`

**Capabilities:**
- Temporary Premium access (3 days)
- Persistent reminder to update payment
- Will expire if payment not resolved

#### Expired
**Attributes:**
- `subscription_status = 'expired'`
- `subscription_tier = 'free'`
- `subscription_expires_at = expiration_timestamp`
- `expired_at = timestamp`
- `auto_renew = false`

**Capabilities:**
- Downgraded to Free tier
- Features restricted
- Data preserved, but limits enforced
- Win-back offers shown

#### Refunded
**Attributes:**
- `subscription_status = 'refunded'`
- `subscription_tier = 'free'`
- `refunded_at = timestamp`
- `refund_reason = reason_code`

**Capabilities:**
- Immediately downgraded to Free tier
- Access to Premium features revoked
- May be restricted from future trials

### State Transitions

#### Free → Trial
**Trigger:** User starts free trial
**Actions:**
- Update subscription_status to 'trial'
- Set trial_started_at
- Set subscription_expires_at (7 days)
- Enable all Premium features
- Send trial started email

#### Trial → Premium
**Trigger:** Trial period ends, payment succeeds
**Actions:**
- Update subscription_status to 'active'
- Charge subscription fee
- Set new subscription_expires_at
- Send trial converted email
- Log conversion event

#### Trial → Free
**Trigger:** User cancels trial before conversion
**Actions:**
- Update subscription_status to 'free'
- Revoke Premium features
- Set subscription_expires_at to null
- Send trial cancellation email
- Log churn event

#### Premium → Cancelled (Active)
**Trigger:** User cancels subscription
**Actions:**
- Set auto_renew to false
- Keep subscription_status as 'active'
- Set cancelled_at timestamp
- Show in-app message about expiration date
- Send cancellation confirmation email
- Trigger exit survey

#### Cancelled → Premium
**Trigger:** User re-enables auto-renew
**Actions:**
- Set auto_renew to true
- Update subscription_status to 'active'
- Remove cancelled_at
- Send re-subscription confirmation
- Log win-back event

#### Premium → Grace Period
**Trigger:** Billing failure on renewal
**Actions:**
- Update subscription_status to 'grace_period'
- Set grace_period_expires_at (3 days)
- Send payment failure email
- Show in-app alert to update payment
- Retry payment daily

#### Grace Period → Premium
**Trigger:** Payment succeeds during grace period
**Actions:**
- Update subscription_status to 'active'
- Clear grace_period_expires_at
- Set new subscription_expires_at
- Send payment success email
- Log recovery event

#### Grace Period → Expired
**Trigger:** Grace period expires without payment
**Actions:**
- Update subscription_status to 'expired'
- Downgrade to Free tier
- Revoke Premium features
- Send subscription expired email
- Trigger win-back campaign

#### Any → Refunded
**Trigger:** Refund issued by Apple/Google or manual refund
**Actions:**
- Update subscription_status to 'refunded'
- Downgrade to Free tier immediately
- Log refund reason
- Flag account (potential fraud or abuse)
- Review refund patterns

## Fraud Detection

### Fraud Patterns to Monitor

#### Subscription Abuse
- **Trial stacking**: Multiple trial signups from same device/user
- **Family sharing abuse**: Sharing subscription beyond family plan limits
- **Refund abuse**: Repeated purchase → refund cycles
- **Stolen payment methods**: Chargebacks and disputes

#### Account Abuse
- **Account sharing**: Multiple devices/IPs accessing same account
- **Automated signups**: Bot-created accounts
- **Fake referrals**: Self-referrals or fake accounts for points
- **Data scraping**: Unusual API usage patterns

### Fraud Detection Mechanisms

#### Device Fingerprinting
**Track:**
- Device ID (IDFV on iOS, Android ID on Android)
- IP address
- Device model and OS version
- Timezone
- App version

**Red Flags:**
- Same device with multiple trial accounts
- Unusual location changes (VPN/proxy)
- Rapid account creation from same device

#### Behavioral Analysis
**Track:**
- Signup to trial time (instant = suspicious)
- Usage patterns (no usage but subscribed = suspicious)
- Subscription cancellation patterns
- Refund request frequency

**Red Flags:**
- Trial start → immediate cancellation (trial abuser)
- Zero usage after signup
- 100% refund rate
- Multiple failed payment attempts

#### Payment Validation
**Checks:**
- BIN (Bank Identification Number) validation
- Card country vs account country mismatch
- Velocity checks (multiple attempts in short time)
- 3D Secure authentication results

**Red Flags:**
- Prepaid cards (higher fraud risk)
- Multiple payment methods failing
- Inconsistent billing address
- High-risk BIN numbers

### Fraud Prevention Measures

#### Trial Restrictions
- **One trial per device**: Track device ID
- **One trial per email**: Verify email uniqueness
- **One trial per payment method**: Check card fingerprint
- **Credit card required**: Reduce throwaway signups (optional)

**Implementation:**
```javascript
async function validateTrialEligibility(userId, deviceId, email) {
    // Check device
    const deviceTrials = await countTrialsByDevice(deviceId);
    if (deviceTrials > 0) {
        return { eligible: false, reason: 'device_used' };
    }

    // Check email
    const emailTrials = await countTrialsByEmail(email);
    if (emailTrials > 0) {
        return { eligible: false, reason: 'email_used' };
    }

    // Check payment method (if required)
    // ... similar checks

    return { eligible: true };
}
```

#### Account Verification
- **Email verification**: Confirm email before trial starts
- **Phone verification**: Optional for high-risk accounts
- **CAPTCHA**: On signup to prevent bot signups
- **Velocity limits**: Max 3 accounts per IP per day

#### Subscription Monitoring
- **Chargeback alerts**: Immediate notification and investigation
- **Refund rate monitoring**: Alert if >5% of revenue
- **Unusual subscription patterns**: Automated flagging
- **Manual review queue**: High-risk subscriptions reviewed by team

### Fraud Response Procedures

#### Suspected Fraud
1. **Flag account** for manual review
2. **Limit functionality** (read-only mode)
3. **Request verification** (email, phone, ID)
4. **Investigate pattern** (check similar accounts)
5. **Decision**: Restore access or ban account

#### Confirmed Fraud
1. **Ban account** and device
2. **Revoke subscriptions** and entitlements
3. **Blacklist payment method**
4. **Block email domain** if systematic fraud
5. **Report to payment processor**
6. **Notify authorities** if criminal fraud

#### Chargeback Handling
1. **Investigate transaction** (legitimate or fraud?)
2. **Gather evidence** (usage logs, receipts)
3. **Respond to dispute** via Apple/Google/Stripe
4. **If lost**: Accept and learn
5. **If won**: Restore subscription if desired
6. **Flag account** and monitor for repeat chargebacks

## Grace Period Management

### 3-Day Grace Period

#### Purpose
- Give users time to resolve legitimate payment issues
- Reduce involuntary churn from expired cards
- Maintain positive user experience
- Comply with Google Play Billing requirements

#### Implementation

**Grace Period Triggers:**
- Credit card expired
- Insufficient funds
- Payment processor error
- Billing address change required

**Grace Period Flow:**
1. **Day 0**: Renewal fails
   - Enter grace period
   - Keep Premium access
   - Send email: "Payment failed - please update"
   - Show in-app banner: "Update payment method"

2. **Day 1**: During grace period
   - Retry payment (Google Play auto-retries)
   - Send reminder email
   - Push notification: "Update payment to keep Premium"

3. **Day 2**: Nearing expiration
   - Final retry attempt
   - Send urgent email: "Last day to update payment"
   - In-app modal: "Update payment or lose access"

4. **Day 3**: Grace period ends
   - If payment succeeded: Restore to Active
   - If payment failed: Downgrade to Free
   - Send appropriate email

#### User Communication

**Payment Failed Email:**
```
Subject: Action Required: Update your payment method

Hi [Name],

We couldn't process your payment for Homie Premium. This might be due to
an expired card, insufficient funds, or a billing address change.

You have 3 days to update your payment method. Your Premium access will
continue during this time, but will be cancelled if we can't process payment.

[UPDATE PAYMENT METHOD BUTTON]

Need help? Reply to this email or contact support.

Thanks,
The Homie Team
```

**In-App Banner:**
- Red warning banner at top of app
- "Payment failed - Update now to keep Premium"
- Tap to go to payment settings
- Shows countdown: "2 days remaining"

**Push Notification:**
- Day 1: "Update your payment method to keep Homie Premium"
- Day 2: "Last chance: Update payment in the next 24 hours"

### Payment Retry Strategy

#### Automatic Retries
- **Apple**: Automatic retry over 60 days
- **Google**: Automatic retry during grace period and after
- **Stripe**: Configure retry schedule (1, 3, 5, 7 days)

#### Smart Retry Timing
- Avoid retrying at same time (likely to fail again)
- Retry 3-7 days later (payday window)
- Retry at different times of day
- Stop after 4-5 failed attempts

#### Success Recovery
- Update subscription immediately
- Send success confirmation
- Thank user for updating payment
- Resume normal billing cycle

## Refund Processes

### Refund Policy

#### Eligibility
**Full Refund (7 days):**
- Purchased in last 7 days
- Any reason, no questions asked
- Processed within 3-5 business days

**Prorated Refund (8-30 days):**
- Purchased in last 30 days
- Valid reason required (billing error, dissatisfaction)
- Prorated based on unused time

**No Refund (30+ days):**
- Subscription older than 30 days
- Follows App Store/Play Store policies
- Exceptions for extenuating circumstances

#### Refund Reasons
**Automatic approval:**
- Billing error (double charge)
- Technical issue preventing usage
- Accidental purchase
- Trial didn't cancel as expected

**Manual review:**
- Feature dissatisfaction
- Didn't meet expectations
- Found alternative solution
- Financial hardship

### Refund Request Process

#### User-Initiated (App Stores)
**iOS:**
1. User requests refund via reportaproblem.apple.com
2. Apple reviews request
3. Apple approves or denies
4. If approved, Apple issues refund
5. Apple notifies RevenueCat via webhook
6. RevenueCat sends REFUND event to Homie
7. Homie revokes Premium access

**Android:**
1. User requests refund via Play Store
2. Google reviews request (auto-approve <48hrs)
3. If approved, Google issues refund
4. Google notifies RevenueCat
5. Homie processes refund webhook

**Issues:**
- Homie has no control over refund decision
- No direct communication with user
- Must accept app store decision

#### Admin-Initiated (Manual)
1. User contacts Homie support
2. Support reviews request
3. If approved, admin processes refund via RevenueCat
4. RevenueCat issues refund through payment processor
5. User receives refund in 3-5 days
6. Subscription immediately cancelled

### Refund Handling

#### Webhook Processing
```javascript
async function handleRefund(event) {
    const userId = event.app_user_id;
    const refundReason = event.reason;
    const refundAmount = event.price;

    // Revoke Premium access immediately
    await updateUser(userId, {
        subscription_status: 'refunded',
        subscription_tier: 'free',
        refunded_at: new Date(),
        refund_reason: refundReason
    });

    // Log for analytics
    await logEvent('subscription_refunded', {
        user_id: userId,
        amount: refundAmount,
        reason: refundReason
    });

    // Flag if repeated refunder (potential abuse)
    const refundCount = await countRefunds(userId);
    if (refundCount > 1) {
        await flagAccount(userId, 'repeated_refunds');
    }

    // Send email
    await sendRefundConfirmationEmail(userId);
}
```

#### Data Retention After Refund
- **Keep user data**: Don't delete items, tasks, photos
- **Downgrade to Free tier**: Apply free tier limits
- **Preserve access**: User can still use app
- **Option to delete account**: Respect user's choice

### Refund Analytics

#### Metrics to Track
- **Refund rate**: Refunds / Total subscriptions
- **Refund reasons**: Categorize and analyze
- **Time to refund**: Days from purchase to refund
- **Refund by cohort**: Which cohorts refund more?
- **Refund LTV impact**: How much revenue lost?

#### Target Metrics
- **Refund rate**: <3% of subscriptions
- **Avg time to refund**: <14 days (early dissatisfaction)
- **Repeat refunds**: <0.5% of users

#### Analysis & Improvement
- Monthly review of refund reasons
- Identify product issues causing refunds
- Improve onboarding to reduce early refunds
- Better trial experience to reduce false expectations
- Proactive support to resolve issues before refund

## Payment Security Best Practices

### Data Protection

#### PCI DSS Compliance
- **Never store payment card data** on Homie servers
- Use tokenization (Apple, Google, Stripe handle cards)
- All payment data transmission over HTTPS/TLS 1.2+
- Regular security audits

#### Sensitive Data
- **Don't log payment details** (card numbers, CVVs)
- Log only: transaction ID, status, amount
- Encrypt logs at rest
- Restrict access to payment logs

### Server Security

#### API Security
- **Authentication**: Require API keys for all requests
- **Authorization**: Role-based access control (RBAC)
- **Rate limiting**: Prevent abuse and DDoS
- **Input validation**: Sanitize all inputs
- **HTTPS only**: Reject HTTP requests

#### Webhook Security
- **Signature verification**: Always verify webhook signatures
- **IP whitelist**: Only accept from known IPs
- **Replay protection**: Idempotency checks
- **Timeout**: Respond within 5 seconds
- **Error handling**: Don't leak sensitive info in errors

### User Privacy

#### Data Minimization
- Collect only necessary payment data
- Don't request CVV for recurring payments
- Anonymize analytics data
- Delete payment data on account deletion

#### Transparency
- Clear pricing and billing terms
- Easy-to-find cancellation process
- No hidden fees or surprise charges
- Explain what data is collected and why

## Compliance & Legal

### Regulations

#### GDPR (Europe)
- Right to data access
- Right to data deletion
- Right to data portability
- Consent for data processing
- Breach notification requirements

#### CCPA (California)
- Right to know what data is collected
- Right to delete personal information
- Right to opt-out of data sale
- Non-discrimination for exercising rights

#### App Store Guidelines
- Clear in-app purchase flows
- No alternative payment methods (iOS)
- Accurate pricing information
- Proper subscription management

### Terms & Policies

#### Subscription Terms
- Pricing clearly stated
- Billing cycle explained
- Trial terms (7 days free, then auto-renew)
- Cancellation policy
- Refund policy

#### Privacy Policy
- What data is collected
- How data is used
- Third-party services (RevenueCat, analytics)
- Data retention and deletion
- User rights and controls

#### Terms of Service
- Account requirements
- Prohibited uses
- Intellectual property
- Limitation of liability
- Dispute resolution

## Monitoring & Alerting

### Key Metrics to Monitor

#### Revenue Metrics
- Daily/Monthly Recurring Revenue (MRR)
- New subscriptions
- Renewals
- Cancellations
- Refunds
- Churn rate

#### Payment Health
- Payment success rate (target: >95%)
- Payment failure rate by reason
- Grace period conversions (target: >50%)
- Retry success rate

#### Fraud & Security
- Chargeback rate (target: <0.5%)
- Refund rate (target: <3%)
- Trial abuse incidents
- Failed webhook deliveries

### Alerting Thresholds

#### Critical Alerts (Immediate Action)
- Payment processing down (>10% failure rate)
- Webhook delivery failures (>5%)
- Security breach detected
- Chargeback rate spike (>1%)

#### Warning Alerts (Review within 24h)
- Subscription churn spike (>10% increase)
- Refund rate increase (>5%)
- Grace period conversion drop (<40%)
- Revenue dip (>15% decrease)

### Dashboard & Reports

#### Real-Time Dashboard
- Current MRR
- Active subscriptions
- Trial conversions today
- Payment success rate (24h)
- Recent refunds and chargebacks

#### Weekly Reports
- New subscribers
- Churned subscribers
- Revenue vs forecast
- Payment issues resolved
- Fraud incidents

#### Monthly Reports
- Full financial summary
- Cohort analysis
- Churn analysis
- Refund analysis
- Payment processor fees
- LTV by cohort

## Security Checklist

### Pre-Launch
- [ ] Configure RevenueCat API keys
- [ ] Set up webhook endpoint with signature verification
- [ ] Implement subscription state machine
- [ ] Configure grace period handling
- [ ] Set up fraud detection rules
- [ ] Create payment failure email templates
- [ ] Test refund flows
- [ ] Security audit of payment systems
- [ ] Review App Store/Play Store compliance

### Post-Launch
- [ ] Monitor payment success rate daily
- [ ] Review refund reasons weekly
- [ ] Audit fraud patterns monthly
- [ ] Test webhook reliability
- [ ] Verify subscription states are correct
- [ ] Review compliance with regulations
- [ ] Update security policies as needed

## Appendix: Webhook Event Reference

### Complete Event List
- `INITIAL_PURCHASE` - First subscription
- `RENEWAL` - Successful renewal
- `CANCELLATION` - User cancelled
- `UNCANCELLATION` - User re-enabled
- `NON_RENEWING_PURCHASE` - One-time purchase
- `EXPIRATION` - Subscription expired
- `BILLING_ISSUE` - Payment failed
- `PRODUCT_CHANGE` - Changed tiers
- `TRANSFER` - Subscription transferred
- `REFUND` - Refund issued
- `SUBSCRIBER_ALIAS` - User merged

### Testing Webhooks
- Use RevenueCat sandbox environment
- Test all event types
- Verify signature validation
- Test idempotency
- Simulate failures and retries
- Load test webhook endpoint
