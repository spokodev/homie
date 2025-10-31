#!/bin/bash

for table in households members tasks rooms room_notes cleaning_captains captain_ratings messages badges member_badges; do
  echo "=== $table ==="
  curl -X POST 'https://ojmmvaoztddrgvthcjit.supabase.co/rest/v1/rpc/get_rls_policies' \
    -H "apikey: sb_secret_WyIm-vVVodZ0WV_Y7ofQAw_7Au0tmvA" \
    -H "Authorization: Bearer sb_secret_WyIm-vVVodZ0WV_Y7ofQAw_7Au0tmvA" \
    -H "Content-Type: application/json" \
    -d "{\"table_name_param\": \"$table\"}" 2>/dev/null
  echo ""
  echo ""
done
