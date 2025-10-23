# Homie Onboarding Strategy

## Overview
This document outlines the onboarding strategy for Homie, focusing on user acquisition, activation, and early engagement. The goal is to get users to their first "aha moment" within 30 seconds while building long-term engagement habits.

## Progressive Onboarding Flow

### 30-Second Minimal Start
The onboarding flow is designed to minimize friction and get users productive immediately.

#### Step 1: Welcome Screen (5 seconds)
- Brief value proposition: "Manage your home together"
- Single CTA: "Get Started"
- Skip option for returning users

#### Step 2: Account Creation (10 seconds)
- Social sign-in options (Apple, Google)
- Email/password as fallback
- Auto-generated household name suggestion
- No email verification required initially

#### Step 3: Household Setup (10 seconds)
- Pre-filled household name (editable)
- Option to "Start Solo" or "Invite Members" (can skip)
- Default room templates auto-created

#### Step 4: First Action (5 seconds)
- Immediately land on Items tab
- Pre-populated with 2-3 sample items
- Clear CTA: "Add Your First Item"
- Celebrate first item addition with animation

### Extended Onboarding (Days 1-7)
Progressive feature discovery during first week:

**Day 1:**
- Core features: Add items, create tasks
- Tooltip: "Tap camera icon to scan receipts"

**Day 2:**
- Household features: "Invite your first household member"
- Show collaborative benefits

**Day 3:**
- Maintenance features: "Never miss warranty expiration"
- Set up first maintenance reminder

**Day 5:**
- Advanced features: "Try scanning a receipt with AI"
- Photo management tips

**Day 7:**
- Gamification: "You've earned 150 points this week!"
- Show leaderboard position

## Empty States for All Screens

### Items Tab (Default Landing)
**Empty State:**
- Icon: Home illustration
- Title: "Start Building Your Home Inventory"
- Subtitle: "Add items to track warranties, manuals, and maintenance"
- Primary CTA: "Add First Item"
- Secondary CTA: "Scan Receipt"
- Quick add suggestions: "Try adding: TV, Refrigerator, Washing Machine"

### Tasks Tab
**Empty State:**
- Icon: Checklist illustration
- Title: "No Tasks Yet"
- Subtitle: "Create tasks to stay on top of home maintenance"
- Primary CTA: "Create First Task"
- Suggestions: "Popular tasks: Change HVAC filter, Test smoke detectors"

### Documents Tab
**Empty State:**
- Icon: Document folder illustration
- Title: "Store Important Documents"
- Subtitle: "Keep receipts, warranties, and manuals in one place"
- Primary CTA: "Upload Document"
- Secondary CTA: "Scan Receipt"

### Household Tab
**Empty State (Solo User):**
- Icon: People illustration
- Title: "Manage Your Home Together"
- Subtitle: "Invite household members to collaborate"
- Primary CTA: "Invite Members"
- Value props: "Share items, split tasks, stay organized"

### Profile/Stats Tab
**Empty State:**
- Icon: Trophy illustration
- Title: "Start Earning Points"
- Subtitle: "Complete tasks and add items to climb the leaderboard"
- Show point breakdown: "Add item: 10pts, Complete task: 20pts"

## Push Notification Strategy

### Permission Request Timing
- **NOT on first launch**: Wait until user completes first valuable action
- **Trigger**: After adding 3rd item or completing first task
- **Context**: "Get reminders for upcoming maintenance and tasks"
- **Soft ask first**: In-app prompt before system permission

### Notification Types

#### Onboarding Notifications (Days 1-7)
- **Day 1, +4 hours**: "Add your first task to stay organized"
- **Day 2**: "Invite household members to collaborate"
- **Day 3**: "Did you know? Scan receipts with your camera"
- **Day 5**: "You're doing great! 5 items added this week"
- **Day 7**: "Your weekly summary is ready"

#### Engagement Notifications
- **Task reminders**: 1 day before due date
- **Warranty expiration**: 30, 7, 1 days before
- **Streak preservation**: "Don't break your 5-day streak!"
- **Social**: "[Name] completed a task in your household"

#### Re-engagement Notifications
- **Day 3 inactive**: "Your home needs you! Check pending tasks"
- **Day 7 inactive**: "We miss you! New features added"
- **Day 14 inactive**: "Your household is waiting"

### Notification Best Practices
- Max 1 notification per day (excluding critical reminders)
- Smart send times: 9 AM, 6 PM local time
- Personalized content using user name, household name
- A/B test messaging and timing
- Easy opt-out per category

## In-App Tutorials

### Contextual Tooltips
Show tooltips on first interaction with each feature:

1. **Camera Icon**: "Scan receipts and extract details automatically"
2. **Filter Button**: "Filter items by room, category, or warranty status"
3. **Point Badge**: "Earn points for every action. Compete with household!"
4. **Share Icon**: "Invite members via link, email, or SMS"

### Interactive Walkthroughs

#### First Item Addition
- Highlight "+" button with overlay
- Step-by-step guide through item form
- Celebrate completion with confetti animation
- Award 10 points

#### First Receipt Scan
- Show camera viewfinder overlay
- Guide on proper receipt positioning
- Auto-extract demo with sample receipt
- Award 25 points for first scan

#### First Household Invitation
- Explain benefits of collaboration
- Show invite flow
- Preview what invitee will see
- Award 50 points for first accepted invite

### Tutorial Access
- Help icon in navigation bar
- "Tips & Tricks" section in Settings
- Searchable tutorial library
- Video tutorials for complex features (3-minute recipe videos)

## Onboarding Metrics

### Key Performance Indicators

#### Activation Metrics
- **Time to First Item**: Target <60 seconds
- **D0 Items Added**: Target 3+ items
- **D0 Task Created**: Target 30% of users
- **D0 Household Invite**: Target 15% of users

#### Engagement Metrics
- **D1 Retention**: Target 40%
- **D7 Retention**: Target 35%
- **D30 Retention**: Target 20%
- **WAU/MAU Ratio**: Target 60%

#### Feature Adoption
- **Receipt Scan D7**: Target 25%
- **Photo Upload D7**: Target 40%
- **Task Completion D7**: Target 50%
- **Multi-member Household D30**: Target 30%

#### Conversion Metrics
- **Trial Start D7**: Target 15%
- **Trial to Paid**: Target 30%
- **Invite Acceptance Rate**: Target 60%

### Measurement Tools
- **Analytics Platform**: Mixpanel or Amplitude
- **Event Tracking**: All user interactions
- **Funnel Analysis**: Step-by-step drop-off rates
- **Cohort Analysis**: Week-over-week retention
- **A/B Testing**: Optimizely or native solution

### Key Events to Track
```javascript
// User lifecycle
- user_signed_up
- onboarding_started
- onboarding_completed
- first_item_added
- first_task_created
- first_household_created
- first_member_invited

// Feature usage
- item_added
- receipt_scanned
- photo_uploaded
- task_created
- task_completed
- document_uploaded
- warranty_tracked

// Engagement
- session_started
- daily_active
- weekly_active
- streak_milestone
- points_earned

// Conversion
- trial_started
- subscription_purchased
- invite_sent
- invite_accepted
```

## Feature Discovery

### Progressive Disclosure
Reveal features as users progress to avoid overwhelming:

**Week 1: Core Features**
- Add items manually
- Create basic tasks
- Upload photos
- Basic household setup

**Week 2: Productivity Features**
- Receipt scanning
- Warranty tracking
- Task assignments
- Room organization

**Week 3: Advanced Features**
- AI-powered insights
- Spending analytics
- Custom categories
- Bulk operations

**Week 4: Social Features**
- Household challenges
- Leaderboards
- Shared achievements
- Community features

### Feature Announcement Strategies

#### In-App Announcements
- **Modal Cards**: Full-screen feature highlights
- **Banner Notifications**: Subtle top-of-screen alerts
- **Badge Indicators**: "New" badges on menu items
- **What's New Screen**: On app updates

#### Trigger-Based Discovery
- **Behavioral Triggers**: Show feature when relevant
  - Example: Suggest receipt scan after adding 5 items manually
- **Contextual Prompts**: Right time, right place
  - Example: Warranty expiration feature shown when user adds expensive item
- **Milestone Rewards**: Unlock features with points
  - Example: "Unlock AI insights at 500 points"

#### Email/Push Campaigns
- **Feature Spotlight**: Weekly feature highlight
- **Use Case Stories**: How others use the feature
- **Video Tutorials**: 60-second feature demos

### Gamified Discovery
- **Achievement Badges**: "Receipt Scanner Master"
- **Point Bonuses**: 2x points for trying new features
- **Challenges**: "Scan 3 receipts this week"
- **Leaderboard Categories**: Most features used

## Onboarding Optimization Process

### Continuous Improvement Cycle

#### Week 1-2: Measure
- Collect baseline metrics
- Identify major drop-off points
- User feedback surveys (NPS)

#### Week 3-4: Analyze
- Funnel analysis
- Session recordings (Hotjar/FullStory)
- User interviews (5-10 users)

#### Week 5-6: Hypothesize
- Identify top 3 friction points
- Brainstorm solutions
- Prioritize by impact/effort

#### Week 7-8: Test
- A/B test changes
- Monitor metrics
- Iterate quickly

### A/B Testing Ideas
- Onboarding flow length (2 steps vs 4 steps)
- Default household name vs user input
- Sample items vs empty state
- Social sign-in placement
- Skip buttons vs required fields
- Tooltip timing and content
- Notification permission timing
- First-time user rewards

## Success Criteria

### 30-Day Goals
- 40% D1 retention
- 35% D7 retention
- 20% D30 retention
- 3+ items added per user average
- 30% multi-member households
- 15% trial conversion rate

### User Sentiment
- NPS Score: 40+
- App Store Rating: 4.5+
- Support tickets <5% of users
- Positive onboarding feedback: 80%+

## Appendix: Onboarding Checklist

### Pre-Launch
- [ ] Define activation event
- [ ] Set up analytics tracking
- [ ] Create empty states for all screens
- [ ] Design tooltip library
- [ ] Write notification copy
- [ ] Build A/B testing framework
- [ ] Set up user feedback mechanism

### Week 1 Post-Launch
- [ ] Review Day 1 retention
- [ ] Check funnel drop-off rates
- [ ] Monitor crash rates
- [ ] Collect user feedback
- [ ] Analyze session recordings

### Ongoing
- [ ] Weekly metric review
- [ ] Monthly A/B tests
- [ ] Quarterly user interviews
- [ ] Continuous feature iteration
