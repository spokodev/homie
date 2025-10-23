# Contributing to Homie

First off, thank you for considering contributing to Homie! 🎉

It's people like you that make Homie a great tool for families everywhere.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)
- [Testing](#testing)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

**Our Standards:**
- ✅ Be respectful and inclusive
- ✅ Welcome newcomers warmly
- ✅ Give constructive feedback
- ✅ Focus on what's best for the community
- ✅ Show empathy towards others

**Unacceptable Behavior:**
- ❌ Harassment or discriminatory language
- ❌ Trolling or insulting comments
- ❌ Personal or political attacks
- ❌ Publishing others' private information
- ❌ Any conduct that could be considered inappropriate

---

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

**Bug Report Template:**
```markdown
**Description:**
A clear description of the bug

**Steps to Reproduce:**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior:**
What you expected to happen

**Actual Behavior:**
What actually happened

**Screenshots:**
If applicable, add screenshots

**Environment:**
- Device: [e.g. iPhone 14 Pro]
- OS: [e.g. iOS 17.2]
- App Version: [e.g. 1.0.0]

**Additional Context:**
Any other context about the problem
```

### Suggesting Features

Feature suggestions are welcome! Please provide:

**Feature Request Template:**
```markdown
**Problem:**
What problem does this solve?

**Proposed Solution:**
Describe your solution

**Alternatives Considered:**
What other solutions did you consider?

**Additional Context:**
Any mockups, examples, or references
```

### Code Contributions

1. **Find an issue to work on** or create a new one
2. **Comment on the issue** to let others know you're working on it
3. **Fork the repository** and create your branch
4. **Make your changes** following our guidelines
5. **Test thoroughly**
6. **Submit a pull request**

---

## 🛠️ Development Setup

### Prerequisites

```bash
# Required
- Node.js 18+ 
- npm or yarn
- Git
- Xcode (for iOS development)
- Expo CLI

# Recommended
- Cursor IDE
- React Native Debugger
```

### Initial Setup

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/homie.git
cd homie

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Add your Supabase credentials to .env.local

# 5. Run database migrations
npm run db:migrate

# 6. Start development server
npx expo start
```

### Development Workflow

```bash
# Create a new branch
git checkout -b feature/your-feature-name

# Make changes and test
npx expo start

# Run tests
npm test

# Lint your code
npm run lint

# Type check
npm run type-check

# Commit your changes
git add .
git commit -m "feat(scope): your commit message"

# Push to your fork
git push origin feature/your-feature-name
```

---

## 🔄 Pull Request Process

### Before Submitting

- ✅ Code follows our style guidelines
- ✅ TypeScript compiles without errors
- ✅ All tests pass
- ✅ New tests added for new features
- ✅ Documentation updated if needed
- ✅ Commit messages follow convention
- ✅ No console.logs or commented code
- ✅ Tested on iOS simulator
- ✅ Screenshots included for UI changes

### PR Template

When you create a PR, please fill out this template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issue
Closes #(issue number)

## Screenshots (if applicable)
Add screenshots for UI changes

## Testing
How did you test this?

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] Tests pass locally
- [ ] No new warnings
```

### Review Process

1. **Automated checks** run (tests, linting, type checking)
2. **Code review** by maintainer
3. **Changes requested** if needed
4. **Approval** once ready
5. **Merge** to develop branch

**Review Timeline:**
- We aim to review PRs within 48 hours
- Small PRs (<200 lines) reviewed faster
- Large PRs may take longer

---

## 🎨 Style Guidelines

### TypeScript

```typescript
// ✅ DO: Use interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ DO: Use type for unions/intersections
type Status = 'pending' | 'active' | 'completed';

// ✅ DO: Export types
export type { User, Status };

// ❌ DON'T: Use any
const data: any = {}; // Bad

// ✅ DO: Use unknown if type is truly unknown
const data: unknown = {}; // Good
```

### React Components

```tsx
// ✅ DO: Use functional components
export const MyComponent: React.FC<Props> = ({ title }) => {
  return <View><Text>{title}</Text></View>;
};

// ✅ DO: Memoize expensive components
export const ExpensiveComponent = React.memo<Props>(({ data }) => {
  // Complex rendering logic
});

// ✅ DO: Use StyleSheet.create
const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
});

// ❌ DON'T: Use inline styles
<View style={{ padding: 16 }}> // Bad

// ✅ DO: Import from theme
import { Colors, Spacing } from '@/theme';
```

### File Organization

```typescript
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. React Native imports
import { View, Text, StyleSheet } from 'react-native';

// 3. Third-party imports
import { useQuery } from '@tanstack/react-query';

// 4. Local imports
import { Button } from '@/components';
import { Colors, Typography } from '@/theme';
import { useAuth } from '@/hooks';

// 5. Types
import type { User } from '@/types';
```

### Naming Conventions

```typescript
// Components: PascalCase
Button.tsx
TaskCard.tsx
UserProfile.tsx

// Hooks: camelCase with 'use'
useAuth.ts
useHousehold.ts
useTasks.ts

// Utils: camelCase
formatDate.ts
validateEmail.ts
calculatePoints.ts

// Constants: SCREAMING_SNAKE_CASE
API_ENDPOINTS.ts
DEFAULT_CONFIG.ts

// Types: PascalCase
User.ts
Task.ts
```

---

## 📝 Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, no logic change)
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Adding or updating tests
- `chore` - Maintenance (deps, config, etc)

### Scopes

- `auth` - Authentication
- `tasks` - Task management
- `ratings` - Rating system
- `chat` - Chat features
- `rooms` - Rooms & notes
- `gamification` - Points, badges, levels
- `ui` - UI components
- `db` - Database changes

### Examples

```bash
# Feature
feat(ratings): add private notes to weekly ratings

Users can now add private notes that only the rated
person can see, separate from public feedback.

Closes #42

# Bug Fix
fix(tasks): prevent duplicate tasks on double-tap

Added debounce to task creation button

Fixes #156

# Refactor
refactor(theme): consolidate color definitions

Moved all colors to central theme file and removed
hardcoded values from components

# Documentation
docs(readme): add contribution guidelines

# Chore
chore(deps): update expo to 50.0.0
```

### Best Practices

- ✅ Use imperative mood ("add feature" not "added feature")
- ✅ First line max 72 characters
- ✅ Body wraps at 72 characters
- ✅ Reference issues in footer
- ✅ Explain *why* not *what* in body
- ❌ Don't end subject with period
- ❌ Don't use vague messages ("fix stuff", "updates")

---

## 🧪 Testing

### Running Tests

```bash
# All tests
npm test

# Specific test file
npm test -- Button.test.tsx

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Writing Tests

```typescript
// Component test example
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button title="Test" onPress={() => {}} />);
    expect(getByText('Test')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Test" onPress={onPress} />);
    
    fireEvent.press(getByText('Test'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Test" onPress={onPress} disabled />
    );
    
    fireEvent.press(getByText('Test'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

### Test Coverage

We aim for:
- **60%+ overall coverage**
- **80%+ for business logic**
- **100% for critical paths** (auth, payments)

---

## 📚 Documentation

### Code Comments

```typescript
// ✅ DO: Comment complex logic
// Calculate points with streak bonus
// Formula: base_points * (1 + (streak_days * 0.1))
const totalPoints = basePoints * (1 + streakDays * 0.1);

// ✅ DO: Explain non-obvious decisions
// Use setTimeout instead of setInterval to prevent
// overlapping requests if API is slow
setTimeout(fetchData, POLLING_INTERVAL);

// ❌ DON'T: State the obvious
// Set the name to the user's name
setName(user.name);
```

### JSDoc for Complex Functions

```typescript
/**
 * Calculates the total points earned for task completion
 * including all applicable bonuses.
 * 
 * @param task - The completed task
 * @param duration - Actual time taken in minutes
 * @param estimate - Estimated time in minutes
 * @returns Total points including bonuses
 * 
 * @example
 * calculateTaskPoints(task, 25, 30) // Returns base + speed bonus
 */
function calculateTaskPoints(
  task: Task,
  duration: number,
  estimate: number
): number {
  // Implementation
}
```

---

## 🎯 Issue Labels

We use labels to organize issues:

- `bug` - Something isn't working
- `feature` - New feature request
- `enhancement` - Improvement to existing feature
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority: high` - Should be fixed ASAP
- `priority: low` - Nice to have
- `wontfix` - Not going to fix this

---

## 🏆 Recognition

Contributors will be:
- Added to README.md
- Mentioned in release notes
- Invited to private beta programs
- Given special Discord role (once we have one!)

---

## ❓ Questions?

- 💬 **Ask in GitHub Discussions**
- 📧 **Email:** dev@homie.app
- 🐦 **Twitter:** [@homieapp](https://twitter.com/homieapp)

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for making Homie better! 🏠✨**

