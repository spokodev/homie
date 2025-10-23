-- HOMIE Database Schema
-- Supabase (PostgreSQL) with Row Level Security

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Users table (managed by Supabase Auth)
-- Using auth.users

-- Households
CREATE TABLE households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(10) DEFAULT '🏠',
    created_by UUID REFERENCES auth.users(id),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members (humans and pets)
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    name VARCHAR(50) NOT NULL,
    avatar VARCHAR(255),
    type VARCHAR(10) CHECK (type IN ('human', 'pet')) DEFAULT 'human',
    pet_type VARCHAR(20), -- dog, cat, etc
    role VARCHAR(20) CHECK (role IN ('owner', 'member')) DEFAULT 'member',
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(household_id, user_id)
);

-- Rooms
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    name VARCHAR(30) NOT NULL,
    icon VARCHAR(10) DEFAULT '🚪',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES members(id),
    created_by UUID REFERENCES members(id),
    due_date TIMESTAMPTZ,
    estimated_minutes INTEGER,
    actual_minutes INTEGER,
    points INTEGER DEFAULT 10,
    status VARCHAR(20) DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES members(id),
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    recurring_pattern JSONB, -- {type: 'daily'|'weekly', days: [1,3,5]}
    photo_url VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cleaning Captain Schedule
CREATE TABLE cleaning_captains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'upcoming',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(household_id, week_start)
);

-- Captain Ratings
CREATE TABLE captain_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    captain_id UUID REFERENCES cleaning_captains(id) ON DELETE CASCADE,
    rated_by UUID REFERENCES members(id),
    stars INTEGER CHECK (stars BETWEEN 1 AND 5),
    feedback_good TEXT[],
    feedback_improve TEXT[],
    overall_comment TEXT,
    private_note TEXT,
    categories JSONB, -- {cleanliness: 5, timeliness: 4, ...}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(captain_id, rated_by)
);

-- Room Notes (Sticky Notes)
CREATE TABLE room_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    created_by UUID REFERENCES members(id),
    content TEXT NOT NULL,
    color VARCHAR(20) DEFAULT 'yellow',
    photo_url VARCHAR(255),
    pinned BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (Chat)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES members(id),
    content TEXT,
    type VARCHAR(20) DEFAULT 'text',
    metadata JSONB, -- {taskId, noteId, imageUrl, etc}
    read_by UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Points Ledger
CREATE TABLE points_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    source VARCHAR(30), -- task, rating, streak, bonus
    source_id UUID,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    criteria JSONB,
    points_required INTEGER,
    is_premium BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0
);

-- Member Badges (Achievements)
CREATE TABLE member_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id),
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(member_id, badge_id)
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'inactive',
    plan VARCHAR(20) DEFAULT 'free',
    expires_at TIMESTAMPTZ,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_tasks_household_status ON tasks(household_id, status);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to, status);
CREATE INDEX idx_tasks_due ON tasks(due_date) WHERE status = 'pending';
CREATE INDEX idx_captains_household ON cleaning_captains(household_id, week_start);
CREATE INDEX idx_ratings_captain ON captain_ratings(captain_id);
CREATE INDEX idx_messages_household ON messages(household_id, created_at DESC);
CREATE INDEX idx_notes_room ON room_notes(room_id, pinned);
CREATE INDEX idx_points_member ON points_ledger(member_id, created_at DESC);

-- Row Level Security Policies
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_captains ENABLE ROW LEVEL SECURITY;
ALTER TABLE captain_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (members can only access their household's data)
CREATE POLICY "Users can view their household"
    ON households FOR SELECT
    USING (id IN (
        SELECT household_id FROM members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can view their household members"
    ON members FOR SELECT
    USING (household_id IN (
        SELECT household_id FROM members WHERE user_id = auth.uid()
    ));

-- Functions
CREATE OR REPLACE FUNCTION calculate_member_level(points INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(points / 100) + 1;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE OR REPLACE FUNCTION update_member_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE members 
    SET 
        points = points + NEW.points,
        level = calculate_member_level(points + NEW.points)
    WHERE id = NEW.member_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_member_stats
    AFTER INSERT ON points_ledger
    FOR EACH ROW
    EXECUTE FUNCTION update_member_stats();

-- ================================================================
-- PERFORMANCE OPTIMIZATIONS AND SCALABILITY ENHANCEMENTS
-- ================================================================

-- Additional Composite Indexes for Query Performance
CREATE INDEX idx_tasks_household_room_status ON tasks(household_id, room_id, status);
CREATE INDEX idx_tasks_household_assigned_due ON tasks(household_id, assigned_to, due_date);
CREATE INDEX idx_tasks_completed_by_date ON tasks(completed_by, completed_at DESC) WHERE status = 'completed';
CREATE INDEX idx_tasks_recurring ON tasks(household_id, recurring_pattern) WHERE recurring_pattern IS NOT NULL;
CREATE INDEX idx_members_household_type ON members(household_id, type, points DESC);
CREATE INDEX idx_members_user_household ON members(user_id, household_id);
CREATE INDEX idx_rooms_household_order ON rooms(household_id, order_index);
CREATE INDEX idx_messages_household_sender ON messages(household_id, sender_id, created_at DESC);
CREATE INDEX idx_messages_unread ON messages(household_id, created_at DESC) WHERE array_length(read_by, 1) IS NULL OR array_length(read_by, 1) = 0;
CREATE INDEX idx_notes_room_pinned_expires ON room_notes(room_id, pinned DESC, expires_at) WHERE expires_at IS NULL OR expires_at > NOW();
CREATE INDEX idx_points_member_source ON points_ledger(member_id, source, created_at DESC);
CREATE INDEX idx_points_source_id ON points_ledger(source_id, source) WHERE source_id IS NOT NULL;
CREATE INDEX idx_captains_household_status ON cleaning_captains(household_id, status, week_start DESC);
CREATE INDEX idx_member_badges_member ON member_badges(member_id, earned_at DESC);
CREATE INDEX idx_subscriptions_household_status ON subscriptions(household_id, status, expires_at);

-- ================================================================
-- OPTIMIZED RLS POLICIES TO PREVENT N+1 QUERIES
-- ================================================================

-- Create helper function to get user's households efficiently
CREATE OR REPLACE FUNCTION get_user_households()
RETURNS TABLE (household_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT m.household_id
    FROM members m
    WHERE m.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Optimized RLS policies using the helper function
DROP POLICY IF EXISTS "Users can view their household members" ON members;
CREATE POLICY "Users can view their household members"
    ON members FOR SELECT
    USING (household_id IN (SELECT get_user_households()));

DROP POLICY IF EXISTS "Users can view their household" ON households;
CREATE POLICY "Users can view their household"
    ON households FOR SELECT
    USING (id IN (SELECT get_user_households()));

-- Optimized policies for other tables
CREATE POLICY "Users can view household rooms"
    ON rooms FOR SELECT
    USING (household_id IN (SELECT get_user_households()));

CREATE POLICY "Users can view household tasks"
    ON tasks FOR SELECT
    USING (household_id IN (SELECT get_user_households()));

CREATE POLICY "Users can view household messages"
    ON messages FOR SELECT
    USING (household_id IN (SELECT get_user_households()));

CREATE POLICY "Users can view household notes"
    ON room_notes FOR SELECT
    USING (room_id IN (
        SELECT id FROM rooms WHERE household_id IN (SELECT get_user_households())
    ));

CREATE POLICY "Users can view household captains"
    ON cleaning_captains FOR SELECT
    USING (household_id IN (SELECT get_user_households()));

CREATE POLICY "Users can view captain ratings"
    ON captain_ratings FOR SELECT
    USING (captain_id IN (
        SELECT id FROM cleaning_captains WHERE household_id IN (SELECT get_user_households())
    ));

CREATE POLICY "Users can view member points"
    ON points_ledger FOR SELECT
    USING (member_id IN (
        SELECT id FROM members WHERE household_id IN (SELECT get_user_households())
    ));

CREATE POLICY "Users can view member badges"
    ON member_badges FOR SELECT
    USING (member_id IN (
        SELECT id FROM members WHERE household_id IN (SELECT get_user_households())
    ));

CREATE POLICY "Users can view household subscriptions"
    ON subscriptions FOR SELECT
    USING (household_id IN (SELECT get_user_households()));

-- ================================================================
-- MATERIALIZED VIEW FOR LEADERBOARD PERFORMANCE
-- ================================================================

CREATE MATERIALIZED VIEW mv_household_leaderboard AS
SELECT
    m.household_id,
    m.id as member_id,
    m.name,
    m.avatar,
    m.type,
    m.pet_type,
    m.points,
    m.level,
    m.streak_days,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed' AND t.completed_at >= date_trunc('week', NOW())) as tasks_week,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as tasks_total,
    AVG(t.satisfaction_rating) FILTER (WHERE t.status = 'completed') as avg_rating,
    COUNT(DISTINCT mb.id) as badge_count,
    ROW_NUMBER() OVER (PARTITION BY m.household_id, m.type ORDER BY m.points DESC) as rank_in_household
FROM members m
LEFT JOIN tasks t ON m.id = t.completed_by
LEFT JOIN member_badges mb ON m.id = mb.member_id
WHERE m.type IN ('human', 'pet')
GROUP BY m.id, m.household_id, m.name, m.avatar, m.type, m.pet_type, m.points, m.level, m.streak_days;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_mv_leaderboard_member ON mv_household_leaderboard(member_id);

-- Index for fast household lookups
CREATE INDEX idx_mv_leaderboard_household_type_rank ON mv_household_leaderboard(household_id, type, rank_in_household);

-- Function to refresh leaderboard (call this periodically)
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_household_leaderboard;
END;
$$ LANGUAGE plpgsql;

-- Schedule automatic refresh every 15 minutes (requires pg_cron extension)
-- SELECT cron.schedule('refresh-leaderboard', '*/15 * * * *', 'SELECT refresh_leaderboard();');

-- ================================================================
-- TABLE PARTITIONING FOR TASKS (FOR SCALABILITY)
-- ================================================================

-- Note: This is the setup for partitioning. Implement when task volume grows.
-- For now, we keep tasks as a regular table, but this shows the migration path.

-- Create partitioned tasks table (future migration)
/*
CREATE TABLE tasks_partitioned (
    id UUID DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES members(id),
    created_by UUID REFERENCES members(id),
    due_date TIMESTAMPTZ,
    estimated_minutes INTEGER,
    actual_minutes INTEGER,
    points INTEGER DEFAULT 10,
    status VARCHAR(20) DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES members(id),
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    recurring_pattern JSONB,
    photo_url VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions for each quarter
CREATE TABLE tasks_2025_q1 PARTITION OF tasks_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE tasks_2025_q2 PARTITION OF tasks_partitioned
    FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
-- Add more partitions as needed
*/

-- ================================================================
-- ARCHIVAL STRATEGY FOR OLD DATA
-- ================================================================

-- Archive table for completed tasks older than 1 year
CREATE TABLE tasks_archive (
    LIKE tasks INCLUDING ALL
);

-- Function to archive old completed tasks
CREATE OR REPLACE FUNCTION archive_old_tasks()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    WITH moved_tasks AS (
        DELETE FROM tasks
        WHERE status = 'completed'
        AND completed_at < NOW() - INTERVAL '1 year'
        RETURNING *
    )
    INSERT INTO tasks_archive
    SELECT * FROM moved_tasks;

    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Archive table for old messages (older than 6 months)
CREATE TABLE messages_archive (
    LIKE messages INCLUDING ALL
);

-- Function to archive old messages
CREATE OR REPLACE FUNCTION archive_old_messages()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    WITH moved_messages AS (
        DELETE FROM messages
        WHERE created_at < NOW() - INTERVAL '6 months'
        RETURNING *
    )
    INSERT INTO messages_archive
    SELECT * FROM moved_messages;

    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Archive table for old points ledger entries
CREATE TABLE points_ledger_archive (
    LIKE points_ledger INCLUDING ALL
);

-- Function to archive old points ledger (keep last 3 months in main table)
CREATE OR REPLACE FUNCTION archive_old_points()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    WITH moved_points AS (
        DELETE FROM points_ledger
        WHERE created_at < NOW() - INTERVAL '3 months'
        RETURNING *
    )
    INSERT INTO points_ledger_archive
    SELECT * FROM moved_points;

    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule archival jobs (requires pg_cron extension)
-- SELECT cron.schedule('archive-tasks', '0 2 * * 0', 'SELECT archive_old_tasks();');
-- SELECT cron.schedule('archive-messages', '0 3 * * 0', 'SELECT archive_old_messages();');
-- SELECT cron.schedule('archive-points', '0 4 * * 0', 'SELECT archive_old_points();');

-- ================================================================
-- BATCH UPDATE FUNCTIONS FOR MEMBER STATS
-- ================================================================

-- Batch update member points and levels (more efficient than trigger for bulk operations)
CREATE OR REPLACE FUNCTION batch_update_member_stats(member_ids UUID[])
RETURNS void AS $$
BEGIN
    UPDATE members m
    SET
        points = COALESCE(p.total_points, 0),
        level = calculate_member_level(COALESCE(p.total_points, 0)),
        updated_at = NOW()
    FROM (
        SELECT
            member_id,
            SUM(points) as total_points
        FROM points_ledger
        WHERE member_id = ANY(member_ids)
        GROUP BY member_id
    ) p
    WHERE m.id = p.member_id;
END;
$$ LANGUAGE plpgsql;

-- Recalculate all member stats in a household
CREATE OR REPLACE FUNCTION recalculate_household_stats(household_uuid UUID)
RETURNS void AS $$
DECLARE
    member_ids UUID[];
BEGIN
    -- Get all member IDs in household
    SELECT ARRAY_AGG(id) INTO member_ids
    FROM members
    WHERE household_id = household_uuid;

    -- Batch update their stats
    PERFORM batch_update_member_stats(member_ids);
END;
$$ LANGUAGE plpgsql;

-- Update member streak days (call daily)
CREATE OR REPLACE FUNCTION update_member_streaks()
RETURNS void AS $$
BEGIN
    -- Increment streak for members who completed tasks today
    UPDATE members m
    SET
        streak_days = streak_days + 1,
        updated_at = NOW()
    WHERE EXISTS (
        SELECT 1
        FROM tasks t
        WHERE t.completed_by = m.id
        AND t.completed_at >= CURRENT_DATE
        AND t.completed_at < CURRENT_DATE + INTERVAL '1 day'
    )
    AND EXISTS (
        -- Also completed task yesterday
        SELECT 1
        FROM tasks t2
        WHERE t2.completed_by = m.id
        AND t2.completed_at >= CURRENT_DATE - INTERVAL '1 day'
        AND t2.completed_at < CURRENT_DATE
    );

    -- Reset streak for members who missed yesterday
    UPDATE members m
    SET
        streak_days = CASE
            WHEN EXISTS (
                SELECT 1 FROM tasks t
                WHERE t.completed_by = m.id
                AND t.completed_at >= CURRENT_DATE
            ) THEN 1
            ELSE 0
        END,
        updated_at = NOW()
    WHERE NOT EXISTS (
        SELECT 1
        FROM tasks t2
        WHERE t2.completed_by = m.id
        AND t2.completed_at >= CURRENT_DATE - INTERVAL '1 day'
        AND t2.completed_at < CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- Schedule streak update daily at midnight
-- SELECT cron.schedule('update-streaks', '0 0 * * *', 'SELECT update_member_streaks();');

-- Batch award badges based on achievements
CREATE OR REPLACE FUNCTION check_and_award_badges(member_uuid UUID)
RETURNS TABLE (badge_id UUID, badge_name VARCHAR) AS $$
BEGIN
    RETURN QUERY
    WITH member_stats AS (
        SELECT
            m.id,
            m.points,
            m.level,
            m.streak_days,
            COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') as completed_tasks,
            AVG(cr.stars) as avg_captain_rating
        FROM members m
        LEFT JOIN tasks t ON m.id = t.completed_by
        LEFT JOIN cleaning_captains cc ON m.id = cc.member_id
        LEFT JOIN captain_ratings cr ON cc.id = cr.captain_id
        WHERE m.id = member_uuid
        GROUP BY m.id, m.points, m.level, m.streak_days
    ),
    eligible_badges AS (
        SELECT DISTINCT b.id, b.name
        FROM badges b
        CROSS JOIN member_stats ms
        WHERE
            -- Check if member meets badge criteria
            (b.points_required IS NULL OR ms.points >= b.points_required)
            AND NOT EXISTS (
                -- Don't award if already earned
                SELECT 1 FROM member_badges mb
                WHERE mb.member_id = member_uuid AND mb.badge_id = b.id
            )
    )
    INSERT INTO member_badges (member_id, badge_id, earned_at)
    SELECT member_uuid, eb.id, NOW()
    FROM eligible_badges eb
    RETURNING badge_id, eb.name as badge_name;
END;
$$ LANGUAGE plpgsql;