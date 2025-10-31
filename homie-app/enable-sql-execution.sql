-- Створити RPC функцію для виконання довільних SQL команд
-- ⚠️ УВАГА: Це потужна функція - використовуй обережно!

CREATE OR REPLACE FUNCTION public.execute_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Виконати SQL команду
  EXECUTE sql_query;

  -- Повернути успішний результат
  RETURN json_build_object('success', true, 'message', 'SQL executed successfully');
EXCEPTION
  WHEN OTHERS THEN
    -- Повернути помилку якщо щось пішло не так
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- Дати доступ тільки service role (не anon!)
GRANT EXECUTE ON FUNCTION public.execute_sql TO service_role;

-- ✅ Після виконання цього SQL, Claude зможе виконувати будь-які SQL команди через API!
