# Homie Business Model

## Overview
This document outlines the business model, pricing strategy, and financial projections for Homie. The model is based on a freemium subscription approach with a 7-day free trial, targeting households who want advanced features for home management.

## Multi-Tier Pricing Strategy

### Free Tier (Core)
**Features:**
- Up to 50 items
- Up to 10 tasks per month
- 1 household with max 2 members
- Basic photo storage (100 photos)
- Manual data entry only
- Standard support (email, 48hr response)
- Ads displayed (non-intrusive)

**Purpose:**
- Acquisition: Get users in the door
- Validation: Let users experience core value
- Conversion funnel: Create upgrade desire
- Viral growth: Enable sharing and invites

### Premium Tier - Monthly ($4.99/month)

**All Free features plus:**
- Unlimited items
- Unlimited tasks
- Unlimited household members
- Unlimited photo storage
- AI-powered receipt scanning
- Warranty expiration alerts
- Advanced analytics & insights
- Document storage (1GB)
- Priority support (24hr response)
- No ads
- Export data (CSV, PDF)
- Custom categories & tags

**Target Audience:**
- Active homeowners
- Small families (2-3 members)
- Users who hit free tier limits
- Power users who scan receipts

### Premium Tier - Annual ($49.99/year)

**Same as Monthly Premium, plus:**
- **17% discount** vs monthly ($59.88/year normally)
- Early access to new features
- Extended document storage (5GB)
- Quarterly home value reports
- Annual insights & trends
- Priority feature requests
- Exclusive achievement badges

**Target Audience:**
- Committed long-term users
- Households serious about organization
- Users who complete free trial successfully
- Price-conscious premium users

### Future Enterprise Tier (Property Managers) - $19.99/month per property

**All Premium features plus:**
- Manage multiple properties
- Tenant collaboration
- Maintenance tracking per unit
- Vendor management
- Bulk operations
- API access
- Custom branding
- Dedicated account manager
- SLA guarantees

**Target Audience:**
- Property managers
- Landlords with 3+ properties
- Real estate professionals
- Facility managers

## 7-Day Free Trial Strategy

### Trial Structure

**What Users Get:**
- Full Premium access for 7 days
- No credit card required upfront
- 500 point welcome bonus
- Guided onboarding experience
- Email drip campaign during trial

**Trial Flow:**
1. User signs up (free)
2. Prompted to start trial on Day 1 or when hitting limit
3. Full Premium access enabled immediately
4. Reminder emails on Day 3, Day 5, Day 6
5. Trial ends Day 7, prompt to subscribe
6. Graceful degradation to Free tier if not subscribed

### Trial Triggers

**Contextual Trial Prompts:**
- **Item limit reached**: "Unlock unlimited items with Premium"
- **Task limit reached**: "Create unlimited tasks with Premium"
- **Receipt scan attempt**: "Start free trial for AI receipt scanning"
- **3rd household member**: "Invite unlimited members with Premium"
- **Photo upload (100+)**: "Get unlimited photo storage"

**Timing:**
- Don't show on Day 1 (let users experience core value)
- Show after user has 10+ items (invested)
- Show after first task completion (engaged)
- Show on 3rd session (committed)

### Trial Engagement

**During Trial (Day 0-7):**
- **Day 0**: Welcome email with Premium features overview
- **Day 1**: Tutorial on receipt scanning (key Premium feature)
- **Day 2**: Show analytics dashboard unlock
- **Day 3**: Email reminder - "4 days left in trial"
- **Day 4**: In-app prompt to explore warranty alerts
- **Day 5**: Email reminder - "2 days left" + testimonials
- **Day 6**: Email reminder - "Last day!" + discount offer
- **Day 7**: Conversion prompt with subscribe CTA

**Trial Success Metrics:**
- Trial start rate: 25% of users
- Trial engagement: 50% use Premium features
- Trial to paid conversion: 30%

## Upgrade Triggers

### Limit-Based Triggers

#### Item Limit (Free: 50 items)
**Trigger at 45 items (90%):**
- Soft prompt: "You're almost at your item limit"
- Value prop: "Premium users track avg 250 items"
- CTA: "Upgrade to Premium"

**Trigger at 50 items (100%):**
- Hard block: "You've reached your item limit"
- Options: "Delete items" or "Upgrade to Premium"
- Highlight: "Start free trial now"

#### Task Limit (Free: 10 tasks/month)
**Trigger at 8 tasks:**
- Soft prompt: "2 tasks remaining this month"
- Show upgrade benefits
- CTA: "Get unlimited tasks"

#### Member Limit (Free: 2 members)
**Trigger when attempting 3rd member:**
- Block: "Free tier supports up to 2 members"
- Value prop: "Collaborate with your whole household"
- CTA: "Upgrade for unlimited members"

### Feature-Based Triggers

#### Receipt Scanning
- Camera icon prompts upgrade
- "Try it free for 7 days"
- Show example of scanned receipt
- Highlight time savings

#### Warranty Alerts
- Show grayed-out warranty expiration dates
- "Never miss a warranty with Premium"
- Calculate potential savings
- "Start free trial"

#### Analytics Dashboard
- Show blurred preview
- "Unlock insights about your home"
- Example: "You've saved $450 this year"
- "See your stats with Premium"

### Behavioral Triggers

#### High Engagement
**User shows power user behavior:**
- Logs in 5+ days in a week
- Adds 30+ items in first month
- Completes 15+ tasks in a month
- Uploads 50+ photos

**Trigger:**
- "We noticed you're a power user!"
- "Upgrade to Premium for 20% off"
- Time-limited offer (72 hours)

#### Household Creation
**User invites 2nd member:**
- "Managing home together? Upgrade for unlimited members"
- "Premium households are 3x more active"
- Social proof: "Join 10K premium households"

#### Specific Item Types
**User adds high-value item (>$1000):**
- "Protect your investment with warranty tracking"
- "Premium users never lose warranties"
- "Start free trial to enable alerts"

### Emotional Triggers

#### Success Moments
**User completes first week:**
- "Great week! You added 25 items"
- "Imagine what you could do with Premium features"
- "Celebrate with 7-day free trial"

**User reaches milestone:**
- "Congratulations on 100 items!"
- "Power users love these Premium features..."
- Special milestone discount

#### Pain Points
**User manually enters 5th receipt:**
- "Tired of manual entry?"
- "Premium users scan receipts instantly"
- Show time savings calculation

### Seasonal Triggers

#### Spring Cleaning (March-April)
- "Organize your whole home this spring"
- "30% off Premium for spring cleaners"
- Limited time offer

#### New Year (January)
- "Start 2025 organized"
- "New year resolution: Get organized"
- First month free

#### Tax Season (March-April)
- "Find all your receipts for tax deductions"
- "Premium receipt scanning helps at tax time"
- Free trial for tax prep

## Revenue Projections

### Year 1 Financial Model

#### User Acquisition Assumptions
- **Month 1-3**: 500 users/month (early adopters, organic)
- **Month 4-6**: 1,000 users/month (product hunt launch)
- **Month 7-12**: 2,000 users/month (paid acquisition)
- **Total Year 1**: 15,000 users

#### Conversion Assumptions
- **Free to Trial**: 25%
- **Trial to Paid**: 30%
- **Monthly vs Annual**: 40% annual, 60% monthly
- **Churn Rate**: 5% monthly, 40% annual

#### Revenue Calculations

**Month 12 Snapshot:**
- Total users: 15,000
- Trial starts: 3,750 (25%)
- Paid subscribers: 1,125 (30% of trials)
- Annual subscribers: 450 (40%)
- Monthly subscribers: 675 (60%)

**Monthly Recurring Revenue (MRR) - Month 12:**
- Annual MRR: 450 × ($49.99 ÷ 12) = $1,875
- Monthly MRR: 675 × $4.99 = $3,368
- **Total MRR: $5,243**

**Annual Recurring Revenue (ARR) - Year 1:**
- ~$85,000 (accounting for ramp-up)

### Year 2-3 Projections

#### Year 2
- User base: 50,000 total users
- Paid subscribers: 5,000 (10% of total, improved conversion)
- MRR: $20,000
- ARR: $300,000

#### Year 3
- User base: 150,000 total users
- Paid subscribers: 18,000 (12% of total)
- MRR: $70,000
- ARR: $900,000

### Revenue Drivers

#### Primary Revenue Streams (Year 1)
1. **Subscription Revenue**: 95% (~$80K)
   - Monthly subscriptions: $40K
   - Annual subscriptions: $40K

2. **Other Revenue**: 5% (~$5K)
   - Affiliate partnerships (home insurance)
   - Referral fees (home services)

#### Future Revenue Streams (Year 2+)
3. **Enterprise/Property Manager**: $19.99/month
   - Target: 100 property managers by Year 2
   - Additional ARR: $24K

4. **API Access**: $99/month for developers
   - Target: 20 API customers by Year 2
   - Additional ARR: $24K

5. **White Label**: $499/month for businesses
   - Target: 5 white label customers by Year 3
   - Additional ARR: $30K

6. **Affiliate Revenue**: Commission on referred services
   - Home insurance: $50 per sign-up
   - Home warranty services: $75 per sign-up
   - Appliance retailers: 5% of sale
   - Target Year 2: $15K

## LTV/CAC Analysis

### Customer Lifetime Value (LTV)

#### Assumptions
- **Average Revenue Per User (ARPU)**: $4.50/month
  - Blend of monthly ($4.99) and annual ($4.16/month)
- **Average Customer Lifetime**: 24 months
- **Gross Margin**: 80% (after infrastructure costs)

#### LTV Calculation
```
LTV = ARPU × Lifetime × Gross Margin
LTV = $4.50 × 24 × 0.80
LTV = $86.40
```

#### LTV by Customer Type
- **Monthly subscribers**: $4.99 × 18 months × 0.80 = $71.86
- **Annual subscribers**: $4.16 × 30 months × 0.80 = $99.84
- **Blended LTV**: $86.40

### Customer Acquisition Cost (CAC)

#### Acquisition Channels & Costs

**Organic Channels (Year 1: 60% of users):**
- App Store Optimization: $0 CAC
- Referral/Viral: $0 CAC
- Content Marketing: $1,000/month ÷ 200 users = $5 CAC
- Social Media (organic): $0 CAC

**Paid Channels (Year 1: 40% of users):**
- Facebook/Instagram Ads: $15 CAC
- Google Ads: $12 CAC
- Influencer Marketing: $8 CAC
- App Store Search Ads: $10 CAC

**Blended CAC (Year 1):**
```
Blended CAC = (60% × $2) + (40% × $12)
Blended CAC = $6.00
```

### LTV:CAC Ratio

**Year 1:**
```
LTV:CAC = $86.40 ÷ $6.00 = 14.4
```

**Target Ratio:** 3:1 minimum (Achieved: 14.4:1 ✓)

**Interpretation:**
- Excellent ratio in Year 1 due to organic growth
- Allows for aggressive paid acquisition scaling
- Can afford CAC up to $28 and maintain 3:1 ratio

### Payback Period

```
Payback Period = CAC ÷ (ARPU × Gross Margin)
Payback Period = $6.00 ÷ ($4.50 × 0.80)
Payback Period = 1.67 months
```

**Target:** <12 months (Achieved: 1.67 months ✓)

### Unit Economics Optimization

#### Improve LTV (Target: $120)
1. **Reduce churn**: 5% → 3% monthly (+$20 LTV)
2. **Increase ARPU**: Upsell to annual plans (+$10 LTV)
3. **Expand product**: Add-on services (+$15 LTV)

#### Reduce CAC (Target: $8 while scaling)
1. **Improve viral coefficient**: 0.3 → 0.5 (-$2 CAC)
2. **Optimize ad targeting**: Better conversion (-$1 CAC)
3. **Content marketing scale**: More organic traffic (-$1 CAC)

### Cohort Analysis

#### Month 1 Cohort (500 users)
- **M0**: 500 users, 125 trials, 38 paid
- **M1**: 36 paid (5% churn)
- **M3**: 33 paid
- **M6**: 29 paid
- **M12**: 23 paid
- **Total revenue from cohort**: $1,260 over 12 months

## Cost Structure

### Fixed Costs (Monthly)

**Personnel (Lean startup):**
- 1 Full-time developer: $8,000
- 1 Part-time designer: $3,000
- Founder (sweat equity): $0
- **Total Personnel**: $11,000/month

**Infrastructure:**
- AWS hosting: $500
- Database (Firebase/Supabase): $200
- CDN (Cloudflare): $100
- Email service (SendGrid): $50
- Analytics (Mixpanel): $100
- **Total Infrastructure**: $950/month

**Software & Tools:**
- Development tools: $100
- Design tools (Figma): $45
- Project management: $50
- Customer support (Intercom): $150
- **Total Software**: $345/month

**Marketing:**
- Content creation: $500
- Social media management: $300
- SEO tools: $100
- **Total Marketing**: $900/month

**Total Fixed Costs**: $13,195/month

### Variable Costs

**Per User:**
- Cloud storage: $0.05/user/month
- Push notifications: $0.01/user/month
- Email sends: $0.02/user/month
- **Total per user**: $0.08/month

**At 1,000 users**: $80/month
**At 15,000 users**: $1,200/month

### Gross Margin Analysis

**Revenue (Month 12)**: $5,243
**Variable Costs**: $1,200
**Gross Profit**: $4,043
**Gross Margin**: 77%

**Year 1 Total:**
- Revenue: $85,000
- Variable Costs: $10,000
- Fixed Costs: $158,340
- **Net Loss**: $83,340 (requires funding/bootstrapping)

**Break-even Analysis:**
- Need MRR of $13,195 to break even on monthly basis
- At $4.50 ARPU with 80% margin: Need 3,665 paid subscribers
- With 30% trial conversion and 25% trial rate: Need ~48,800 total users
- **Estimated break-even**: Month 15-18

## Pricing Experiments & Optimization

### A/B Testing Framework

#### Price Point Testing
- **Test A**: $3.99/month vs **Test B**: $4.99/month
- **Test A**: $39.99/year vs **Test B**: $49.99/year
- Measure: Conversion rate, LTV, retention

#### Packaging Testing
- **Test A**: 3-tier (Free, Premium, Pro)
- **Test B**: 2-tier (Free, Premium)
- Measure: Upgrade rate, revenue per user

#### Trial Length Testing
- **Test A**: 7-day trial
- **Test B**: 14-day trial
- **Test C**: 30-day trial
- Measure: Trial-to-paid conversion, activation

### Dynamic Pricing Opportunities

#### Personalized Discounts
- **High engagement, no upgrade**: 25% off first 3 months
- **Churned subscriber**: 50% off to return
- **Referral bonus**: 1 month free for 5 referrals

#### Seasonal Promotions
- Black Friday: 40% off annual plan
- New Year: First month free
- Spring cleaning: 3 months for price of 2

#### Geographic Pricing
- Adjust pricing for different markets
- Lower price in developing countries
- Higher price in premium markets (adjust for PPP)

## Competitive Pricing Analysis

### Competitor Comparison

| App | Free Tier | Premium Monthly | Premium Annual |
|-----|-----------|----------------|----------------|
| Homie | 50 items, 10 tasks | $4.99 | $49.99 |
| Sortly | 100 items | $9/seat | $108/seat |
| Memento | 50 items | $2.99 | $29.99 |
| Encircle | No free tier | $9.99 | $99.99 |
| MyStuff2 | 100 items | $4.99 | $49.99 |

**Positioning:**
- **Premium features at competitive price**
- **Better than Memento** (more features)
- **Cheaper than Sortly/Encircle** (better value)
- **Similar to MyStuff2** (differentiate on UX, AI features)

## Payment & Subscription Management

### Payment Processing
- **iOS**: Apple In-App Purchase (30% fee Year 1, 15% after)
- **Android**: Google Play Billing (30% fee Year 1, 15% after)
- **Web** (future): Stripe (2.9% + $0.30)

### Subscription Management
- **SDK**: RevenueCat for cross-platform subscription management
- **Features**: Subscription status sync, receipt validation, webhook handling
- **Benefits**: Reduce development time, handle edge cases

### Refund Policy
- **Trial period**: No charge if cancelled before trial ends
- **Within 7 days**: Full refund, no questions asked
- **Within 30 days**: Prorated refund for annual plans
- **After 30 days**: No refund (per App Store/Play Store policies)

## Financial Milestones

### Year 1 Goals
- [ ] $10K MRR by Month 6
- [ ] $85K ARR by Month 12
- [ ] 1,000 paid subscribers
- [ ] 15,000 total users
- [ ] LTV:CAC ratio > 3:1
- [ ] Gross margin > 75%

### Year 2 Goals
- [ ] $25K MRR by Month 18
- [ ] $300K ARR by Month 24
- [ ] 5,000 paid subscribers
- [ ] 50,000 total users
- [ ] Break-even on monthly operations
- [ ] Launch enterprise tier

### Year 3 Goals
- [ ] $75K MRR
- [ ] $900K ARR
- [ ] 18,000 paid subscribers
- [ ] 150,000 total users
- [ ] Profitability
- [ ] Series A readiness

## Appendix: Revenue Model Calculator

### Key Inputs
- Users acquired per month
- Free to trial conversion rate
- Trial to paid conversion rate
- Monthly vs annual split
- Monthly/annual churn rates
- Monthly/annual pricing
- CAC by channel

### Outputs
- MRR by month
- ARR projection
- Paid subscriber count
- LTV by cohort
- LTV:CAC ratio
- Payback period
- Break-even timeline

### Google Sheets Template
[Link to financial model spreadsheet - to be created]

## Success Metrics Dashboard

### Monitor Weekly
- New user signups
- Trial starts
- Trial-to-paid conversion
- MRR growth
- Churn rate
- CAC by channel

### Monitor Monthly
- ARR
- Paid subscribers
- LTV:CAC ratio
- Gross margin
- Burn rate
- Runway

## Risk Mitigation

### Revenue Risks
1. **Lower than expected conversion**: Improve onboarding, add more value
2. **Higher churn**: Better retention features, improve product quality
3. **Platform fee changes**: Diversify to web/direct billing

### Cost Risks
1. **Infrastructure costs scale faster**: Optimize architecture, use reserved instances
2. **CAC increases**: Improve organic growth, viral features
3. **Personnel costs**: Outsource non-core functions, automate

### Market Risks
1. **Competition intensifies**: Differentiate on AI features, UX, community
2. **Market size smaller than expected**: Expand to adjacent markets (property management)
3. **Economic downturn**: Emphasize cost savings, ROI of organization
