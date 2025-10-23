# HomieLife Database Schema

Complete database schema for the HomieLife application using Supabase (PostgreSQL).

## Table of Contents
- [Tables](#tables)
  - [households](#households)
  - [members](#members)
  - [tasks](#tasks)
  - [messages](#messages)
  - [rooms](#rooms)
  - [room_notes](#room_notes)
  - [captain_ratings](#captain_ratings)
  - [member_badges](#member_badges)
- [Row Level Security](#row-level-security)
- [Functions & Triggers](#functions--triggers)

---

## Tables

### households

Stores household information and captain rotation data.

```sql
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🏠',
  settings JSONB DEFAULT '{}',

  -- Captain Rotation
  captain_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  captain_started_at TIMESTAMPTZ,
  captain_ends_at TIMESTAMPTZ,
  captain_total_ratings INTEGER DEFAULT 0,
  captain_average_rating DECIMAL(3,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique household identifier
- `name`: Household display name
- `icon`: Emoji icon for the household
- `settings`: JSON settings (premium status, preferences, etc.)
- `captain_member_id`: Current captain member ID
- `captain_started_at`: When current captain rotation started
- `captain_ends_at`: When current captain rotation ends
- `captain_total_ratings`: Total number of ratings for current captain
- `captain_average_rating`: Average rating (1-5) for current captain

**Indexes:**
```sql
CREATE INDEX idx_households_captain ON households(captain_member_id);
```

---

### members

Stores member information within a household.

```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  avatar TEXT DEFAULT '😊',
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  type TEXT DEFAULT 'human' CHECK (type IN ('human', 'pet')),

  -- Gamification
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_completed_at TIMESTAMPTZ,

  -- Captain Stats
  times_captain INTEGER DEFAULT 0,
  captain_average_rating DECIMAL(3,2),

  -- Notifications
  push_token TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(household_id, user_id)
);
```

**Fields:**
- `times_captain`: Total times member has been captain
- `captain_average_rating`: Lifetime average captain rating
- `push_token`: Expo push notification token for this member

**Indexes:**
```sql
CREATE INDEX idx_members_household ON members(household_id);
CREATE INDEX idx_members_user ON members(user_id);
CREATE INDEX idx_members_points ON members(points DESC);
```

---

### tasks

Stores household tasks.

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),

  assignee_id UUID REFERENCES members(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  recurring_task_id UUID REFERENCES recurring_tasks(id) ON DELETE SET NULL,

  due_date TIMESTAMPTZ,
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  points INTEGER DEFAULT 10,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_tasks_household ON tasks(household_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

---

### messages

Stores household chat messages with real-time support.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'system')),
  image_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_messages_household ON messages(household_id, created_at DESC);
CREATE INDEX idx_messages_member ON messages(member_id);
```

---

### rooms

Stores rooms within a household.

```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  icon TEXT DEFAULT '🏠',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(household_id, name)
);
```

**Indexes:**
```sql
CREATE INDEX idx_rooms_household ON rooms(household_id);
```

---

### room_notes

Stores sticky notes for rooms.

```sql
CREATE TABLE room_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  color TEXT DEFAULT '#FFD93D',
  is_pinned BOOLEAN DEFAULT FALSE,
  expires_at DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_room_notes_room ON room_notes(room_id, is_pinned DESC, created_at DESC);
CREATE INDEX idx_room_notes_member ON room_notes(member_id);
```

---

### captain_ratings

Stores ratings for captains at the end of their rotation.

```sql
CREATE TABLE captain_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  captain_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  rated_by_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,

  rotation_start TIMESTAMPTZ NOT NULL,
  rotation_end TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One rating per member per captain rotation
  UNIQUE(household_id, captain_member_id, rated_by_member_id, rotation_start)
);
```

**Fields:**
- `captain_member_id`: The member who was captain
- `rated_by_member_id`: The member giving the rating
- `rating`: Star rating (1-5)
- `comment`: Optional text feedback
- `rotation_start`: When the captain's week started
- `rotation_end`: When the captain's week ended

**Indexes:**
```sql
CREATE INDEX idx_captain_ratings_household ON captain_ratings(household_id);
CREATE INDEX idx_captain_ratings_captain ON captain_ratings(captain_member_id);
CREATE INDEX idx_captain_ratings_rotation ON captain_ratings(rotation_start, rotation_end);
```

---

### member_badges

Stores badges earned by members.

```sql
CREATE TABLE member_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,

  earned_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(member_id, badge_id)
);
```

**Indexes:**
```sql
CREATE INDEX idx_member_badges_member ON member_badges(member_id);
CREATE INDEX idx_member_badges_badge ON member_badges(badge_id);
```

---

### recurring_tasks

Stores templates for recurring tasks that generate task instances automatically.

```sql
CREATE TABLE recurring_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,

  -- Template fields
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  room TEXT,
  estimated_minutes INTEGER,
  points INTEGER,
  assignee_id UUID REFERENCES members(id) ON DELETE SET NULL,

  -- Recurrence settings
  recurrence_rule JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  last_generated_at TIMESTAMPTZ,
  next_occurrence_at TIMESTAMPTZ NOT NULL,
  total_occurrences INTEGER DEFAULT 0,

  created_by UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Fields:**
- `recurrence_rule`: JSON object with frequency, interval, days_of_week, day_of_month, end_date, end_after_occurrences
- `is_active`: Whether this recurring task is currently active
- `last_generated_at`: When the last task instance was generated
- `next_occurrence_at`: When the next task instance should be generated
- `total_occurrences`: Count of how many task instances have been generated

**Indexes:**
```sql
CREATE INDEX idx_recurring_tasks_household ON recurring_tasks(household_id);
CREATE INDEX idx_recurring_tasks_active ON recurring_tasks(is_active, next_occurrence_at);
CREATE INDEX idx_recurring_tasks_next ON recurring_tasks(next_occurrence_at) WHERE is_active = TRUE;
```

---

## Row Level Security

All tables have Row Level Security (RLS) enabled to ensure users can only access data from their households.

### Example RLS Policies

```sql
-- households: Users can only access households they are members of
CREATE POLICY "Users can view their households"
  ON households FOR SELECT
  USING (
    id IN (
      SELECT household_id FROM members WHERE user_id = auth.uid()
    )
  );

-- tasks: Users can only access tasks from their households
CREATE POLICY "Users can view household tasks"
  ON tasks FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM members WHERE user_id = auth.uid()
    )
  );

-- captain_ratings: Users can only rate in their household
CREATE POLICY "Users can create ratings in their household"
  ON captain_ratings FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM members WHERE user_id = auth.uid()
    )
  );
```

---

## Functions & Triggers

### Auto-update timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Captain Rotation (To be implemented as cron job)

```sql
-- This would be called by a Supabase Edge Function or external cron
CREATE OR REPLACE FUNCTION rotate_captain(household_uuid UUID)
RETURNS VOID AS $$
DECLARE
  next_captain UUID;
BEGIN
  -- Get next captain (member who hasn't been captain recently, or random)
  SELECT id INTO next_captain
  FROM members
  WHERE household_id = household_uuid
    AND type = 'human'
  ORDER BY
    COALESCE(times_captain, 0) ASC,
    RANDOM()
  LIMIT 1;

  -- Update household with new captain
  UPDATE households
  SET
    captain_member_id = next_captain,
    captain_started_at = NOW(),
    captain_ends_at = NOW() + INTERVAL '7 days',
    captain_total_ratings = 0,
    captain_average_rating = NULL
  WHERE id = household_uuid;

  -- Increment times_captain for the member
  UPDATE members
  SET times_captain = COALESCE(times_captain, 0) + 1
  WHERE id = next_captain;
END;
$$ LANGUAGE plpgsql;
```

---

## Migration Notes

### Adding Captain Fields to Existing Tables

```sql
-- Add captain fields to households table
ALTER TABLE households
  ADD COLUMN IF NOT EXISTS captain_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS captain_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS captain_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS captain_total_ratings INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS captain_average_rating DECIMAL(3,2);

-- Add captain stats to members table
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS times_captain INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS captain_average_rating DECIMAL(3,2);

-- Create captain_ratings table
CREATE TABLE IF NOT EXISTS captain_ratings (
  -- (see schema above)
);

-- Add push_token field for notifications (v0.8.2)
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Create recurring_tasks table (v0.8.7)
CREATE TABLE IF NOT EXISTS recurring_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  room TEXT,
  estimated_minutes INTEGER,
  points INTEGER,
  assignee_id UUID REFERENCES members(id) ON DELETE SET NULL,
  recurrence_rule JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_generated_at TIMESTAMPTZ,
  next_occurrence_at TIMESTAMPTZ NOT NULL,
  total_occurrences INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for recurring_tasks
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_household ON recurring_tasks(household_id);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_active ON recurring_tasks(is_active, next_occurrence_at);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_next ON recurring_tasks(next_occurrence_at) WHERE is_active = TRUE;

-- Add recurring_task_id to tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS recurring_task_id UUID REFERENCES recurring_tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_recurring ON tasks(recurring_task_id);
```

---

## Supabase Setup Checklist

- [ ] Enable RLS on all tables
- [ ] Create RLS policies for each table
- [ ] Set up Realtime for messages table
- [ ] Create indexes for performance
- [ ] Set up Edge Function for captain rotation (weekly cron)
- [ ] Configure storage bucket for message images (future)
- [ ] Set up database backups
