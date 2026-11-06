# Phase 2: Authentication and Student Profiles

**Target:** Week 1–2  
**Outcome:** Users can securely create accounts, maintain sessions and manage a structured student profile.

## Scope

### Authentication
- Registration and login.
- Email verification flow.
- Logout and logout-all/sessions revocation.
- Forgot-password and reset-password flows.
- Argon2id password hashing.
- Short-lived access token strategy.
- Refresh token rotation with server-side session records.
- HttpOnly, Secure (in production), SameSite cookies.
- Protected API middleware and ownership checks.
- Basic login rate limiting and generic authentication errors.

### Student profile
- Name and contact details.
- Education history, institution, degree, field and graduation date.
- Skills linked to a normalized skills catalogue.
- Experience, achievements and project summaries.
- Profile completion calculation.
- Create, read and update profile endpoints.
- Frontend forms with server-side validation errors.

## Suggested tables
`users`, `sessions`, `email_verification_tokens`, `password_reset_tokens`, `profiles`, `educations`, `skills`, `user_skills`.

## Suggested endpoints
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/profile`
- `PATCH /api/v1/profile`

## Acceptance criteria
- [x] A user can register with valid details.
- [x] Duplicate email registration is rejected safely.
- [x] Passwords are never stored in plaintext.
- [x] Email verification tokens are single-use and expire.
- [x] A verified user can log in and access protected endpoints.
- [x] Refresh token rotation invalidates the previous refresh token.
- [x] Logout revokes the active session.
- [x] A user can revoke their other sessions.
- [x] Password reset tokens expire and cannot be reused.
- [x] User A cannot read or modify User B's profile or sessions.
- [x] Profile and education data persist after refresh/re-login.
- [x] Frontend includes validation, loading, success and error states.
- [x] Authentication flows have automated integration tests.

## Exit gate
Authentication and profile ownership tests must pass before user-specific resume, GitHub or application data is introduced.
