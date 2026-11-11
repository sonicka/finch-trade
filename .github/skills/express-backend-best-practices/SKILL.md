---
name: express-backend-best-practices
description: Apply best practices when developing, reviewing, refactoring, or debugging Node.js and Express backends. Covers architecture, API design, controllers, services, middleware, validation, error handling, security, authentication, database access, performance, logging, configuration, TypeScript, and testing.
---

# Express Backend Best Practices

## 1. Core Engineering Principles

Act as a senior Node.js/Express backend engineer.

Prioritize the following:

1. Correctness
2. Security
3. Maintainability
4. Readability
5. Reliability
6. Performance

General rules:

- Prefer simple, readable solutions over clever or unnecessarily complex implementations.
- Follow existing project conventions and architecture where reasonable.
- Do not introduce abstractions, dependencies, or architectural layers without a clear benefit.
- Avoid premature optimization.
- Keep functions small and focused on one responsibility.
- Avoid duplicated business logic.
- Prefer explicit and descriptive naming.
- Use early returns instead of deeply nested conditionals.
- Avoid unnecessary mutations and side effects.
- Keep responsibilities clearly separated.
- Do not refactor working code solely for stylistic preferences.

## 2. Project Architecture

Use separation of concerns to keep the application maintainable.

A typical Express architecture can look like:

```text
src/
├── config/
│   ├── env.js
│   └── database.js
├── routes/
│   ├── index.js
│   └── user.routes.js
├── controllers/
│   └── user.controller.js
├── services/
│   └── user.service.js
├── repositories/
│   └── user.repository.js
├── middleware/
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   └── validation.middleware.js
├── validators/
│   └── user.validator.js
├── utils/
├── constants/
├── app.js
└── server.js
```

This is an example, not a mandatory structure.

Responsibilities:

- **Routes:** Define endpoints and attach appropriate middleware.
- **Controllers:** Handle HTTP requests and responses.
- **Services:** Contain business logic and coordinate operations.
- **Repositories:** Encapsulate database access when a separate data-access layer is useful.
- **Middleware:** Handle cross-cutting concerns such as authentication, validation, and logging.
- **Validators:** Define request validation schemas.
- **Config:** Centralize application configuration.
- **Utils:** Contain genuinely reusable helper functions.
- **Constants:** Store meaningful shared constants.

Rules:

- Keep route definitions simple.
- Do not put business logic directly inside routes.
- Keep controllers thin.
- Do not put HTTP-specific response handling inside business services.
- Avoid database queries directly inside controllers when a service/data-access separation improves maintainability.
- Do not introduce a repository layer automatically if the existing application does not need one.
- Avoid circular dependencies between modules.
- Keep dependencies flowing in a predictable direction.

## 3. Routes and HTTP API Design

Follow RESTful API conventions where appropriate.

Use HTTP methods correctly:

- `GET`: Retrieve resources.
- `POST`: Create resources or perform actions.
- `PUT`: Replace resources.
- `PATCH`: Partially update resources.
- `DELETE`: Delete resources.

Rules:

- Use consistent endpoint naming.
- Prefer plural resource names, e.g. `/users`, `/products`.
- Use route parameters for resource identifiers.
- Use query parameters for filtering, sorting, and pagination.
- Use request bodies for resource creation and updates.
- Do not use GET requests for operations that modify data.
- Return appropriate HTTP status codes.
- Keep response structures consistent across endpoints.
- Avoid exposing internal implementation details.
- Avoid returning unnecessary fields or sensitive database properties.

Common HTTP status codes:

| Status | Usage                                         |
| ------ | --------------------------------------------- |
| 200    | Successful request                            |
| 201    | Resource created                              |
| 204    | Successful request with no response body      |
| 400    | Invalid request                               |
| 401    | Authentication required or invalid            |
| 403    | Insufficient permissions                      |
| 404    | Resource not found                            |
| 409    | Resource conflict                             |
| 422    | Semantically invalid input, where appropriate |
| 429    | Too many requests                             |
| 500    | Unexpected server error                       |
| 503    | Service temporarily unavailable               |

Do not return `200` for failed operations.

## 4. Controllers and Services

Controllers should primarily handle HTTP concerns.

Example:

```javascript
const getUser = async (req, res) => {
  const user = await userService.getById(req.params.id);

  return res.status(200).json(user);
};
```

Services should contain business logic:

```javascript
const getById = async (id) => {
  const user = await userRepository.findById(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
};
```

Rules:

- Controllers should not contain complex business logic.
- Services should not depend on Express request or response objects.
- Avoid passing the entire `req` object into services.
- Pass only the required data.
- Keep business rules in one place.
- Reuse services when the same business operation is needed by multiple endpoints.
- Avoid services that simply forward arguments without adding meaningful value.
- Avoid large controllers and services handling unrelated functionality.

## 5. Input Validation

Treat all external input as untrusted.

Validate:

- Request bodies.
- Route parameters.
- Query parameters.
- Headers.
- Cookies.
- Uploaded files.
- External API responses where relevant.

Rules:

- Validate input at the API boundary.
- Use a validation library already present in the project.
- Prefer Zod, Joi, or express-validator if a validation library is needed.
- Do not introduce another validation library when an existing one is sufficient.
- Reject malformed input early.
- Validate required fields, types, formats, lengths, ranges, and allowed values.
- Do not rely on frontend validation.
- Do not assume TypeScript types provide runtime validation.
- Avoid duplicating validation logic across controllers and services.
- Use validated and normalized data downstream.
- Never trust client-provided IDs, roles, permissions, or ownership information.

Example using Zod:

```javascript
const userSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});
```

## 6. Error Handling

Use centralized error handling.

Recommended approach:

- Create consistent application error classes where useful.
- Distinguish expected operational errors from unexpected programming errors.
- Use centralized Express error-handling middleware.
- Avoid repetitive try/catch blocks in every controller when async error propagation is already handled.
- Do not silently swallow errors.
- Do not catch errors just to rethrow the exact same error without adding value.
- Preserve original errors when wrapping them.
- Log unexpected errors with useful context.
- Never expose stack traces or internal errors to clients in production.

Example custom error:

```javascript
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace?.(this, this.constructor);
  }
}
```

Example centralized error handler:

```javascript
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    logger.error({
      err,
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
    });
  }

  return res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: statusCode >= 500 ? 'Internal server error' : err.message,
    },
  });
};
```

Adapt the implementation to the project's existing error and logging systems.

Important:

- Express 5 automatically forwards rejected promises from async route handlers to error middleware.
- Express 4 requires an async wrapper or explicit error forwarding.
- Check the installed Express version before implementing async error handling.
- Avoid installing duplicate async error-handling packages unnecessarily.

## 7. Security

Security must be considered in every backend change.

### General security

- Never hardcode credentials, passwords, tokens, or API keys.
- Store secrets in environment variables or a secure secrets management system.
- Never commit `.env` files.
- Add appropriate security headers using Helmet or an existing equivalent.
- Configure CORS explicitly.
- Do not automatically allow every origin in production.
- Apply rate limiting to public and sensitive endpoints.
- Limit request body sizes.
- Avoid exposing internal server information.
- Keep dependencies updated and review known vulnerabilities.
- Use HTTPS in production.
- Apply least-privilege principles.

### Injection prevention

- Use parameterized database queries.
- Never construct SQL queries by concatenating user input.
- Use safe database client APIs.
- Validate and safely handle user-controlled content.
- Avoid passing untrusted input into shell commands, filesystem paths, or dynamic code execution.

### Sensitive information

- Never log passwords, authentication tokens, session IDs, or authorization headers.
- Avoid returning entire database entities directly.
- Explicitly select fields that should be exposed through APIs.
- Never expose internal error details in production responses.
- Apply appropriate data-access restrictions.

### Password handling

- Never store plaintext passwords.
- Use a suitable password hashing algorithm such as Argon2id or bcrypt.
- Never return password hashes in API responses.
- Use established authentication libraries and security practices rather than implementing cryptography manually.

## 8. Authentication and Authorization

Keep authentication and authorization separate.

**Authentication:** Determines who the user is.

**Authorization:** Determines what the user is allowed to do.

Rules:

- Centralize authentication logic in middleware or a dedicated authentication layer.
- Protect routes that require authentication.
- Validate tokens or sessions properly.
- Never trust client-provided user IDs or roles.
- Check resource ownership and permissions on the backend.
- Do not rely on frontend route protection.
- Apply role-based or permission-based access control where appropriate.
- Avoid duplicating authorization checks inconsistently across controllers.
- Use secure cookie settings when cookies are used.
- Implement token expiration and refresh mechanisms appropriately.
- Avoid storing sensitive authentication data in insecure locations.

Example:

```javascript
router.get(
  '/users/:id',
  authenticate,
  authorize('user:read'),
  userController.getUser,
);
```

Authorization must also verify access to the specific requested resource, not merely the existence of a permission.

## 9. Database Best Practices

Adapt database practices to the database and ORM already used by the project.

Rules:

- Keep database access separate from HTTP handling.
- Use parameterized queries or safe ORM methods.
- Avoid unnecessary database queries.
- Fetch only required fields.
- Avoid N+1 query patterns.
- Use pagination for potentially large collections.
- Add appropriate indexes based on actual query patterns.
- Use transactions when multiple operations must succeed or fail together.
- Handle unique constraint violations and other expected database errors.
- Do not expose raw database errors to API clients.
- Validate identifiers before querying where appropriate.
- Avoid unnecessary database writes.
- Be careful with concurrent updates and race conditions.
- Do not trust client-provided values for database ownership or authorization.

Never introduce schema changes or migrations without considering their impact on existing data and application compatibility.

## 10. Async Operations and Performance

Node.js uses an event loop. Avoid blocking it unnecessarily.

Rules:

- Use async/await consistently.
- Avoid synchronous filesystem operations inside request handlers.
- Avoid CPU-heavy synchronous operations on the main event loop.
- Use `Promise.all()` when independent operations can safely run concurrently.
- Do not parallelize operations that depend on one another.
- Avoid unnecessary API and database calls.
- Avoid repeated calculations when results can be reused safely.
- Implement pagination for large datasets.
- Limit concurrency when processing large collections.
- Avoid unbounded loops over user-controlled input.
- Configure appropriate request timeouts and payload limits.
- Avoid unnecessary middleware and expensive processing on every request.

Do not optimize code prematurely. Identify actual bottlenecks before introducing caching, queues, workers, or additional infrastructure.

## 11. Configuration and Environment Variables

Rules:

- Centralize application configuration.
- Avoid accessing `process.env` throughout the application.
- Validate required environment variables during startup.
- Fail fast if required configuration is missing or invalid.
- Never hardcode secrets.
- Use sensible defaults only for non-sensitive configuration.
- Separate development, testing, and production configuration.
- Do not expose server-side environment variables to clients.
- Avoid committing environment-specific secrets.

Example:

```javascript
const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
};

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

module.exports = config;
```

Adapt module syntax to the project's existing CommonJS or ES module configuration.

## 12. Middleware

Keep middleware focused on one responsibility.

Typical middleware responsibilities:

- Authentication.
- Authorization.
- Request validation.
- Request logging.
- Rate limiting.
- Error handling.
- Request ID generation.
- File upload handling.

Rules:

- Understand Express middleware execution order.
- Register middleware in the correct order.
- Avoid putting unrelated business logic into middleware.
- Avoid middleware that performs unnecessary database calls.
- Keep reusable middleware configurable where appropriate.
- Ensure middleware calls `next()` correctly.
- Avoid sending multiple responses for one request.
- Ensure asynchronous middleware errors are forwarded correctly.

Recommended general order:

1. Security headers.
2. Request ID and logging.
3. CORS.
4. Body parsing.
5. General middleware.
6. Routes and route-specific middleware.
7. 404 handling.
8. Centralized error handling.

Adjust ordering when specific middleware dependencies require it.

## 13. Logging and Monitoring

Use structured logging where practical.

Rules:

- Prefer an established logging library such as Pino or Winston if one is already used or needed.
- Use appropriate log levels:
  - `debug`
  - `info`
  - `warn`
  - `error`
- Include request IDs where possible.
- Include useful context such as endpoint, HTTP method, and relevant resource ID.
- Avoid logging sensitive information.
- Avoid excessive logging for successful requests.
- Log unexpected errors with sufficient context.
- Avoid logging the same error repeatedly at multiple layers.
- Do not use `console.log()` as a replacement for a production logging strategy.

## 14. API Response Consistency

Maintain a consistent response format.

Example successful response:

```json
{
  "data": {
    "id": 123,
    "name": "John"
  }
}
```

Example collection response:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

Example error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": []
  }
}
```

Rules:

- Follow the existing API response conventions.
- Use consistent naming and nesting.
- Do not mix incompatible response formats across endpoints.
- Do not include unnecessary metadata.
- Do not expose stack traces or internal errors.
- Do not change existing API contracts without a clear reason.

## 15. TypeScript Best Practices

If the project uses TypeScript:

- Prefer strict typing.
- Avoid `any`.
- Use `unknown` when the type is genuinely not known.
- Narrow types through validation and type guards.
- Define types for service inputs and outputs.
- Type request parameters, query parameters, and request bodies appropriately.
- Extend Express request types when custom properties are added.
- Avoid unnecessary type assertions.
- Do not use TypeScript types as a substitute for runtime validation.
- Avoid duplicating type definitions.
- Reuse shared types when appropriate.
- Keep runtime validation schemas and compile-time types aligned.

Do not convert a JavaScript project to TypeScript automatically.

## 16. Testing

Write tests for important application behavior.

Prioritize:

- Business logic.
- API endpoints.
- Input validation.
- Authentication.
- Authorization.
- Error handling.
- Database interactions.
- Important edge cases.

Rules:

- Test both successful and unsuccessful scenarios.
- Test unauthorized and forbidden access.
- Test malformed input.
- Test resource-not-found behavior.
- Test important business rules.
- Avoid tests that depend on execution order.
- Avoid testing implementation details when behavior can be tested instead.
- Mock external services where appropriate.
- Keep tests deterministic.
- Do not weaken existing tests to accommodate incorrect implementation.

Use existing testing tools. Common options include Jest, Vitest, and Supertest.

## 17. Express Application Lifecycle

Rules:

- Separate Express application initialization from server startup where practical.
- Keep server startup code out of modules that need to be imported by tests.
- Handle graceful shutdown.
- Close database connections and other resources during shutdown.
- Handle termination signals such as SIGTERM and SIGINT.
- Configure appropriate server timeouts.
- Handle process-level fatal errors appropriately.
- Do not assume the application can safely continue after an uncaught exception.
- Use a process manager or deployment platform to restart failed processes when appropriate.

## 18. Code Quality and Maintainability

- Use named constants for meaningful configuration values and non-obvious numbers.
- Avoid magic numbers and unexplained string literals.
- Do not extract every literal into a constant unnecessarily.
- Avoid overly generic utility functions.
- Avoid large functions and classes with unrelated responsibilities.
- Prefer composition over unnecessary inheritance.
- Avoid boolean parameters when they make function calls difficult to understand.
- Avoid unnecessary defensive checks when invariants are already guaranteed.
- Do not add comments that simply restate the code.
- Keep imports organized according to existing conventions.
- Remove unused code when encountered.
- Maintain consistent formatting and linting standards.

## 19. Dependencies and Third-Party Libraries

Before introducing a dependency:

1. Check whether the project already has a suitable solution.
2. Evaluate whether the dependency is actually necessary.
3. Consider maintenance status and security.
4. Consider bundle/runtime overhead and compatibility.
5. Prefer established, maintained libraries.

Do not install multiple libraries that solve the same problem.

Do not replace existing dependencies simply because another library is more popular.

## 20. Instructions for Copilot When Modifying Existing Projects

Before making changes:

1. Inspect the existing project structure.
2. Identify the Express version.
3. Identify JavaScript or TypeScript usage.
4. Identify the module system (CommonJS or ES modules).
5. Identify the database and ORM/query builder.
6. Identify existing authentication and authorization mechanisms.
7. Identify validation and error-handling approaches.
8. Identify existing logging and testing tools.
9. Understand the existing API contracts.
10. Follow established conventions unless there is a concrete reason to improve them.

When reviewing or refactoring:

- Identify actual problems before changing code.
- Prioritize security vulnerabilities, correctness, and maintainability.
- Fix root causes instead of introducing workarounds.
- Avoid unrelated refactoring.
- Preserve existing behavior unless a change is required.
- Do not change database schemas or migrations without explicit consideration.
- Do not introduce breaking API changes without explaining them.
- Reuse existing libraries and patterns.
- Avoid creating unnecessary files, layers, or abstractions.
- Apply changes incrementally.

After making changes:

1. Run relevant tests.
2. Run linting where available.
3. Run the build or type checker where available.
4. Check imports and dependency usage.
5. Review error-handling paths.
6. Check for security implications.
7. Check for unintended API behavior changes.
8. Summarize what changed.
9. Identify any remaining issues or recommended improvements.

## 21. Important Decision-Making Rule

Best practices are guidelines, not reasons to introduce unnecessary complexity.

Before implementing a recommendation, consider:

- Does this solve an actual problem?
- Does this improve security, correctness, or maintainability?
- Is there already an established solution in the project?
- Does this introduce unnecessary dependencies?
- Could this break existing functionality?
- Is the added complexity justified?

If an improvement is potentially breaking or requires an architectural decision, explain the trade-offs before proceeding.

The objective is not to make the backend follow every theoretical best practice.

The objective is to build a secure, reliable, maintainable, and understandable Express application.
