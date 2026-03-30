# Production Deployment

This repository now assumes a production runtime built around:

- Next.js app server
- PostgreSQL for persistent submission, review, and public-case data
- local persistent disk for uploaded bundles under `var/uploads`
- one reverse proxy with HTTPS

The default deployment target is still a single Linux VM, but the app is no longer file-state driven.

## What Persists Where

- PostgreSQL:
  - guest submission records
  - parsed findings
  - admin review history
  - published public cases
- Local disk:
  - uploaded `report_bundle.zip` files
  - any future derived files under `var/uploads`

## Recommended Server Shape

- 2 vCPU
- 4 GB RAM
- 60 GB+ disk
- one public IP

## One-Time Setup

1. Install Docker Engine and the Docker Compose plugin.
2. Point your DNS at the server IP.
3. Clone this repository onto the server.
4. Copy the production env template:

```bash
cp .env.production.example .env.production
```

5. Edit `.env.production` and set:

- `APP_DOMAIN`
- `APP_URL`
- `LETSENCRYPT_EMAIL`
- `NEXTAUTH_URL`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`

Optional if you also want GitHub identity while reviewing locally:

- `NEXTAUTH_SECRET`
- `GITHUB_ID`
- `GITHUB_SECRET`
- `ADMIN_GITHUB_LOGINS`

6. Start the stack:

```bash
docker compose --env-file .env.production up -d --build
```

7. Check status:

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f postgres
docker compose --env-file .env.production logs -f web
```

## Admin Access Model

- Public community pages remain reachable on your domain.
- Admin review is intended to stay local-only.
- Access `/review` and `/api/admin/*` from localhost on the server, or through an SSH tunnel.
- The public UI does not expose an admin login button.

## Migrations

The web container runs:

```bash
npx prisma migrate deploy
```

before starting Next.js. If you need to run it manually:

```bash
docker compose --env-file .env.production exec web npx prisma migrate deploy
```

## Updates

```bash
git pull
docker compose --env-file .env.production up -d --build
```

## Backups

Back up both:

- PostgreSQL data volume
- `var/uploads` volume
- `.env.production`

## Important Runtime Notes

- Guest uploads are stored privately and never exposed directly to the public UI.
- Public pages only render `PublicCase` rows generated after admin approval.
- GitHub login is restricted to the allowlist in `ADMIN_GITHUB_LOGINS`.
