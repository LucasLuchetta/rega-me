# Palette's Journal

## Critical Learnings

### 1. Typescript in DevDependencies but Not Installed
The repo listed `typescript` in `devDependencies`, but it wasn't installed in `node_modules`. This required a manual `pnpm install` before I could run type checks. This is a common pattern in CI/CD environments where deps might be cached or installed differently, but for a dev session, it's a blocker.

### 2. Missing Imports in React Native
When adding `ActivityIndicator` or other native components, it's easy to forget the import from `react-native`, especially when focusing on logic. A quick `tsc` run catches this.

### 3. Accessible Touchables
React Native's `TouchableOpacity` needs explicit `accessibilityLabel` when it contains only icons. The default behavior doesn't infer a label from the icon name. Using `accessibilityRole="button"` is also crucial for screen readers to announce it as an interactive element.

### 4. Feedback loops
Adding `activeOpacity` provides immediate tactile feedback which makes the app feel more responsive without changing the design. It's a high-impact, low-effort polish.

### 5. Pre-existing Typescript Errors
The codebase has pre-existing TS errors (`Orakul`, `Profile`) that are unrelated to my changes. In a real-world scenario, I would flag these, but for this "Blitz", I ignored them to focus on my specific deliverables, ensuring I didn't add *new* errors.

### 6. Navigation Event Listeners
When implementing safety checks (like `beforeRemove`), React Navigation's `addListener` is powerful but requires careful handling of the `data.action` to properly discard changes or resume navigation. It's a specific API that differs from web's `beforeunload`.

### 7. Accessibility State for Interactive Elements
Simply adding `accessibilityLabel` isn't enough for stateful elements like tabs or toggle buttons. `accessibilityState={{ selected: boolean }}` or `{{ busy: boolean }}` provides critical context to screen reader users that static text cannot convey.
