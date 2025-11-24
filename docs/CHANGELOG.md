# Changelog

## 2025-11-21

- Added changelog to track hardening work for the multi-tenant platform.
- Done: enforced tenant filters in analytics dashboard/reports and stats; scoped case type CRUD per org (with org-prefixed ids).
- Done: parameterized activity log query to avoid raw org interpolation.
- Done: fixed client signup flow to set organization_id when auto-creating an initial case.
- Done: added eslint dependency so `npm run lint` can resolve the binary (lockfile pending install).
- Done: cleaned key API error strings with encoding artifacts.
- Done: added upload guards (size/MIME) to document uploads and AI document review.
- Done: enforced cron reminders to require `CRON_SECRET_KEY` and filter reminders by organization_id when provided.
- Done: added pagination limits to documents/messages listing endpoints.
- Done: configured ESLint (`eslint-config-next@15`, .eslintrc) and fixed lint findings (next-auth types, hooks deps).
- Done: Added slug-based tenant access: `/[slug]` redirects to `/[slug]/login`, login/sign-in requires matching slug, and slug editable in Admin > Configuración.
- Done: Settings API now validates and updates organization slug (unique, reserved-word safe); UI exposes slug field.
- TODO: add pagination limits on remaining heavy endpoints (e.g., activity) and review remaining user-facing strings.
