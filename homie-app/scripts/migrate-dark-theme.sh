#!/bin/bash

# Script to help migrate screens to dark theme support
# Usage: ./migrate-dark-theme.sh <file-path>

if [ -z "$1" ]; then
  echo "Usage: ./migrate-dark-theme.sh <file-path>"
  echo "Example: ./migrate-dark-theme.sh app/(modals)/create-task.tsx"
  exit 1
fi

FILE="$1"

if [ ! -f "$FILE" ]; then
  echo "Error: File not found: $FILE"
  exit 1
fi

echo "🎨 Migrating $FILE to dark theme support..."

# Backup original file
cp "$FILE" "${FILE}.backup"

# Step 1: Update imports - remove Colors from theme import
sed -i '' 's/import { Colors, /import { /g' "$FILE"

# If Colors is the only import from theme, keep it but add useThemeColors
if grep -q "import { Colors } from '@/theme'" "$FILE"; then
  sed -i '' "s|import { Colors } from '@/theme';|import { Typography, Spacing, BorderRadius } from '@/theme';\nimport { useThemeColors } from '@/contexts/ThemeContext';|g" "$FILE"
fi

# Step 2: Add useThemeColors hook after component declaration
# Find the line with "export default function" and add colors hook after it
if ! grep -q "const colors = useThemeColors()" "$FILE"; then
  # This is a basic pattern - may need manual adjustment
  echo "⚠️  You need to manually add: const colors = useThemeColors(); after component declaration"
  echo "⚠️  And add: const styles = createStyles(colors); after that"
fi

# Step 3: Convert StyleSheet.create to createStyles function
if grep -q "const styles = StyleSheet.create" "$FILE"; then
  echo "✅ Found styles definition, converting to createStyles function..."
  # This requires complex sed operations, better to do manually
  echo "⚠️  Manual step required: Convert 'const styles = StyleSheet.create({' to:"
  echo "    'const createStyles = (colors: ReturnType<typeof useThemeColors>) => StyleSheet.create({'"
fi

echo ""
echo "📋 Manual steps required:"
echo "1. Add 'const colors = useThemeColors();' in component"
echo "2. Add 'const styles = createStyles(colors);' after colors"
echo "3. Convert 'const styles = StyleSheet.create' to 'const createStyles = (colors: ...) => StyleSheet.create'"
echo "4. Replace all 'Colors.text' with 'colors.text' in styles"
echo "5. Replace all 'Colors.background' with 'colors.background' in styles"
echo "6. Replace 'Colors.white' with 'colors.card' where appropriate"
echo "7. Replace 'Colors.gray200/300' with 'colors.border'"
echo "8. Replace 'Colors.primary' with 'colors.primary'"
echo "9. Test the screen in both light and dark mode"
echo ""
echo "🔍 Color mappings:"
echo "  Colors.text → colors.text"
echo "  Colors.textSecondary → colors.textSecondary"
echo "  Colors.background → colors.background"
echo "  Colors.white → colors.card (for cards/surfaces)"
echo "  Colors.gray200/300 → colors.border"
echo "  Colors.primary → colors.primary"
echo "  Colors.error → colors.error"
echo "  Colors.success → colors.success"
echo "  Colors.accent → colors.accent"
echo ""
echo "📦 Backup saved to: ${FILE}.backup"
echo "✨ Done! Please review and test the changes."
