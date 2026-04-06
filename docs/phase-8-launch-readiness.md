# Phase 8 Launch Readiness Notes

This phase adds the internal admin surfaces for:

- `admin/calendar`
- `admin/notifications`
- `admin/settings`
- `admin/users`

The goal is practical launch support, not a larger CRM or scheduling platform.

## Migration Helper Notes

- This pass stays inside the existing Phase 2 schema.
- No schema redesign is required for the new admin screens.
- The new settings work by reading and upserting rows in the existing `site_settings` table.
- Calendar and notifications use the existing `calendar_entries`, `blackout_dates`, `notification_events`, and `notification_logs` tables.

If the workspace still needs to be linked and applied to the live project:

1. `npm install`
2. `npx supabase login`
3. `npx supabase link --project-ref renjsmdsrzjnppqpaoaa`
4. `npm run db:push`
5. `npm run db:typegen`

Then verify the seeded reference data:

1. `npm run db:verify:seed`

## Launch Checklist

- Confirm at least one valid owner account exists in both `profiles` and `user_roles`.
- Open `/admin/users` and confirm the owner and manager list matches reality.
- Open `/admin/settings` and review:
  - brand identity
  - contact details
  - Instagram details
  - SEO defaults
  - inquiry feature flags
  - booking notice copy
- Open `/admin/calendar` and add blackout dates for:
  - vacations
  - sold-out weekends
  - personal or family events
  - any dates that should not be booked
- Submit a test inquiry and confirm:
  - the inquiry appears in `/admin/inquiries`
  - the event date appears in `/admin/calendar`
  - a notification log row appears in `/admin/notifications`
- Review `/admin/orders`, `/admin/customers`, pricing, content, FAQs, testimonials, and media one final time before launch.
- Run:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`

## How To Operate The App

### Daily Routine

1. Start in `/admin/inquiries` to review new leads.
2. Move to `/admin/orders` for confirmed work and payment follow-up.
3. Check `/admin/calendar` for upcoming event dates and blackout conflicts.
4. Use `/admin/notifications` to confirm the app recorded internal notification activity.

### Settings

- Use `/admin/settings` for business info and launch-sensitive toggles.
- Keep settings changes small and intentional.
- Treat booking notices as reusable operational copy, not a full marketing campaign tool.

### Users And Access

- Use `/admin/users` to understand who currently has owner or manager access.
- This phase intentionally does not add an invitation workflow.
- New admin access still depends on a real Supabase Auth user plus matching `profiles` and `user_roles` rows.

### Notifications

- Notifications are visibility-first in this pass.
- The page is meant to show event definitions and delivery history that the app recorded.
- Do not assume full automation is live just because a log row exists.

### Calendar

- The calendar combines:
  - order event dates
  - inquiry event dates worth watching
  - all-day manual calendar entries
  - blackout dates
- Use blackout dates for operational protection first.
- Keep manual entries lightweight so the page stays useful at a glance.
