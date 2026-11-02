# Initial Data Model Notes

This is a starting inventory, not a complete Drizzle schema. Define exact columns, indexes, constraints and deletion behavior during implementation.

| Table | Purpose |
|---|---|
| users | Identity, email and password hash |
| sessions | Refresh session hashes, expiry, revocation and device metadata |
| email_verification_tokens | Single-use email verification |
| password_reset_tokens | Single-use password reset |
| profiles | Student profile |
| educations | Education history |
| skills | Canonical skills catalogue |
| user_skills | User-to-skill association and proficiency/evidence context |
| resumes | Private file metadata and parser status |
| github_accounts | OAuth connection metadata and encrypted token reference |
| repositories | Synced repository metadata |
| candidate_evidence | Source-linked evidence for skills/projects |
| internships | Role, company, location, source and freshness |
| internship_skills | Required/preferred skills |
| match_results | Versioned compatibility result |
| match_evidence | Evidence supporting individual match dimensions |
| skill_gaps | Missing or weakly evidenced requirements |
| bridge_projects | Suggested project specifications |
| roadmaps | Generated plan and source match |
| roadmap_tasks | Individual tasks and completion state |
| saved_internships | User bookmarks |
| applications | User's application record and status |
| application_events | Optional status-change history |
| activity_logs | User-visible or operational activity history |

## Important constraints
- Unique normalized user email.
- Unique user/session identifier and refresh token hash.
- Foreign keys for all ownership relationships.
- Unique user/internship application where product rules require it.
- Index common filters such as user ID, internship status, application status and deadlines.
- Store match engine version, weights/configuration reference and input snapshot reference.
- Never store raw refresh tokens or plaintext OAuth secrets.
