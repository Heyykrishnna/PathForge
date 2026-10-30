# Phase 4: Internship Intelligence and Matching Engine

**Target:** Week 3–4  
**Outcome:** Students can compare their evidence-backed profile with internship requirements and understand the result.

## Scope

### Internship catalogue

- Create and manage internship records.
- Store company, role, description, location, work mode, source URL and source timestamp.
- Store eligibility rules and required/preferred skills separately.
- Add source attribution and data freshness indicators.
- Support search, filters, pagination and saved internships.
- Begin with curated or permitted data sources; do not assume unrestricted job-board scraping.

### Hybrid matching

Implement two components:

1. Deterministic scoring over normalized structured requirements.
2. Semantic relevance analysis for project descriptions and evidence-to-requirement similarity.

Initial illustrative weighting:

- Technical skills: 35%
- Relevant projects: 25%
- Experience: 15%
- Education: 10%
- Role-specific requirements: 15%

An initial combined score may be `0.7 * deterministic + 0.3 * semantic`. Treat these as tunable starting values, not validated truth. Version the scoring configuration and record it with each result.

Hard eligibility requirements must be checked separately. A failed mandatory condition must be clearly surfaced and must not be hidden by a high compatibility score.

### Explainable diagnostics

- Matched requirements and supporting evidence.
- Missing and partially demonstrated skills.
- Relevant projects and why they are relevant.
- Eligibility warnings.
- Component score breakdown.
- Confidence/coverage limitations.
- Recommended next actions.

## Suggested tables

`internships`, `internship_skills`, `match_results`, `match_evidence`, `skill_gaps`, `matching_config_versions`.

## Suggested endpoints

- `GET /api/v1/internships`
- `GET /api/v1/internships/:id`
- `POST /api/v1/internships/:id/save`
- `POST /api/v1/matching/analyze`
- `GET /api/v1/matching/results/:id`

## Acceptance criteria

- [x] Internship records include source and last-verified timestamp.
- [x] Required and preferred skills are represented separately.
- [x] Search, filtering and pagination work.
- [x] Matching uses normalized skills and structured evidence.
- [x] Deterministic and semantic components can be inspected independently.
- [x] Score weights and engine version are stored with each result.
- [x] Mandatory eligibility failures are shown separately from compatibility.
- [x] Each positive match can cite candidate evidence.
- [x] Missing or weak evidence is not represented as proven skill.
- [x] The result explains score components in plain language.
- [x] Re-running analysis produces a new traceable result rather than silently mutating history.
- [x] Tests cover edge cases, missing data and eligibility failures.

## Exit gate

A reviewer should be able to inspect a match result and understand how it was produced without trusting an opaque AI-generated score.
