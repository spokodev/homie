# HOMIE Screen Mockup Specifications

## 1. Welcome Screen
```
Layout:
┌─────────────────────┐
│     Status Bar      │
├─────────────────────┤
│                     │
│    [Homie Logo]     │ <- Animated mascot
│                     │
│    "Make home       │ <- Tagline
│   management fun"   │
│                     │
│                     │
│  [Get Started]      │ <- Primary button
│                     │
│  Already a member?  │ <- Text link
│     Sign In         │
└─────────────────────┘

Colors:
- Background: Gradient (white to #FFF8F0)
- Logo: Mascot in full color
- Button: #FF6B6B
- Text: #2D3436
```

## 2. Onboarding - Name Entry
```
Layout:
┌─────────────────────┐
│  ← Progress ••••    │
├─────────────────────┤
│                     │
│   "What's your      │
│     name?"          │
│                     │
│  [_______________]  │ <- Input field
│                     │
│   Choose Avatar:    │
│  [😊][🦊][🐻][🦁]   │ <- Avatar grid
│  [🐶][🐱][🐰][🐼]   │
│                     │
│                     │
│   [Continue →]      │
│                     │
└─────────────────────┘
```

## 3. Home Dashboard
```
Layout:
┌─────────────────────┐
│  🏠 Smith Family  ⚙️│ <- Header
├─────────────────────┤
│ ┌─────────────────┐ │
│ │ Captain of Week │ │ <- Captain card
│ │  [Avatar] Mom   │ │
│ │  3 days left    │ │
│ │  [Rate Now]     │ │
│ └─────────────────┘ │
│                     │
│ My Tasks Today      │
│ ┌─────────────────┐ │
│ │ 🧹 Kitchen      │ │ <- Task cards
│ │ 20 pts • 2pm    │ │
│ ├─────────────────┤ │
│ │ 🗑️ Trash        │ │
│ │ 10 pts • 5pm    │ │
│ └─────────────────┘ │
│                     │
│ Quick Stats         │
│ [150pts][🔥5][#3]  │ <- Points, streak, rank
│                     │
│ [+ Add Task]        │ <- FAB
└─────────────────────┘
│ Home|Rooms|Chat|🏆|👤│ <- Tab bar
└─────────────────────┘
```

## 4. Tasks Screen
```
Layout:
┌─────────────────────┐
│     Tasks       +   │
├─────────────────────┤
│ [All][Mine][Done]   │ <- Tabs
├─────────────────────┤
│ Today               │
│ ┌─────────────────┐ │
│ │ Clean bathroom   │ │
│ │ 🚿 • Mom • 30pts │ │
│ │ Due 3pm    [✓]  │ │
│ └─────────────────┘ │
│ Tomorrow            │
│ ┌─────────────────┐ │
│ │ Walk Malou      │ │
│ │ 🐕 • You • 25pts │ │
│ │ 8am        [ ]  │ │
│ └─────────────────┘ │
└─────────────────────┘
```

## 5. Task Timer Modal
```
Layout:
┌─────────────────────┐
│  ×   Clean Kitchen  │
├─────────────────────┤
│                     │
│     25:34          │ <- Large timer
│   ─────────        │ <- Progress bar
│   Est: 30 min      │
│                     │
│ [❚❚]    [■]        │ <- Pause/Stop
│                     │
│ Points: 30         │
│ Speed Bonus: +5 🎯 │
│                     │
└─────────────────────┘
```

## 6. Captain Rating Screen
```
Layout:
┌─────────────────────┐
│  Rate Mom's Week    │
├─────────────────────┤
│   [Mom Avatar]      │
│   Captain Week #3   │
│                     │
│   ⭐⭐⭐⭐⭐         │ <- Star rating
│                     │
│ What went well?     │
│ [✓Clean] [✓On-time]│ <- Chips
│ [✓Organized] [+]   │
│                     │
│ Could improve?      │
│ [Communication] [+] │
│                     │
│ Overall comment:    │
│ [_______________]   │
│                     │
│ Private note:       │ <- Premium
│ [_______________]   │
│                     │
│   [Submit Rating]   │
└─────────────────────┘
```

## 7. Rooms Grid
```
Layout:
┌─────────────────────┐
│      Rooms & Notes  │
├─────────────────────┤
│ ┌────┐  ┌────┐     │
│ │ 🛋️ │  │ 🍳 │     │ <- Room cards
│ │Living│ │Kitchen│  │
│ │ (3)  │ │ (1)  │  │
│ └────┘  └────┘     │
│ ┌────┐  ┌────┐     │
│ │ 🛏️ │  │ 🚿 │     │
│ │Bedroom││Bath  │  │
│ │ (0)  │ │ (2)  │  │
│ └────┘  └────┘     │
│ ┌────┐  ┌────┐     │
│ │ 🐕 │  │ ➕ │     │
│ │Pet  │ │Add  │    │
│ │Zone │ │Room │    │
│ └────┘  └────┘     │
└─────────────────────┘
```

## 8. Room Detail with Notes
```
Layout:
┌─────────────────────┐
│  ← Kitchen      📌  │
├─────────────────────┤
│ ┌─────────────────┐ │
│ │ Remember to run │ │ <- Pinned note
│ │ dishwasher!     │ │
│ │ - Mom       📌  │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Buy milk        │ │ <- Regular note
│ │ [Photo]         │ │
│ │ - Dad           │ │
│ └─────────────────┘ │
│                     │
│        [+]         │ <- Add note FAB
└─────────────────────┘
```

## 9. Family Chat
```
Layout:
┌─────────────────────┐
│  💬 Family Chat     │
├─────────────────────┤
│ ──── Today ────     │
│                     │
│ Mom:               │
│ ┌─────────────┐    │
│ │Kitchen done!│    │ <- Message bubble
│ └─────────────┘    │
│                     │
│        You:        │
│    ┌──────────┐    │
│    │ Great! 👍│    │
│    └──────────┘    │
│                     │
│ 🎉 Task completed:  │ <- System message
│ Dad finished trash │
│                     │
│ Mom is typing...   │
├─────────────────────┤
│ [Type message] [→] │
└─────────────────────┘
```

## 10. Leaderboard
```
Layout:
┌─────────────────────┐
│    🏆 Leaderboard   │
├─────────────────────┤
│ [Week] [All Time]   │
├─────────────────────┤
│      👑            │
│    [Mom]           │ <- Podium
│  🥇 450pts         │
│ [Dad] [Kid]        │
│ 🥈380 🥉320        │
│                     │
│ 4. You   280pts 🔥5│ <- Rankings
│ 5. Teen  200pts    │
│                     │
│ 🐕 Pet Champions   │
│ 1. Malou  150pts  │
│ 2. Caju   120pts  │
└─────────────────────┘
```

## 11. Profile
```
Layout:
┌─────────────────────┐
│      Profile        │
├─────────────────────┤
│    [Avatar]         │
│    Yaroslav         │
│    Level 12         │
│    ────────         │ <- XP bar
│                     │
│ ┌─────────────────┐ │
│ │ 1,250 pts  🔥15 │ │ <- Stats grid
│ │ 45 tasks   ⭐4.5│ │
│ └─────────────────┘ │
│                     │
│ My Badges           │
│ [🏆][🔥][⚡][🌟][🎯]│ <- Badges
│ [🔒][🔒][🔒][🔒][🔒]│ <- Locked
│                     │
│ [Go Premium 👑]     │ <- Upgrade CTA
│                     │
│ Settings            │
│ > Notifications     │
│ > Account           │
│ > Help              │
│ > Sign Out          │
└─────────────────────┘
```

## 12. Premium Upgrade
```
Layout:
┌─────────────────────┐
│   Unlock Premium    │
├─────────────────────┤
│    Go Beyond        │
│   Basic Chores      │
│                     │
│ ✓ Detailed ratings  │
│ ✓ 30 more levels   │
│ ✓ 15 premium badges│
│ ✓ Speed bonuses    │
│ ✓ Unlimited notes  │
│ ✓ Weekly reports   │
│ ✓ Custom avatars   │
│                     │
│   $4.99/month      │
│                     │
│ [Start Free Trial]  │
│                     │
│  Restore Purchase   │
└─────────────────────┘
```