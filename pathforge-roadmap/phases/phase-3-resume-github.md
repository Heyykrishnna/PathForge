# Phase 3: Resume and GitHub Intelligence

**Target:** Week 2–3  
**Outcome:** PathForge builds a reviewable candidate evidence profile from a resume and connected GitHub account.

## Scope

### Resume pipeline
- Upload PDF resumes with file type, size and malware-scanning safeguards appropriate to deployment.
- Store files in private object storage; store metadata and ownership in PostgreSQL.
- Extract text from supported PDFs.
- Parse skills, projects, education and experience into structured fields.
- Record parser status, timestamps and extraction errors.
- Let users review, edit and confirm extracted information.
- Preserve original resume and extraction version for traceability.

### GitHub integration
- OAuth connection with minimum required scopes.
- Store tokens securely; never expose them to the browser.
- Fetch accessible repositories and metadata using rate-limit-aware requests.
- Extract languages, descriptions, README content and activity signals.
- Track sync status and last successful sync.
- Allow disconnect and token revocation.
- Respect GitHub API terms and repository visibility/permissions.

### Candidate evidence
- Normalize skill names against the skills catalogue.
- Store evidence source and confidence for each extracted skill.
- Distinguish self-reported skills from resume/GitHub evidence.
- Do not infer expertise from repository or commit counts alone.

## Suggested tables
`resumes`, `github_accounts`, `repositories`, `candidate_evidence` (or equivalent source-linked evidence tables).

## Suggested endpoints
- `POST /api/v1/resumes/upload`
- `GET /api/v1/resumes`
- `POST /api/v1/resumes/:id/analyze`
- `GET /api/v1/resumes/:id`
- `GET /api/v1/github/connect`
- `GET /api/v1/github/callback`
- `POST /api/v1/github/sync`
- `DELETE /api/v1/github/connection`

## Acceptance criteria
- [x] Only authenticated users can upload resumes.
- [x] Upload validation rejects unsupported file types and oversized files.
- [x] Resume files are private and access-controlled.
- [x] Parser status is visible: queued, processing, completed or failed.
- [x] Extracted fields can be reviewed and corrected by the user.
- [x] Re-analysis does not silently overwrite user-confirmed profile data.
- [x] GitHub OAuth state is validated to prevent CSRF.
- [x] GitHub tokens are stored securely and never returned by API responses.
- [x] User can sync and disconnect their GitHub account.
- [x] API rate limits and transient failures are handled gracefully.
- [x] Candidate evidence records its source and last-updated time.
- [x] Tests cover invalid files, ownership checks and integration failures.

## Exit gate
A user must be able to inspect and correct their candidate profile before it is used by the matching engine.
