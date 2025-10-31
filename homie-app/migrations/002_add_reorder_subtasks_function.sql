-- Migration: Add reorder_subtasks RPC function
-- Date: 2025-01-27
-- Description: RPC function for reordering subtasks with drag and drop

CREATE OR REPLACE FUNCTION reorder_subtasks(
  p_task_id UUID,
  p_subtask_ids UUID[]
)
RETURNS VOID AS $$
DECLARE
  v_index INT := 0;
  v_subtask_id UUID;
BEGIN
  -- Validate that all subtask IDs belong to the task
  IF EXISTS (
    SELECT 1
    FROM unnest(p_subtask_ids) AS sid
    WHERE sid NOT IN (
      SELECT id FROM subtasks WHERE task_id = p_task_id
    )
  ) THEN
    RAISE EXCEPTION 'Invalid subtask IDs provided';
  END IF;

  -- Update sort_order for each subtask
  FOREACH v_subtask_id IN ARRAY p_subtask_ids
  LOOP
    UPDATE subtasks
    SET sort_order = v_index
    WHERE id = v_subtask_id AND task_id = p_task_id;

    v_index := v_index + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reorder_subtasks TO authenticated;