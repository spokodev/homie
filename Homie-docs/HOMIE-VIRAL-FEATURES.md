# Homie Viral Features

## Overview
This document outlines the viral growth mechanisms built into Homie to encourage organic user acquisition through invites, referrals, and social sharing. The goal is to achieve a viral coefficient (k-factor) of 0.4+ and reduce customer acquisition costs.

## Invite/Referral System

### 100 Points Bonus Structure

#### Inviter Rewards
- **Invite sent**: 10 points (max 5 per day to prevent spam)
- **Invite accepted**: 50 points (when invitee signs up)
- **Invitee activated**: 100 points (when invitee adds 3+ items)
- **Invitee subscribes**: 500 points + 1 month free subscription

#### Invitee Rewards
- **Sign up via invite**: 50 points (instant bonus)
- **First 3 items added**: 25 points each (75 total)
- **First task completed**: 50 points
- **Total welcome bonus**: 175 points

### Referral Mechanisms

#### In-App Invite Flows

**Primary Entry Points:**
1. Household screen "+" button
2. Profile screen "Invite Friends" section
3. After completing first task (contextual prompt)
4. Point milestone celebrations (100, 500, 1000 points)

**Invite Methods:**
- **SMS**: Pre-filled message with invite link
- **Email**: Personalized email with app preview
- **Social Media**: Pre-composed posts for Facebook, Twitter, Instagram
- **QR Code**: Scannable code for in-person invites
- **Link Copy**: Universal link for any platform

#### Invite Message Templates

**SMS Template:**
```
Hey! I'm using Homie to manage our home and thought you'd like it too. Join my household and we'll both get 100 points!
[INVITE_LINK]
- [USER_NAME]
```

**Email Template:**
```
Subject: [USER_NAME] invited you to join their household on Homie

Hi there!

[USER_NAME] is using Homie to manage their home inventory, tasks, and
documents. They'd like you to join their household.

Why Homie?
- Never lose a warranty again
- Share tasks with household members
- Track home maintenance easily
- Scan receipts automatically

Join now and get 50 points to start!

[JOIN HOUSEHOLD BUTTON]

Plus, both you and [USER_NAME] will earn 100 bonus points when you
add your first 3 items!

See you in the app,
The Homie Team
```

**Social Media Template:**
```
I'm organizing my entire home with @HomieApp - tracking warranties,
tasks, and documents all in one place! Join me and we'll both earn
100 points. [INVITE_LINK] #HomeOrganization #SmartHome
```

### Referral Tracking

#### Technical Implementation
- **Unique referral codes**: 6-character alphanumeric (USER123)
- **Deep links**: homie://invite/USER123
- **Universal links**: homie.app/join/USER123
- **Attribution window**: 30 days
- **Multi-touch attribution**: First-touch and last-touch tracking

#### Referral Dashboard
Users can see:
- Total invites sent
- Pending invites (sent but not accepted)
- Accepted invites
- Points earned from referrals
- Personal referral link
- Leaderboard position for referrals

### Household-Specific Invites

#### Household Invite Flow
1. User creates household
2. Prompted to "Invite household members"
3. Select contacts or enter emails
4. Invitees receive household-specific link
5. One-tap join household on signup

#### Household Invite Benefits
- **Pre-configured household**: Join existing household vs creating new
- **Shared context**: "Join [Household Name]'s home"
- **Social proof**: "3 members already using Homie"
- **Instant collaboration**: See existing items/tasks immediately

### Viral Loop Optimization

#### Invitation Triggers
- **First item added**: "Add household members to share items"
- **5 items added**: "Invite family to help manage the home"
- **First task created**: "Assign this task to a household member"
- **Weekly summary**: "Share your progress with household"
- **Achievement unlocked**: "Show your household your achievement!"

#### Incentive Experiments
A/B test different reward structures:
- **Variable rewards**: Random 50-200 points
- **Tiered rewards**: More points for 3rd, 5th, 10th referral
- **Time-limited bonuses**: "Double points this weekend!"
- **Reciprocal rewards**: Both parties get equal points
- **Status rewards**: Special badges for top referrers

## Social Sharing Mechanisms

### Shareable Content Types

#### Achievements
- **Milestone reached**: "1000 points earned!"
- **Streak maintained**: "30-day streak!"
- **Items cataloged**: "100 items tracked!"
- **Tasks completed**: "50 tasks done!"
- **Household stats**: "Our household saved $500 this year!"

#### Weekly/Monthly Summaries
- **Personal stats**: Items added, tasks completed, points earned
- **Household stats**: Total value tracked, warranties saved
- **Savings**: Avoided replacement costs
- **Visual cards**: Beautifully designed shareable images

#### Home Inventory Milestones
- **First 10 items**: "Started my home inventory journey"
- **$10K value tracked**: "Tracking $10,000 worth of items"
- **All rooms cataloged**: "Every room is organized!"
- **Receipt scanning**: "Scanned 25 receipts this month"

### Social Sharing UI/UX

#### Share Button Placement
- On achievement unlock (modal with share button)
- Profile screen achievements section
- Weekly summary email (share to social)
- Leaderboard (share position)

#### Pre-Composed Social Posts

**Achievement Share:**
```
Just hit [MILESTONE] on @HomieApp! Managing my home has never been
easier. [ACHIEVEMENT_IMAGE]
```

**Stats Share:**
```
This month on @HomieApp:
- [X] items added
- [X] tasks completed
- $[X] value protected
Who else is obsessed with home organization? [STATS_CARD]
```

**Household Share:**
```
Our household is crushing it on @HomieApp! [X] items tracked,
[X] tasks completed together. #HomeGoals [HOUSEHOLD_STATS]
```

### Share Incentives
- **First share**: 25 points
- **Weekly share**: 10 points (max once per week)
- **Viral content**: Bonus if post generates 3+ signups
- **Social proof badge**: "Influencer" badge for 10+ signups from shares

## Shareable Achievements

### Achievement System

#### Personal Achievements
- **Getting Started**: Add first item (10 pts)
- **Home Sweet Home**: Add 10 items (50 pts)
- **Inventory Master**: Add 100 items (200 pts)
- **Task Warrior**: Complete 10 tasks (50 pts)
- **Receipt Pro**: Scan 10 receipts (100 pts)
- **Photographer**: Upload 50 photos (75 pts)
- **Warranty Guardian**: Track 5 warranties (100 pts)
- **Organized**: All rooms have items (150 pts)

#### Household Achievements
- **Team Player**: Invite first member (50 pts)
- **Growing Family**: 5 household members (100 pts)
- **Collaborative**: 50 shared tasks completed (200 pts)
- **Household Goal**: $50K total value tracked (300 pts)

#### Time-Based Achievements
- **Consistent**: 7-day streak (100 pts)
- **Dedicated**: 30-day streak (300 pts)
- **Committed**: 90-day streak (1000 pts)
- **Morning Person**: 10 tasks completed before 9 AM (50 pts)
- **Night Owl**: 10 tasks completed after 9 PM (50 pts)

#### Special Achievements
- **Early Adopter**: Joined in first month (500 pts)
- **Trendsetter**: Referred 10 friends (1000 pts)
- **Power User**: Used every feature (200 pts)
- **Maximalist**: 1000+ items tracked (5000 pts)

### Visual Achievement Cards

#### Design Elements
- Gradient backgrounds (brand colors)
- Achievement icon/badge
- Achievement title
- Points earned
- Date achieved
- User name and photo
- Homie logo
- Shareable to Instagram Stories, Twitter, Facebook

#### Card Templates
```
[GRADIENT BACKGROUND]
[ACHIEVEMENT BADGE ICON]

[ACHIEVEMENT TITLE]
[User Name] earned [X] points

[Date]

[HOMIE LOGO]
Track your home at homie.app
```

### Achievement Notifications
- Push notification on unlock
- In-app modal celebration with confetti
- Badge on profile
- Shareable card immediately available
- Email summary of monthly achievements

## Community Challenges

### Challenge Types

#### Daily Challenges
- **Add 3 items today**: 30 points
- **Complete 2 tasks today**: 40 points
- **Scan 1 receipt today**: 50 points
- **Invite 1 friend today**: 100 points

#### Weekly Challenges
- **Add 10 items this week**: 150 points
- **Complete 5 tasks this week**: 200 points
- **Scan 3 receipts this week**: 250 points
- **Upload 10 photos this week**: 100 points

#### Monthly Challenges
- **Add 50 items this month**: 500 points
- **Complete 20 tasks this month**: 600 points
- **Reach 1000 total points**: 1000 bonus points
- **Invite 5 friends this month**: 500 points

#### Household Challenges
- **Household team challenge**: All members add 5 items (500 pts each)
- **Collaborative cleanup**: Complete 20 shared tasks (300 pts each)
- **Inventory race**: First household to 500 items (1000 pts)

### Challenge UI

#### Challenge Dashboard
- Active challenges with progress bars
- Upcoming challenges (preview)
- Completed challenges (history)
- Challenge leaderboards
- Time remaining for each challenge

#### Challenge Notifications
- Daily reminder at 8 AM: "Today's challenge: [CHALLENGE]"
- Progress updates: "You're halfway to today's challenge!"
- Completion celebration: "Challenge completed! +[X] points"
- Near-miss encouragement: "You're so close! 1 more item needed"

### Seasonal/Event Challenges

#### Spring Cleaning Challenge (March-April)
- Add 100 items in 30 days
- Organize every room
- Community goal: 1M items tracked
- Rewards: Special "Spring Cleaner" badge + 1000 points

#### Holiday Prep Challenge (November-December)
- Track all gift receipts
- Create holiday task list
- Share household progress
- Rewards: "Holiday Hero" badge + 500 points

#### New Year Organization Challenge (January)
- Start fresh inventory
- Set yearly goals
- Invite household members
- Rewards: "Fresh Start" badge + 750 points

## Social Proof Elements

### In-App Social Proof

#### User Count
- "Join 50,000+ households managing their homes"
- Update dynamically on login screen
- Milestone celebrations: "100K users reached!"

#### Real-Time Activity Feed
- "Sarah just added a new dishwasher"
- "The Johnson household completed 5 tasks today"
- "Michael earned the Streak Master achievement"
- Privacy: Only first names, no specific details

#### Testimonials
- Featured user stories on home screen
- Video testimonials in onboarding
- Quote cards shareable on social media
- "User of the Week" spotlight

### Household Social Proof

#### Household Stats
- "3 active members"
- "125 items tracked together"
- "450 points earned this week"
- "Top 10% of households"

#### Member Activity
- "[Name] added 5 items today"
- "[Name] completed a task"
- "[Name] reached a milestone"
- "[Name] earned an achievement"

#### Leaderboard
- **Global leaderboard**: Top 100 users by points
- **Household leaderboard**: Members ranked within household
- **Friends leaderboard**: Compare with invited friends
- **Category leaderboards**: Most items, most tasks, best streak

### External Social Proof

#### App Store Optimization
- "4.8★ rating from 5,000+ reviews"
- Featured user reviews
- "App of the Day" badge (if applicable)
- Media mentions and awards

#### Website/Landing Page
- User testimonials with photos
- Case studies of successful households
- Statistics: "Tracking $500M in home value"
- Press mentions and logos

#### Email Signatures
- Encourage users to add: "Organized with Homie"
- Provide branded email signature template
- Link to referral page

## Viral Coefficient Optimization

### Target Metrics
- **K-Factor**: 0.4+ (each user invites 0.4 users on average)
- **Invite conversion rate**: 30%+
- **Viral cycle time**: <7 days
- **Share rate**: 15% of users share achievements

### Optimization Strategies

#### Increase Invitations Sent
- Multiple invite prompts throughout app
- Simplified invite process (1-tap)
- Clear value proposition for inviting
- Gamify invitations (leaderboard for referrals)

#### Increase Invite Acceptance
- Personalized invite messages
- Preview of app benefits in invite
- Social proof in invite email
- Immediate value on signup (50 points)

#### Reduce Viral Cycle Time
- Push notifications for invite status
- Remind users to invite after key actions
- Time-sensitive bonuses ("Invite today for 2x points")
- Automated follow-up reminders

### A/B Testing Ideas
- Referral reward amounts (50 vs 100 vs 200 points)
- Invite timing (immediate vs after first task)
- Invite copy (friendly vs formal)
- Social share incentives (with vs without points)
- Achievement shareability (auto vs manual)

## Privacy & Trust Considerations

### User Control
- Opt-in for social features (not forced)
- Private households option (no social proof shown)
- Control over what's shared externally
- Easy opt-out from challenges

### Data Privacy
- No sharing of sensitive item details
- Anonymized social proof where possible
- Clear privacy policy for shared data
- GDPR/CCPA compliant sharing

### Spam Prevention
- Limit invites to 5 per day
- Detect and ban referral fraud
- No financial incentives (avoid App Store violations)
- Report abuse mechanism

## Success Metrics

### Viral Growth KPIs
- **K-Factor**: 0.4+
- **Invite rate**: 25% of users send invites
- **Invite acceptance**: 30%+
- **Invitee activation**: 50%+
- **Share rate**: 15% of users share achievements
- **Social signup**: 40% from referrals by Month 6

### Engagement KPIs
- **Challenge participation**: 30% of active users
- **Achievement unlocks**: 5+ per user average
- **Household creation**: 60% multi-member households
- **Leaderboard views**: 20% of weekly actives

## Appendix: Viral Loop Diagram

```
New User Signs Up
       ↓
Receives 50 Point Bonus
       ↓
Adds First Items (Activation)
       ↓
Prompted to Invite Household Members
       ↓
Sends Invites (10 pts per invite)
       ↓
Invitee Signs Up (Inviter gets 50 pts)
       ↓
Invitee Activates (Inviter gets 100 pts)
       ↓
Invitee Invited More Users
       ↓
[VIRAL LOOP CONTINUES]
```

## Implementation Checklist

- [ ] Build referral tracking system
- [ ] Create invite templates (SMS, Email, Social)
- [ ] Design achievement cards
- [ ] Implement points system
- [ ] Build leaderboard infrastructure
- [ ] Create challenge engine
- [ ] Set up social sharing SDK
- [ ] Design social proof elements
- [ ] Build analytics for viral metrics
- [ ] A/B testing framework for viral features
- [ ] Fraud detection for referrals
- [ ] Privacy controls for sharing
