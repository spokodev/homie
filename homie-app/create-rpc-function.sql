-- Створити RPC функцію для читання RLS політик
-- Це дозволить Claude читати стан БД через API

CREATE OR REPLACE FUNCTION public.get_rls_policies(table_name_param text DEFAULT 'members')
RETURNS TABLE (
  policy_name text,
  policy_command text,
  policy_qual text,
  policy_with_check text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    policyname::text as policy_name,
    cmd::text as policy_command,
    qual::text as policy_qual,
    with_check::text as policy_with_check
  FROM pg_policies
  WHERE tablename = table_name_param
  ORDER BY policyname;
$$;

-- Дати доступ service role для виклику цієї функції
GRANT EXECUTE ON FUNCTION public.get_rls_policies TO service_role;
GRANT EXECUTE ON FUNCTION public.get_rls_policies TO authenticated;
