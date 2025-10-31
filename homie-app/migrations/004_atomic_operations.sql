-- Atomic operations for fixing race conditions

-- Function to atomically award points to a member
CREATE OR REPLACE FUNCTION award_points_atomic(
  member_uuid UUID,
  points_to_add INT
)
RETURNS TABLE(new_points INT, new_level INT) AS $$
DECLARE
  updated_points INT;
  updated_level INT;
BEGIN
  -- Update points atomically and return the new values
  UPDATE members
  SET points = COALESCE(points, 0) + points_to_add,
      level = FLOOR((COALESCE(points, 0) + points_to_add) / 100) + 1
  WHERE id = member_uuid
  RETURNING points, level INTO updated_points, updated_level;

  RETURN QUERY SELECT updated_points, updated_level;
END;
$$ LANGUAGE plpgsql;

-- Function to atomically update captain rating stats
CREATE OR REPLACE FUNCTION update_captain_rating_stats(
  captain_uuid UUID,
  household_uuid UUID,
  rotation_start_time TIMESTAMPTZ
)
RETURNS TABLE(avg_rating DECIMAL, total_ratings INT, lifetime_avg DECIMAL) AS $$
DECLARE
  rotation_avg DECIMAL;
  rotation_total INT;
  lifetime_average DECIMAL;
BEGIN
  -- Calculate rotation stats
  SELECT AVG(rating), COUNT(*)
  INTO rotation_avg, rotation_total
  FROM captain_ratings
  WHERE captain_member_id = captain_uuid
    AND rotation_start = rotation_start_time;

  -- Update household stats
  UPDATE households
  SET captain_average_rating = rotation_avg,
      captain_total_ratings = rotation_total
  WHERE id = household_uuid;

  -- Calculate and update lifetime average
  SELECT AVG(rating)
  INTO lifetime_average
  FROM captain_ratings
  WHERE captain_member_id = captain_uuid;

  -- Update member lifetime average
  UPDATE members
  SET captain_average_rating = lifetime_average
  WHERE id = captain_uuid;

  RETURN QUERY SELECT rotation_avg, rotation_total, lifetime_average;
END;
$$ LANGUAGE plpgsql;

-- Function to atomically complete a task and award points
CREATE OR REPLACE FUNCTION complete_task_atomic(
  task_uuid UUID,
  actual_mins INT
)
RETURNS TABLE(member_id UUID, points_awarded INT, new_total_points INT, new_level INT, new_streak INT) AS $$
DECLARE
  task_record RECORD;
  member_record RECORD;
  points_to_award INT;
  new_points INT;
  new_level_value INT;
  new_streak_value INT;
  hours_since_last DECIMAL;
BEGIN
  -- Get task details
  SELECT * INTO task_record FROM tasks WHERE id = task_uuid;

  IF task_record.assignee_id IS NULL THEN
    RETURN;
  END IF;

  -- Mark task as completed
  UPDATE tasks
  SET status = 'completed',
      completed_at = NOW(),
      actual_minutes = actual_mins
  WHERE id = task_uuid;

  -- Get member details
  SELECT * INTO member_record FROM members WHERE id = task_record.assignee_id;

  -- Calculate points to award (could include bonuses here)
  points_to_award := task_record.points;

  -- Calculate new streak
  IF member_record.last_completed_at IS NOT NULL THEN
    hours_since_last := EXTRACT(EPOCH FROM (NOW() - member_record.last_completed_at)) / 3600;
    IF hours_since_last <= 48 THEN
      new_streak_value := COALESCE(member_record.streak_days, 0) + 1;
    ELSE
      new_streak_value := 1;
    END IF;
  ELSE
    new_streak_value := 1;
  END IF;

  -- Update member atomically
  UPDATE members
  SET points = COALESCE(points, 0) + points_to_award,
      level = FLOOR((COALESCE(points, 0) + points_to_award) / 100) + 1,
      streak_days = new_streak_value,
      last_completed_at = NOW()
  WHERE id = task_record.assignee_id
  RETURNING points, level INTO new_points, new_level_value;

  RETURN QUERY SELECT
    task_record.assignee_id,
    points_to_award,
    new_points,
    new_level_value,
    new_streak_value;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION award_points_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION update_captain_rating_stats TO authenticated;
GRANT EXECUTE ON FUNCTION complete_task_atomic TO authenticated;