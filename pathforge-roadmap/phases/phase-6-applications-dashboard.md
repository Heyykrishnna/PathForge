# Phase 6: Application Tracking and Dashboard

**Target:** Week 5  
**Outcome:** Students can manage internship opportunities and see their career-preparation progress in one place.

## Scope

### Application tracking

- Save an internship to a personal list.
- Create an application linked to an internship.
- Track status: saved, preparing, ready, applied, interviewing, offered or rejected.
- Store applied date, deadline, notes and next action.
- Allow status updates and maintain a basic activity history.
- Prevent duplicate active applications for the same user and internship where appropriate.

### Dashboard

- Profile completion.
- Candidate profile summary.
- Recommended internships and recent match results.
- Skill gap overview.
- Active roadmaps and completion.
- Application counts by status.
- Upcoming deadlines and next actions.
- Recent activity.

### Data consistency

- Dashboard data comes from backend aggregates, not duplicated client-side records.
- Invalidate/refetch relevant TanStack Query keys after mutations.
- Use optimistic updates only when rollback is reliable.
- Keep server state in TanStack Query; use Zustand only for transient UI state.

## Suggested tables

`applications`, `application_events` (optional), `saved_internships`, `activity_logs`.

## Suggested endpoints

- `GET /api/v1/applications`
- `POST /api/v1/applications`
- `GET /api/v1/applications/:id`
- `PATCH /api/v1/applications/:id`
- `DELETE /api/v1/applications/:id`
- `GET /api/v1/dashboard/overview`

## Acceptance criteria

- [x] Users can save and unsave internships.
- [x] Users can create and update applications.
- [x] Status transitions are validated.
- [x] Application notes and dates persist.
- [x] Duplicate application behavior is defined and tested.
- [x] Application records are scoped to their owner.
- [x] Dashboard aggregates match underlying application and roadmap records.
- [x] Upcoming deadlines use a consistent timezone strategy.
- [x] Mutations update the UI without stale or contradictory data.
- [x] Empty dashboard states guide new users to the next useful action.
- [x] Tests cover CRUD, ownership and dashboard aggregate correctness.

## Exit gate

A user can move from discovering an internship to preparing, applying and tracking its outcome without leaving PathForge.
