---
name: react-typescript-best-practices
description: Apply best practices when developing, reviewing, refactoring, or debugging React and TypeScript frontends. Covers component architecture, state management, hooks, data fetching, forms, validation, accessibility, performance, TypeScript, styling, testing, error handling, security, and maintainability.
---

# React + TypeScript Best Practices

## 1. Core Engineering Principles

Act as a senior React and TypeScript frontend engineer.

Prioritize:

1. Correctness
2. Maintainability
3. Readability
4. Accessibility
5. Type safety
6. Performance

General rules:

- Prefer simple, readable solutions over clever or unnecessarily complex implementations.
- Follow existing project conventions and architecture where reasonable.
- Inspect the existing codebase before introducing new patterns.
- Reuse existing components, hooks, utilities, and libraries where appropriate.
- Avoid unnecessary dependencies.
- Avoid premature optimization.
- Keep components focused on one responsibility.
- Keep business logic out of presentation components when it can be separated cleanly.
- Avoid duplicated logic.
- Prefer explicit, descriptive naming.
- Do not refactor working code solely for stylistic preferences.

## 2. Project Awareness

Before making changes:

- Inspect the project structure.
- Identify the React version.
- Identify the TypeScript configuration.
- Identify the routing solution.
- Identify the state-management solution.
- Identify the data-fetching/API solution.
- Identify the styling solution.
- Identify the form and validation libraries.
- Identify the testing framework.
- Identify the existing component and feature organization.
- Follow established project conventions.

Do not introduce a new library when the project already has an appropriate solution.

Do not replace an existing architectural pattern merely because another pattern is currently more popular.

## 3. Component Architecture

Prefer components with a single clear responsibility.

Typical organization may look like:

```text
src/
├── components/
│   ├── Button/
│   ├── Modal/
│   └── Form/
├── features/
│   ├── users/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── types/
│   │   └── utils/
│   └── products/
├── hooks/
├── pages/
├── layouts/
├── services/
├── api/
├── utils/
├── types/
├── constants/
└── app/
```

This is an example, not a mandatory structure.

Rules:

- Keep components reasonably small.
- Extract components when they have a meaningful independent responsibility.
- Do not create a component for every few lines of JSX without a reason.
- Avoid giant components containing unrelated UI, state, data fetching, and business logic.
- Keep reusable components generic enough to reuse but not so abstract that their API becomes difficult to understand.
- Prefer composition over excessive prop configuration.
- Keep feature-specific code close to the feature when appropriate.
- Avoid circular dependencies.

## 4. React Components

Prefer functional components and hooks.

Example:

```tsx
type UserCardProps = {
  user: User;
  onSelect: (user: User) => void;
};

export function UserCard({ user, onSelect }: UserCardProps) {
  return <button onClick={() => onSelect(user)}>{user.name}</button>;
}
```

Rules:

- Define clear prop types.
- Avoid `React.FC` unless the project convention specifically uses it.
- Avoid unnecessary prop drilling when a better existing state/context solution is appropriate.
- Do not pass entire objects when only a small subset is needed unless it improves clarity.
- Avoid components with excessive numbers of props.
- Do not put unrelated business logic into JSX.
- Prefer derived values over duplicated state.
- Keep rendering predictable and side-effect free.

## 5. TypeScript

Use TypeScript as a tool for correctness, not merely as documentation.

Rules:

- Avoid `any`.
- Prefer `unknown` when a value genuinely has an unknown type.
- Avoid unnecessary type assertions.
- Do not use `as` to silence legitimate type errors.
- Define meaningful types for component props.
- Type API responses and important domain objects.
- Prefer discriminated unions for state with multiple possible states.
- Use type narrowing instead of unsafe assertions.
- Keep types close to the domain they describe.
- Avoid duplicating the same type definition in multiple places.
- Reuse shared types where appropriate.
- Keep runtime validation separate from TypeScript's compile-time checks.
- Do not assume API data is valid merely because it has a TypeScript type.

Prefer:

```tsx
type Status =
  | { type: 'loading' }
  | { type: 'success'; data: User[] }
  | { type: 'error'; message: string };
```

over loosely related boolean flags such as:

```tsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState(false);
const [hasData, setHasData] = useState(false);
```

when the state represents mutually exclusive states.

## 6. State Management

Use the smallest appropriate state scope.

Prefer this hierarchy:

1. Local component state when only one component needs the state.
2. Shared state/context when several related components need it.
3. Existing global state management when the state genuinely needs application-wide access.
4. Server-state/data-fetching libraries for remote API data.

Rules:

- Do not put every piece of state into global state.
- Do not store derived values as independent state when they can be calculated.
- Avoid duplicated sources of truth.
- Keep server state separate from UI state.
- Do not use global state simply to avoid passing one or two props.
- Avoid unnecessary Context usage for frequently changing state.
- Follow the project's existing state-management conventions.

## 7. Server State and Data Fetching

Treat server data differently from local UI state.

If the project uses a library such as TanStack Query:

- Use it consistently for server state.
- Avoid duplicating query state into Redux/Context/local state without a reason.
- Use query keys consistently.
- Configure appropriate caching and stale times.
- Invalidate or update relevant queries after mutations.
- Handle loading, error, empty, and success states explicitly.
- Avoid unnecessary duplicate requests.
- Avoid manually recreating functionality already provided by the data-fetching library.

If the project does not use a data-fetching library:

- Follow the existing API abstraction.
- Keep API calls outside presentational components where appropriate.
- Centralize common request behavior such as authentication and error handling.

## 8. API Layer

Keep HTTP concerns separate from UI components.

Prefer:

```text
Component
    ↓
Hook
    ↓
API/service
    ↓
Backend
```

rather than putting raw `fetch()` or Axios calls throughout components.

Rules:

- Centralize API configuration.
- Reuse the existing API client.
- Handle authentication consistently.
- Handle API errors consistently.
- Type API request and response data.
- Do not expose secrets intended only for the backend.
- Do not duplicate endpoint URLs throughout components.
- Do not silently ignore failed requests.
- Normalize API errors where appropriate.

## 9. Hooks

Rules:

- Follow the Rules of Hooks.
- Do not call hooks conditionally.
- Do not call hooks inside loops or nested functions.
- Keep custom hooks focused on a coherent responsibility.
- Extract repeated stateful logic into custom hooks.
- Do not create a custom hook merely to wrap one trivial hook call.
- Avoid custom hooks that return excessively large or unrelated APIs.
- Keep side effects inside appropriate `useEffect` or specialized hooks.

### useEffect

Treat `useEffect` as a tool for synchronizing React with external systems, not as a general-purpose place for application logic.

Avoid:

```tsx
useEffect(() => {
    setFilteredUsers(users.filter(...));
}, [users]);
```

when the value can simply be derived during rendering:

```tsx
const filteredUsers = users.filter(...);
```

Rules:

- Do not use effects for values that can be calculated during render.
- Keep effect dependencies correct.
- Do not suppress dependency warnings without a strong reason.
- Clean up subscriptions, timers, event listeners, and other resources.
- Prevent race conditions in asynchronous effects.
- Avoid effects that trigger unnecessary render → effect → state update cycles.
- Consider whether an event handler is more appropriate than an effect for event-driven logic.

## 10. Memoization and Performance

Do not use `useMemo`, `useCallback`, or `React.memo` automatically.

Use memoization when:

- There is an actual expensive calculation.
- A stable reference prevents meaningful unnecessary work.
- A memoized component has a demonstrable rendering cost.
- The project's React architecture benefits from it.

Avoid:

```tsx
const value = useMemo(() => firstName + lastName, [firstName, lastName]);
```

for trivial calculations.

Rules:

- Optimize based on actual rendering behavior.
- Avoid unnecessary memoization that makes code harder to understand.
- Avoid premature optimization.
- Use stable keys for lists.
- Never use array indexes as keys when list items have stable identifiers and can be reordered/inserted/deleted.
- Avoid rendering unnecessarily large collections without virtualization or pagination where appropriate.
- Avoid expensive calculations during every render.
- Lazy-load genuinely large or rarely used parts of the application when appropriate.

## 11. Lists and Keys

Use stable, unique keys.

Prefer:

```tsx
{
  users.map((user) => <UserCard key={user.id} user={user} />);
}
```

Avoid:

```tsx
{
  users.map((user, index) => <UserCard key={index} user={user} />);
}
```

unless the list is truly static and never changes order.

Do not generate random keys during rendering.

## 12. Forms and Validation

Rules:

- Use the project's existing form library when one exists.
- Validate user input at the UI boundary.
- Keep validation rules consistent with backend expectations.
- Do not rely on frontend validation for security.
- Show useful validation messages.
- Associate labels correctly with inputs.
- Handle loading/submission states.
- Prevent duplicate submissions where appropriate.
- Preserve user input when validation fails.
- Avoid storing unnecessary form fields in global state.

If using a schema library such as Zod:

- Reuse schemas where appropriate.
- Keep schema definitions close to the relevant domain.
- Avoid duplicating the same validation rules manually.

## 13. Accessibility

Accessibility is a requirement, not an optional enhancement.

Rules:

- Prefer semantic HTML.
- Use `<button>` for actions.
- Use `<a>` for navigation.
- Use proper headings.
- Associate labels with form controls.
- Provide meaningful alt text for informative images.
- Use empty alt text for decorative images.
- Ensure keyboard navigation works.
- Preserve visible focus states.
- Do not rely solely on color to communicate information.
- Use ARIA only when semantic HTML is insufficient.
- Do not use ARIA to compensate for incorrect HTML semantics.
- Ensure dialogs, menus, dropdowns, and other interactive components are keyboard accessible.
- Manage focus appropriately for modal/dialog interactions.
- Ensure dynamic content changes are accessible where appropriate.

Avoid:

```tsx
<div onClick={handleClick}>Save</div>
```

Prefer:

```tsx
<button type="button" onClick={handleClick}>
  Save
</button>
```

## 14. Styling

Follow the project's existing styling system.

Whether the project uses:

- CSS modules
- Tailwind
- MUI
- styled-components
- Emotion
- plain CSS
- another established system

do not introduce another styling approach unnecessarily.

Rules:

- Reuse existing design-system components.
- Avoid duplicated styling patterns.
- Avoid excessive inline styles when the project uses a reusable styling system.
- Keep responsive behavior in mind.
- Avoid arbitrary magic values when an existing design token is available.
- Prefer design tokens/theme values over repeated raw colors, spacing, and typography values.
- Do not hardcode colors or spacing if an existing theme/token system provides the appropriate value.
- Keep component styling predictable and maintainable.

## 15. Routing

Follow the project's existing routing library and conventions.

Rules:

- Keep route definitions centralized or feature-organized according to the existing architecture.
- Protect authenticated routes appropriately.
- Do not rely on frontend route protection for backend authorization.
- Handle unknown routes.
- Keep route components focused on page composition.
- Avoid putting large amounts of business logic directly into route configuration.
- Use route parameters and query parameters consistently.
- Handle loading states for lazy-loaded routes.

## 16. Error and Loading States

Every asynchronous UI operation should consider:

- Loading.
- Success.
- Empty state.
- Error state.

Do not leave users with a blank screen while data is loading.

Rules:

- Show meaningful loading indicators where appropriate.
- Provide useful error messages.
- Provide retry options when retrying makes sense.
- Handle empty collections explicitly.
- Avoid displaying raw backend errors directly to users.
- Log useful technical errors separately from user-facing messages.
- Prevent error states from causing infinite retry loops.
- Use an error boundary for unexpected React rendering errors where appropriate.

## 17. Security

Frontend code is not a security boundary.

Rules:

- Never put private secrets in frontend source code.
- Assume anything shipped to the browser can be inspected.
- Never trust client-side authorization checks.
- Never rely on hidden UI elements to protect privileged functionality.
- Validate authorization on the backend.
- Avoid storing sensitive tokens in insecure browser storage when a safer authentication architecture is available.
- Protect against XSS.
- Never render unsanitized user-controlled HTML.
- Avoid `dangerouslySetInnerHTML` unless genuinely necessary and the content is properly sanitized.
- Do not construct executable code from user input.
- Be careful with URLs supplied by users.
- Do not expose internal backend configuration to the client.
- Treat all API responses as untrusted external data.

## 18. Environment Variables

Follow the project's build tool conventions.

Examples include:

- Vite.
- Create React App.
- Next.js.
- Custom Webpack/Vite configuration.

Rules:

- Only expose variables intentionally intended for the browser.
- Never place backend secrets in frontend environment variables.
- Do not assume environment variables are secret merely because they are stored in `.env`.
- Keep environment configuration consistent across environments.
- Validate required public configuration where appropriate.

## 19. Internationalization

If the project supports multiple languages:

- Use the existing i18n solution.
- Do not hardcode user-facing strings when they should be translated.
- Keep translation keys consistent.
- Avoid constructing sentences from disconnected translated fragments.
- Handle pluralization using the i18n system.
- Consider date, time, number, and currency localization.

Do not introduce an i18n library into a project that does not require localization.

## 20. Date, Time, and Number Handling

Be explicit about date and time semantics.

Rules:

- Do not assume browser local time equals server time.
- Be explicit about timezone requirements.
- Use established date/time utilities already present in the project.
- Avoid manually parsing complex date strings.
- Avoid inconsistent date formatting across the application.
- Localize dates and numbers when appropriate.
- Do not use ambiguous date formats for user-facing values.

## 21. State Synchronization

Avoid multiple competing sources of truth.

For example, if data comes from the server:

```text
Server
  ↓
Query/cache
  ↓
UI
```

Do not unnecessarily duplicate it:

```text
Server
  ↓
Query
  ↓
Redux
  ↓
Context
  ↓
Local state
  ↓
UI
```

unless there is a concrete reason.

Rules:

- Keep canonical data in one appropriate place.
- Derive values instead of duplicating them.
- Synchronize state explicitly when duplication is genuinely necessary.
- Avoid useEffect-based synchronization between states when the relationship can be modeled directly.

## 22. React Context

Use Context for genuinely shared concerns such as:

- Theme.
- Authentication state.
- Localization.
- Stable application-wide configuration.

Avoid using Context as a replacement for every form of state management.

Rules:

- Keep context values focused.
- Avoid putting frequently changing large objects into a global context unnecessarily.
- Memoize context values when appropriate and justified.
- Split contexts when unrelated state changes would otherwise trigger unnecessary renders.

## 23. Testing

Test behavior rather than implementation details.

Prioritize:

- User interactions.
- Important business behavior.
- Form validation.
- API success and failure states.
- Authentication/authorization UI behavior.
- Important edge cases.
- Accessibility-critical behavior.

Use the existing testing stack.

Common tools include:

- Vitest.
- Jest.
- React Testing Library.
- Playwright.
- Cypress.

Rules:

- Prefer React Testing Library's user-centric approach.
- Avoid testing internal component state directly.
- Avoid excessive mocking.
- Keep tests deterministic.
- Test meaningful behavior rather than implementation details.
- Test error and loading states.
- Test important keyboard interactions where relevant.

Example:

Prefer:

```tsx
expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
```

over testing internal state variables.

## 24. Error Boundaries

Use React error boundaries for unexpected rendering failures where appropriate.

Rules:

- Do not use error boundaries as a substitute for normal async error handling.
- Provide a useful fallback UI.
- Log unexpected rendering errors.
- Keep error boundaries at sensible application or feature boundaries.
- Do not hide errors silently.

## 25. Performance

Prioritize meaningful performance improvements.

Check for:

- Unnecessary re-renders.
- Excessive network requests.
- Large bundles.
- Unoptimized images.
- Large lists.
- Expensive calculations.
- Unnecessary state updates.
- Excessive context updates.

Use appropriate techniques when justified:

- Code splitting.
- Lazy loading.
- Memoization.
- Virtualized lists.
- Image optimization.
- Query caching.
- Pagination.
- Debouncing/throttling.

Do not add these mechanisms automatically.

## 26. Browser APIs and Event Listeners

Rules:

- Clean up event listeners registered by components.
- Clean up timers and intervals.
- Cancel or ignore stale asynchronous operations where appropriate.
- Avoid attaching duplicate global listeners.
- Avoid unnecessary direct DOM manipulation.
- Prefer React state and refs over manually manipulating the DOM.

Example cleanup:

```tsx
useEffect(() => {
  const handleResize = () => {
    // ...
  };

  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

## 27. Avoid Common React Anti-Patterns

Avoid:

- Using array indexes as keys for dynamic lists.
- Storing derived values in state unnecessarily.
- Using `useEffect` for simple calculations.
- Using `useEffect` to synchronize state unnecessarily.
- Excessive prop drilling when a better established solution exists.
- Global state for local concerns.
- Excessive Context usage.
- Unnecessary `useMemo`/`useCallback`.
- Giant components.
- Components that perform unrelated responsibilities.
- Raw API calls scattered throughout components.
- `any` used to bypass TypeScript.
- Excessive type assertions.
- `dangerouslySetInnerHTML` without a strong reason and proper sanitization.
- Random keys.
- Index keys for reorderable lists.
- Business logic embedded directly in JSX.
- Copy-pasted API/state logic.

## 28. Constants and Magic Values

Use named constants for meaningful values whose purpose is not immediately obvious.

Avoid:

```tsx
if (items.length > 20) {
  // ...
}
```

when `20` represents a meaningful business or UI limit.

Prefer:

```tsx
const MAX_VISIBLE_ITEMS = 20;

if (items.length > MAX_VISIBLE_ITEMS) {
  // ...
}
```

However, do not extract every simple numeric value into a constant.

This is generally unnecessary:

```tsx
const TWO = 2;
const HUNDRED = 100;
```

The purpose is to communicate meaning, not eliminate numbers.

## 29. Dependencies

Before adding a dependency:

1. Check whether the project already provides the functionality.
2. Check whether the functionality can reasonably be implemented without a dependency.
3. Consider package maintenance and security.
4. Consider bundle size.
5. Consider compatibility with the existing stack.
6. Consider whether the dependency will be used enough to justify itself.

Do not install multiple libraries solving the same problem.

Do not replace established project dependencies without a concrete reason.

## 30. Refactoring Existing Code

Before refactoring:

1. Understand the current behavior.
2. Identify the actual problem.
3. Check existing tests.
4. Identify consumers of the code.
5. Determine whether the API/component contract is public or widely used.

During refactoring:

- Preserve behavior unless intentionally changing it.
- Make incremental changes.
- Avoid mixing unrelated refactors with feature work.
- Keep the diff focused.
- Do not rewrite an entire component merely to improve formatting.
- Do not introduce a new architecture without justification.
- Update tests alongside behavior changes.

## 31. Working with Existing UI Libraries

If the project uses a component library such as MUI:

- Prefer existing library components over custom implementations.
- Follow the project's established theme.
- Reuse existing variants and design tokens.
- Avoid recreating components that already exist in the library.
- Keep custom wrappers focused and reusable.
- Do not introduce another UI library without a strong reason.

If an existing component does not perfectly fit, first consider composition or configuration before replacing it.

## 32. Working with Existing State/Data Libraries

If the project uses libraries such as:

- TanStack Query
- Redux
- Redux Toolkit
- Zustand
- React Hook Form
- Zod

follow their established patterns consistently.

Do not implement functionality manually when the project already has a well-established library that provides it.

Do not introduce competing state-management or data-fetching solutions without a strong architectural reason.

## 33. Accessibility and UX Quality

When implementing UI, consider:

- Keyboard navigation.
- Focus management.
- Screen-reader semantics.
- Disabled/loading states.
- Error messaging.
- Empty states.
- Responsive layouts.
- Touch targets.
- Text overflow.
- Long content.
- Slow network conditions.
- Failed requests.
- Permission restrictions.

Do not optimize only for the ideal success path.

## 34. Copilot Workflow

Before modifying frontend code:

1. Inspect the relevant files.
2. Identify the project's React and TypeScript versions.
3. Identify existing architecture and conventions.
4. Identify state-management and data-fetching patterns.
5. Identify styling and component-library conventions.
6. Identify testing conventions.
7. Understand how the affected component is used.
8. Identify existing reusable components/hooks/utilities.

Then:

1. Identify the smallest appropriate change.
2. Reuse existing patterns.
3. Keep types accurate.
4. Consider accessibility.
5. Consider loading/error/empty states.
6. Consider responsive behavior where relevant.
7. Avoid unrelated refactoring.

After making changes:

1. Run relevant tests.
2. Run TypeScript/type checking.
3. Run linting.
4. Check for unused imports and variables.
5. Check component behavior.
6. Check loading/error/empty states.
7. Check accessibility for interactive elements.
8. Check for unnecessary renders or requests where relevant.
9. Summarize the changes.
10. Mention remaining concerns or follow-up work.

## 35. Important Decision-Making Rule

Best practices are guidelines, not reasons to introduce unnecessary complexity.

Before implementing a recommendation, ask:

- Does this solve an actual problem?
- Does this improve correctness, maintainability, accessibility, or performance?
- Is there already an established solution in the project?
- Does this introduce unnecessary dependencies?
- Could this change break existing behavior?
- Is the added complexity justified?

The objective is not to make the frontend follow every theoretical React best practice.

The objective is to build a **type-safe, accessible, maintainable, predictable, and performant React application**.
