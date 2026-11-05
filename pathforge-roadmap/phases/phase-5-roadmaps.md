# Phase 5: Skill Gaps, Bridge Projects and Preparation Roadmaps

**Target:** Week 4–5  
**Outcome:** A match result can be converted into a practical, trackable preparation plan.

## Scope

### Skill gap diagnostics
- Convert missing and weakly evidenced requirements into prioritized gaps.
- Explain why each gap matters for the selected role.
- Distinguish a genuine missing skill from missing evidence.
- Allow users to mark a skill as already known and provide evidence.

### Bridge projects
- Recommend small, relevant projects mapped to specific gaps.
- Define objective, expected deliverables, suggested stack and completion criteria.
- Prefer demonstrable outcomes that can be added to a portfolio.
- Avoid recommending projects that are unrelated or unrealistically large.

### Seven-day roadmap
- Generate seven days of tasks based on the selected internship and skill gaps.
- Include task title, description, estimated effort, expected output and linked skill gap.
- Allow users to edit, reorder and complete tasks.
- Track progress from persisted task completion state.
- Record generation inputs and version for reproducibility.
- Make clear that generated plans are suggestions and require user judgment.

## Suggested tables
`bridge_projects`, `roadmaps`, `roadmap_tasks`, `roadmap_skill_gaps`.

## Suggested endpoints
- `POST /api/v1/roadmaps/generate`
- `GET /api/v1/roadmaps`
- `GET /api/v1/roadmaps/:id`
- `PATCH /api/v1/roadmaps/:id`
- `PATCH /api/v1/roadmaps/:id/tasks/:taskId`

## Acceptance criteria
- [x] Roadmap generation requires an owned match result or explicit target internship.
- [x] Every roadmap task maps to a clear learning or evidence objective.
- [x] The plan contains seven days for the MVP flow.
- [x] Tasks include realistic effort estimates and measurable outputs.
- [x] Users can edit and complete tasks.
- [x] Completion state persists after refresh and re-login.
- [x] Progress percentage is derived from persisted task states.
- [x] Users cannot access or modify another user's roadmap.
- [x] Regeneration creates a new version or clearly preserves history.
- [x] Empty, failed and loading states are handled in the UI.
- [x] Tests cover ownership, task updates and progress calculation.

## Exit gate
A student should be able to complete a roadmap and show concrete outputs that improve the evidence available to the matching engine.
