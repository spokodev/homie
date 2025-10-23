# HOMIE Component Specifications

## Screen Components

### 1. Welcome Screen
```tsx
Components:
- Logo animation (Homie mascot)
- Tagline text
- Get Started button
- Already have account link

Props: {
  onGetStarted: () => void
  onLogin: () => void
}
```

### 2. Onboarding Screens
```tsx
Components:
- Progress indicator (dots)
- Illustration/Animation
- Title + Description
- Input fields (name, household)
- Continue button
- Skip link

Steps:
1. Enter your name + avatar
2. Create/Join household
3. Add members (optional)
4. Set first captain (optional)
5. Tutorial (optional)
```

### 3. Home Dashboard
```tsx
Components:
- Header with household name
- Captain of the week card
- My tasks section
- Quick actions (+ task, rate captain)
- Points/level display
- Streak counter

Sections:
- Current Captain banner
- Today's tasks (3 max)
- Quick stats (points, streak, rank)
- Recent activity feed
```

### 4. Tasks Screen
```tsx
Components:
- Tab bar (All, Mine, Completed)
- Task cards list
- Filter chips (room, member, date)
- Floating action button (+)

Task Card:
- Title + room badge
- Assigned avatar
- Points value
- Due date/time
- Quick complete checkbox
```

### 5. Task Detail Modal
```tsx
Components:
- Header with close button
- Title + description
- Room + assigned to
- Timer display
- Start/Pause/Complete buttons
- Satisfaction rating (on complete)
- Photo attachment

Timer States:
- Not started
- Running (show elapsed)
- Paused
- Completed
```

### 6. Captain Rating Screen
```tsx
Components:
- Captain info card
- Star rating (1-5)
- What went well (chips)
- What could improve (chips)
- Overall comment (text)
- Private note (text)
- Submit button

Premium adds:
- Category ratings
- Suggested feedback
- Previous ratings comparison
```

### 7. Rooms & Notes
```tsx
Components:
- Room grid (2 columns)
- Room card (icon + name + note count)
- Add room button

Room Detail:
- Room header
- Sticky notes grid
- Add note FAB
- Note filtering (pinned, color)

Note Card:
- Content text
- Author avatar
- Color background
- Pin indicator
- Photo thumbnail
- Edit/Delete (if author)
```

### 8. Family Chat
```tsx
Components:
- Messages list
- Message bubble
- System messages
- Typing indicator
- Input bar with send
- Image picker

Message Types:
- Text message
- Image message
- System (task complete, achievement)
- Link (to task/note)
```

### 9. Leaderboard
```tsx
Components:
- Week/All-time toggle
- Podium display (top 3)
- Ranking list
- Points + badges display
- Pet champions section

Podium:
- Gold (1st)
- Silver (2nd)
- Bronze (3rd)
- Animated transitions
```

### 10. Profile
```tsx
Components:
- Avatar + edit button
- Name + level
- Stats grid
- Badges collection
- Settings menu
- Premium upgrade CTA

Stats:
- Total points
- Current streak
- Tasks completed
- Average rating
- Badges earned
```

## Shared Components

### Button
```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger'
  size: 'small' | 'medium' | 'large'
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  icon?: IconName
  children: string
}
```

### Card
```tsx
interface CardProps {
  variant: 'flat' | 'elevated' | 'outlined'
  padding?: 'none' | 'small' | 'medium' | 'large'
  onPress?: () => void
  children: ReactNode
}
```

### Avatar
```tsx
interface AvatarProps {
  source: string | number
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  badge?: number
  online?: boolean
  type?: 'human' | 'pet'
}
```

### Input
```tsx
interface InputProps {
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  error?: string
  helperText?: string
  secureTextEntry?: boolean
  keyboardType?: KeyboardType
}
```

### Badge
```tsx
interface BadgeProps {
  count: number
  variant: 'number' | 'dot'
  color?: 'primary' | 'success' | 'warning' | 'error'
  max?: number
}
```

### TabBar
```tsx
interface TabBarProps {
  items: Array<{
    label: string
    icon: IconName
    badge?: number
  }>
  activeIndex: number
  onIndexChange: (index: number) => void
}
```

### EmptyState
```tsx
interface EmptyStateProps {
  icon: IconName
  title: string
  description: string
  action?: {
    label: string
    onPress: () => void
  }
}
```

### Loading
```tsx
interface LoadingProps {
  size?: 'small' | 'medium' | 'large'
  color?: string
  fullScreen?: boolean
  text?: string
}
```

### Toast
```tsx
interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  action?: {
    label: string
    onPress: () => void
  }
}
```

## Animations

### Task Completion
1. Checkbox fills with color
2. Confetti burst
3. Points counter animates up
4. Card fades out
5. Success haptic

### Level Up
1. Screen flash
2. Level badge grows
3. Particles emanate
4. Sound effect
5. Heavy haptic

### Rating Submit
1. Stars pulse
2. Send animation
3. Success checkmark
4. Points award animation

### Streak Milestone
1. Fire emoji grows
2. Number counter rolls
3. Badge unlock if applicable
4. Celebration haptic