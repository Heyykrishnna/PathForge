# API and Synchronization Conventions

## Base path
`/api/v1`

## Response shape
Use a consistent envelope, for example:

```json
{
  "data": {},
  "meta": {}
}
```

Errors should have a stable shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be validated.",
    "details": []
  }
}
```

Do not expose stack traces, database errors, secrets or provider tokens.

## Frontend data flow
- TanStack Query owns remote/server state.
- Zustand is reserved for transient client-only state such as open panels or temporary UI preferences.
- Mutations invalidate the query keys they affect.
- Clear user-scoped cached data on logout and account changes.
- Use optimistic updates only where rollback behavior is defined.

## Backend boundaries
- Routes define HTTP paths and middleware.
- Controllers translate HTTP requests/responses.
- Services contain business rules and orchestration.
- Repositories/data-access helpers encapsulate Drizzle queries when useful.
- Zod validates external input.
- Database constraints enforce important invariants in addition to application checks.

## Long-running analysis
Resume parsing, GitHub sync and semantic matching may take longer than a normal request. For those operations:
1. Create a job/analysis record with a status.
2. Enqueue work when a queue is configured.
3. Return a job or analysis ID.
4. Expose a status endpoint.
5. Persist result and error state.
6. Let the frontend poll with sensible backoff or refresh on demand.

Do not hold an HTTP request open while waiting for a slow third-party LLM or GitHub operation.

## Data integrity
- Use transactions for multi-record writes that must succeed together.
- Add foreign keys, unique constraints and indexes for common lookups.
- Scope every user-owned read and write by authenticated user ID.
- Store timestamps in UTC; format for the user's locale in the frontend.
- Store source and version metadata for imported or generated data.
