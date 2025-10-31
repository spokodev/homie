#!/bin/bash

# Fix recurring-tasks.tsx
echo "Fixing recurring-tasks.tsx..."
sed -i '' 's/import { showToast } from/import { useToast } from/' app/\(modals\)/recurring-tasks.tsx

# Fix room-details.tsx - remove NOTE_COLORS
echo "Fixing room-details.tsx..."
sed -i '' '/^const NOTE_COLORS/d' app/\(modals\)/room-details.tsx

# Fix settings.tsx - remove useState import
echo "Fixing settings.tsx..."
sed -i '' 's/import React, { useState }/import React/' app/\(modals\)/settings.tsx

# Fix _layout.tsx - remove Typography from import
echo "Fixing _layout.tsx..."
sed -i '' 's/Colors, Typography, Spacing/Colors, Spacing/' app/\(tabs\)/_layout.tsx

# Fix index.tsx - remove Image import
echo "Fixing index.tsx..."
sed -i '' '/^  Image,$/d' app/index.tsx

echo "Import fixes applied!"
