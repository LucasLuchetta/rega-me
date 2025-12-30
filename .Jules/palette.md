# Palette's Journal

## Critical Learnings

### 1. Component Extraction for Local State
Found that `renderItem` functions inside a main component cannot easily handle local state (like loading spinners for individual items) without causing performance issues or state conflicts.
**Solution:** Extracted `renderTaskItem` into a standalone `TaskItem` component. This allowed each task button to manage its own `loading` state during async operations independently.

### 2. Accessibility in Custom Components
The repo uses `TouchableOpacity` for buttons but often misses ARIA props.
**Pattern Identified:** Interactive elements like "OptionPill" or task cards need explicit `accessibilityRole="button"` (or "radio") and `accessibilityLabel` to be usable by screen readers. Native inference isn't enough for custom UI.

### 3. List Empty States
`FlatList` usage was inconsistent with empty states. Some lists had conditional rendering outside the list, while others just showed nothing.
**Improvement:** leveraging `ListEmptyComponent` ensures the UI remains structural and provides helpful guidance when data is missing (e.g., "Sua selva está vazia").

### 4. Safety in Destructive Actions
The "Delete" action was nested in an ActionSheet but lacked a "scary" confirmation step.
**Fix:** Implemented a double-confirmation pattern. First click reveals options, second click on "Delete" triggers a specific destructive Alert. This prevents accidental data loss.
