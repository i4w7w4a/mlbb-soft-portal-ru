# Supabase Live Verification

This runbook is the execution path for GitHub issue `#25` once real Supabase credentials are available.

## Required Environment

Set these values in `.env.local`:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

For live verification, also set:

- `NEXT_PUBLIC_ENABLE_LOCAL_ADMIN_DEMO=false`

## Required Buckets

Create or expose these Storage buckets:

- `heroes`
- `news`
- `brand`
- `social`
- `misc`

The current admin media repository treats those names as the preferred bucket map.

## Auth Requirements

- Use Supabase email magic-link auth for `/admin/login`.
- The login flow now redirects to `/api/auth/callback?next=/admin`.
- Add that callback URL to the Supabase redirect allow list.
- Keep admin sign-in restricted to existing users; the app sends `shouldCreateUser: false`.

## Preflight

Run:

```bash
npm run supabase:check
```

The script verifies:

- required env vars exist
- service-role access works
- `auth.admin.listUsers()` is reachable
- required Storage buckets exist and are listable

## Manual Verification

1. Open `/admin/login`.
2. Request a magic link for an already provisioned admin email.
3. Open the email link and confirm the browser lands on `/admin`.
4. Confirm protected admin routes no longer fall back to demo mode.
5. Open `/admin/media` and verify the Supabase source is no longer blocked.
6. Upload one asset into a target bucket through the admin media API path.
7. Confirm the uploaded file appears in the media graph with source `supabase`.
8. Delete that same remote file and confirm the graph refreshes correctly.
9. Confirm `/admin/news`, `/admin/heroes`, and `/admin` still behave normally with real auth cookies present.

## Closeout Criteria

- Auth callback exchanges code for a session successfully.
- `/admin` requires a real Supabase session.
- Remote bucket listing works.
- Remote upload/delete works.
- No regression in local content/admin flows.
- Any project-specific bucket policy notes are added back into this runbook.
