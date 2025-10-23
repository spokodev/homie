# HOMIE - Complete Product Requirements Document

## Product Overview

**Name:** Homie  
**Platform:** iOS (React Native/Expo)  
**Backend:** Supabase  
**Version:** 1.0.0  

## Core Concept

Homie transforms household management into a collaborative game where family members earn points, level up, and rate each other's performance as weekly "Cleaning Captain."

## User Flow

### Onboarding
1. Welcome screen with mascot
2. User creates account (email/password)
3. Create or join household
4. Add family members and pets
5. Set up first week's Cleaning Captain
6. Quick tutorial of key features

### Main Features

#### 1. Cleaning Captain System
- Weekly rotation (automatic or manual assignment)
- Captain coordinates household for the week
- End of week: everyone rates the Captain's performance
- Ratings include stars (1-5) and structured feedback
- Captain earns points based on rating

#### 2. Task Management
- Create tasks with title, description, room, assignee
- Point values (10-50 based on complexity)
- Due dates and time estimates
- Timer for tracking actual duration
- Quick templates for common chores
- Photo attachments for instructions
- Task completion with satisfaction rating

#### 3. Rating System
**Free Version:**
- Rate 1-5 stars
- Simple text feedback

**Premium Version:**
- Structured feedback templates
- Category ratings (cleanliness, timeliness, quality, communication, initiative)
- Private notes (only rated person sees)
- Weekly trends and analytics
- Improvement suggestions

#### 4. Gamification
- Points for task completion (10-50 points)
- Speed bonuses for finishing under estimate (Premium)
- Rating bonuses (stars × 20 points)
- 50 levels total (Free: 1-20, Premium: 21-50)
- Daily and weekly streaks
- 20 badges (5 free, 15 premium)
- Leaderboard with current rankings

#### 5. Family Communication
- Real-time chat with typing indicators
- System messages for achievements
- Task and note links in chat
- Image sharing
- Read receipts

#### 6. Room Notes
- Sticky notes attached to specific rooms
- Free: 3 notes per room
- Premium: Unlimited notes with photos
- Pin important notes
- Color coding (yellow, blue, pink, green)
- Expiration dates for temporary reminders

#### 7. Pet Management
- Pet profiles with avatar
- Pet-specific tasks (feeding, walking, grooming)
- Pet care tracking
- Pet champion section in leaderboard

#### 8. Premium Analytics Dashboard

**Overview**
The Premium Analytics Dashboard provides households with deep insights into their cleaning habits, productivity patterns, and household dynamics. Available exclusively to premium subscribers.

**Household Insights**

*Activity Overview*
- Weekly/Monthly task completion trends
- Peak productivity hours and days
- Average task completion time by room
- Most and least active household members
- Task distribution balance across members
- Completion rate by task category

*Room Analytics*
- Room-by-room cleanliness scores
- Time spent cleaning per room
- Most frequently cleaned rooms
- Rooms requiring most maintenance
- Before/after photo comparisons (when available)
- Room-specific task completion rates

*Member Performance*
- Individual productivity metrics
- Task completion velocity over time
- Average satisfaction ratings received
- Specialty areas (which tasks each member excels at)
- Improvement trends and growth metrics
- Contribution percentage to household tasks

*Cleaning Captain Insights*
- Average captain ratings over time
- Best performing captains (hall of fame)
- Captain rating trends by category
- Most common positive feedback themes
- Areas for improvement identification
- Captain rotation fairness analysis

**Predictive Features**

*Smart Scheduling*
- AI-powered task frequency recommendations
- Predicted task duration based on history
- Optimal task assignment suggestions
- Best time to schedule tasks for each member
- Recurring pattern optimization
- Workload balancing predictions

*Trend Analysis*
- Seasonal cleaning pattern detection
- Household productivity forecasts
- Streak maintenance probability
- Member burnout risk detection
- Task bottleneck identification
- Efficiency improvement opportunities

*Alerts & Recommendations*
- Overdue task patterns and prevention
- Unbalanced workload warnings
- Low engagement member notifications
- Suggested task reassignments
- Optimal captain rotation recommendations
- Household goal progress tracking

**Gamification Analytics**

*Points & Progression*
- Points earning velocity by member
- Level progression timeline
- Comparative household rankings (anonymized)
- Badge completion progress
- Streak analysis and predictions
- Point source breakdown (tasks, ratings, bonuses)

*Achievement Tracking*
- Badge unlock history and timeline
- Milestone celebrations
- Personal bests and records
- Household achievements
- Rare achievement identification
- Achievement difficulty ratings

*Leaderboard Insights*
- Position change history
- Competitive analysis
- Gap analysis to next rank
- Historical ranking trends
- Category-specific rankings (speed, quality, consistency)
- Pet vs. human performance comparison

**Export & Reports Functionality**

*Report Types*
- Weekly household summary (PDF/Email)
- Monthly performance report
- Quarterly trend analysis
- Annual household review
- Custom date range reports
- Captain performance reviews

*Export Formats*
- PDF Reports (formatted, print-ready)
- CSV Data Export (raw data for analysis)
- Excel Workbooks (with charts and pivot tables)
- JSON Export (for API integration)
- Image exports for charts and graphs
- Email-ready HTML reports

*Scheduled Reports*
- Automated weekly/monthly delivery
- Custom report scheduling
- Email delivery to household members
- Shared report links (with permissions)
- Report template customization
- Delivery preferences per member

*Custom Report Builder*
- Drag-and-drop report designer
- Custom metric selection
- Date range customization
- Member/room filtering
- Chart type selection (bar, line, pie, etc.)
- Save report templates for reuse

**Data Visualization**

*Chart Types*
- Line charts for trends over time
- Bar charts for comparisons
- Pie charts for distribution
- Heat maps for activity patterns
- Progress bars for goals
- Sparklines for quick insights

*Interactive Dashboards*
- Real-time data updates
- Drill-down capabilities
- Filter and segment data
- Comparison views (week/month/year)
- Time period selection
- Custom dashboard layouts

*Key Metrics Display*
- Total tasks completed
- Average completion time
- Overall satisfaction score
- Household productivity score
- Member participation rate
- Task completion rate
- Weekly/monthly point totals
- Streak status for all members

**Privacy & Sharing**

*Privacy Controls*
- Individual member data privacy
- Household owner analytics access
- Selective metric sharing
- Anonymous benchmarking option
- Data retention settings
- Private notes exclusion from reports

*Sharing Options*
- Share reports with household members
- Export for external sharing
- Generate public links (optional)
- Social media sharing (aggregated stats only)
- Compare with friend households (opt-in)
- Anonymous community benchmarks

**Mobile-First Design**
- Responsive charts and graphs
- Touch-friendly interactions
- Swipe to compare time periods
- Tab-based navigation
- Quick insight cards
- Downloadable reports on mobile
- Push notifications for insights
- Offline report viewing

**Premium Tier Differentiation**

*Free Tier Analytics (Limited)*
- Basic weekly summary
- Current week leaderboard only
- Simple task count metrics
- Basic completion rates
- Last 30 days data only

*Premium Tier Analytics (Full Access)*
- All analytics features
- Unlimited historical data
- Advanced predictive features
- Custom reports and exports
- Scheduled automated reports
- All visualization types
- Comparison and benchmarking
- API access for data export

## Data Model

### Core Entities
- Users (authentication)
- Households (groups)
- Members (users in households, includes pets)
- Tasks (chores to complete)
- CleaningCaptains (weekly assignments)
- CaptainRatings (peer feedback)
- Messages (chat)
- RoomNotes (sticky notes)
- Points (gamification tracking)
- Achievements (badges earned)

## Business Model

### Free Tier
- 1 household
- 5 members max
- Unlimited tasks
- Basic ratings (stars only)
- Levels 1-20
- 5 basic badges
- 3 notes per room
- Basic leaderboard

### Premium ($4.99/month)
- Detailed rating feedback
- Rating analytics & trends
- Levels 21-50
- 15 additional badges
- Speed bonuses
- Unlimited notes with photos
- Custom avatars
- Weekly/monthly reports
- Task categories & filtering
- Data export
- Alternative app icons
- Priority support

## Technical Stack
- Frontend: React Native (Expo SDK 51)
- State: Zustand + React Query
- Backend: Supabase (PostgreSQL + Realtime)
- Analytics: PostHog
- Errors: Sentry
- Payments: RevenueCat