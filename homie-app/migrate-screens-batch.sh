#!/bin/bash

# Batch migrate screens to dark theme
FILES=(
  "app/(modals)/create-recurring-task.tsx"
  "app/(modals)/recurring-tasks.tsx"
  "app/(modals)/room-details.tsx"
  "app/(modals)/add-room.tsx"
  "app/(modals)/edit-profile.tsx"
  "app/(modals)/household-settings.tsx"
  "app/(modals)/subscription.tsx"
  "app/(modals)/rate-captain.tsx"
  "app/(modals)/notifications.tsx"
  "app/(modals)/add-note.tsx"
  "app/(auth)/login.tsx"
  "app/(auth)/signup.tsx"
)

for file in "${FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "⏭️  Skipping $file (not found)"
    continue
  fi

  # Check if already migrated
  if grep -q "useThemeColors" "$file"; then
    echo "✅ Already migrated: $file"
    continue
  fi

  echo "🔄 Migrating: $file"

  # 1. Replace Colors import with useThemeColors
  sed -i '' 's/import { Colors,/import {/g' "$file"
  sed -i '' 's/, Colors } from/} from/g' "$file"

  # 2. Add useThemeColors import after @/theme import
  sed -i '' '/from.*@\/theme/a\
import { useThemeColors } from '"'"'@/contexts/ThemeContext'"'"';
' "$file"

  # 3. Add colors hook in component (after router/params)
  sed -i '' '/const router = useRouter/a\
  const colors = useThemeColors();
' "$file"

  # 4. Replace StyleSheet.create with createStyles function
  sed -i '' 's/^const styles = StyleSheet\.create/const createStyles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create/g' "$file"

  # 5. Add styles instantiation before return (find first "return (" and add before)
  sed -i '' '/^  return (/i\
  const styles = createStyles(colors);\
\
' "$file"

  # 6. Replace all Colors. with colors.
  sed -i '' 's/Colors\./colors./g' "$file"

  # 7. Replace colors.white with colors.card
  sed -i '' 's/colors\.white/colors.card/g' "$file"

  # 8. Replace colors.gray300 with colors.border
  sed -i '' 's/colors\.gray300/colors.border/g' "$file"

  echo "✅ Migrated: $file"
done

echo ""
echo "🎉 Batch migration complete!"
