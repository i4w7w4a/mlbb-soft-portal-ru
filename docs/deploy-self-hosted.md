# Self-Hosted Deployment

This project is ready for a single-server deployment with a persistent JSON content store.

## Why the content root matters

The admin surface writes directly into the JSON-first content layer. If you deploy each release into a fresh directory, those edits will be lost unless the content graph lives outside the release folder.

Use `MLBB_CONTENT_ROOT` on the server to point the app at a persistent directory such as `/var/lib/mlbb-soft-rift/content`.

## Recommended server shape

- Ubuntu 24.04 or similar Linux host
- Node.js 20+
- `nginx` as the reverse proxy
- one persistent app data directory
- one release directory for the uploaded standalone bundle

## Build the upload bundle locally

```bash
npm install
npm run deploy:bundle
```

This creates `.deploy/standalone` with:

- the Next standalone server
- `.next/static`
- `public`
- initial `content`
- deploy templates
- `.env.example`

## Prepare the server

Suggested directories:

- release root: `/var/www/mlbb-soft-rift/current`
- persistent content root: `/var/lib/mlbb-soft-rift/content`

Suggested Linux user:

```bash
sudo useradd --system --create-home --shell /bin/bash mlbb
sudo mkdir -p /var/www/mlbb-soft-rift /var/lib/mlbb-soft-rift/content
sudo chown -R mlbb:mlbb /var/www/mlbb-soft-rift /var/lib/mlbb-soft-rift
```

## Upload the bundle

Upload the contents of `.deploy/standalone` to:

```bash
/var/www/mlbb-soft-rift/current
```

Seed the persistent content directory on the first deployment:

```bash
rsync -a /var/www/mlbb-soft-rift/current/content/ /var/lib/mlbb-soft-rift/content/
```

## Environment

Create `/var/www/mlbb-soft-rift/current/.env.production`:

```bash
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_PUBLIC_SITE_URL=https://your-domain.example
NEXT_PUBLIC_ENABLE_LOCAL_ADMIN_DEMO=true
MLBB_CONTENT_ROOT=/var/lib/mlbb-soft-rift/content
```

If you later enable Supabase, add those keys here too.

## Start the standalone server manually

```bash
cd /var/www/mlbb-soft-rift/current
set -a && source ./.env.production && set +a
node server.js
```

## systemd

Use the template in [mlbb-soft-rift.service](C:/Users/iwwa/Documents/6_Work/Open_orche/deploy/systemd/mlbb-soft-rift.service).

Typical install steps:

```bash
sudo cp deploy/systemd/mlbb-soft-rift.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now mlbb-soft-rift
sudo systemctl status mlbb-soft-rift
```

## nginx

Use the template in [mlbb-soft-rift.conf](C:/Users/iwwa/Documents/6_Work/Open_orche/deploy/nginx/mlbb-soft-rift.conf).

Typical install steps:

```bash
sudo cp deploy/nginx/mlbb-soft-rift.conf /etc/nginx/sites-available/mlbb-soft-rift.conf
sudo ln -s /etc/nginx/sites-available/mlbb-soft-rift.conf /etc/nginx/sites-enabled/mlbb-soft-rift.conf
sudo nginx -t
sudo systemctl reload nginx
```

Then add TLS with `certbot` or your existing reverse-proxy process.

## Release updates

On each new release:

1. Build a fresh `.deploy/standalone` locally.
2. Upload it over the existing `/var/www/mlbb-soft-rift/current`.
3. Do not overwrite `/var/lib/mlbb-soft-rift/content`.
4. Restart `mlbb-soft-rift`.

If production content was edited through `/admin`, sync `/var/lib/mlbb-soft-rift/content` back into git before or after the release so the repository stays authoritative.

## Smoke checklist

- `/` loads with styling and images
- `/heroes` and `/news` render without 500s
- `/search` works
- `/admin` opens without external auth
- creating or editing a draft changes files under `MLBB_CONTENT_ROOT`
- restarting the service keeps those edits intact
