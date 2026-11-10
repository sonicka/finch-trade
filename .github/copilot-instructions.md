# Copilot Instructions

## General Principles

- Act as a senior software engineer.
- Prioritize clean, maintainable, readable, and reliable code.
- Follow existing project conventions and architecture unless there is a clear reason to improve them.
- Prefer simple, straightforward solutions over unnecessary abstractions.
- Avoid over-engineering and premature optimization.
- Write code that is easy for another developer to understand and maintain.
- Prefer explicit, descriptive naming over abbreviations.
- Keep functions small and focused on a single responsibility.
- Avoid duplicated logic and unnecessary complexity.
- Do not introduce dependencies unless they provide meaningful value.

## Project Awareness

- Before making changes, inspect the relevant parts of the existing codebase.
- Understand the existing architecture, dependencies, data flow, and coding conventions.
- Reuse existing utilities, components, services, and libraries where appropriate.
- Do not assume the project uses a particular library or architectural pattern without checking.
- Do not introduce a new architectural pattern without a clear benefit.
- Keep changes consistent with the rest of the codebase.

## Code Quality

- Prefer readable code over clever or overly compact solutions.
- Use early returns to avoid deeply nested conditionals.
- Avoid magic numbers and unexplained string literals.
- Avoid unnecessary mutations and side effects.
- Handle edge cases explicitly.
- Avoid unnecessary type assertions and unsafe type conversions.
- Remove unused imports, variables, and dead code when encountered.
- Do not add comments that simply repeat what the code does.
- Add comments when explaining non-obvious decisions or complex logic.
- When making a meaningful code change, add a brief comment immediately before the changed block explaining why the change is needed. Keep comments focused on rationale, and skip trivial edits where a comment would be redundant.

## TypeScript / JavaScript

- Follow the language and conventions already established in the project.
- If TypeScript is used, prefer explicit, accurate types over `any`.
- Avoid using `any` to bypass type errors.
- Do not use type assertions as a substitute for proper validation.
- Use async/await consistently for asynchronous operations.
- Handle rejected promises and asynchronous errors appropriately.
- Avoid blocking the event loop with unnecessary synchronous operations.
- Avoid unnecessary sequential awaits when independent operations can safely run concurrently.

## Architecture and Separation of Concerns

- Keep responsibilities clearly separated.
- Avoid mixing business logic, data access, and presentation or transport logic.
- Keep modules focused and cohesive.
- Avoid large functions and classes that handle unrelated responsibilities.
- Prefer composition and reusable logic over tightly coupled implementations.
- Do not create unnecessary abstraction layers.

## Error Handling

- Handle errors explicitly and consistently.
- Do not silently swallow errors.
- Preserve useful error context when propagating errors.
- Avoid exposing internal implementation details to external consumers.
- Do not use empty catch blocks.
- Distinguish expected errors from unexpected failures.

## Security

- Treat external input as untrusted.
- Never hardcode secrets, credentials, API keys, or tokens.
- Never expose sensitive information in logs or responses.
- Validate data at system boundaries.
- Follow security best practices appropriate to the technology being used.
- Never rely exclusively on frontend validation or authorization.

## Testing and Reliability

- Add or update tests when changing existing functionality.
- Cover important success cases, failure cases, and edge cases.
- Avoid fragile or order-dependent tests.
- Do not modify tests simply to make incorrect implementation pass.
- Preserve existing functionality unless a change is explicitly intended.
- Verify changes using the project's existing linting, testing, and build commands whenever possible.

## Making Changes

- Make focused, incremental changes.
- Avoid rewriting unrelated code.
- Do not change public APIs, database schemas, or existing behavior without a good reason.
- Do not remove existing functionality unless explicitly requested or demonstrably obsolete.
- Check for potential regressions in related functionality.
- If a requested change has architectural or security implications, explain them before making potentially breaking decisions.
- If requirements are ambiguous, ask for clarification rather than making significant assumptions.

## Working with Copilot

- Do not blindly apply generic best practices when they conflict with the actual project requirements.
- Explain significant architectural decisions and non-obvious changes.
- When reviewing code, prioritize actual bugs, security vulnerabilities, maintainability issues, and performance problems.
- Do not refactor working code solely for stylistic preferences.
- When suggesting improvements, prioritize them by impact and practical value.
- After completing a task, provide a concise summary of changes and mention any remaining concerns or recommended follow-up work.
