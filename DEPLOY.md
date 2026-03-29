# Stable External Deployment

This repository's current MVP runtime is **stateful**:

- the web app reads and writes `var/community-state.json`
- uploads are stored under `var/uploads`
- the Python worker reads the same local files and updates public state

Because of that, the most stable deployment path for the current codebase is:

- one Linux VM
- Docker Engine + Docker Compose
- one persistent disk
- one reverse proxy with HTTPS

The files in this repository already support that layout:

- `Dockerfile`
- `docker-compose.yml`
- `deploy/Caddyfile`
- `.env.production.example`

## Why This Is The Right Fit

This avoids the two failure modes you've already hit:

- temporary tunnels expiring or going offline
- stateless hosting platforms dropping local file writes or background workers

It also matches the code exactly: both the web container and the worker container share the same persistent `sac_var` volume mounted at `/app/var`.

## Recommended Server Shape

Use a small Ubuntu VM with:

- 2 vCPU
- 4 GB RAM
- 40 GB+ disk
- one public IP

Examples include a small VM from providers like DigitalOcean, Hetzner, Lightsail, or any comparable VPS.

## One-Time Setup On The Server

1. Install Docker Engine and Docker Compose plugin.
2. Point your domain DNS to the server IP.
3. Clone this repo onto the server.
4. Copy the production env template:

```bash
cp .env.production.example .env.production
```

5. Edit `.env.production` and set at least:

- `APP_DOMAIN`
- `LETSENCRYPT_EMAIL`
- `APP_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

6. Start the stack:

```bash
docker compose --env-file .env.production up -d --build
```

7. Check status:

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f web
docker compose --env-file .env.production logs -f worker
```

## Updates

Pull code changes and redeploy:

```bash
git pull
docker compose --env-file .env.production up -d --build
```

## Backups

The important state lives in the named Docker volume mounted to `/app/var`.

At minimum, back up:

- `var/community-state.json`
- `var/uploads`
- `.env.production`

## If You Want PaaS Later

If you later want Vercel/Render/Railway-style hosting, refactor first:

- move report state from local files to Postgres
- move uploaded artifacts to S3-compatible object storage
- move worker coordination to a real queue or database-backed jobs table

After that, web and worker can scale independently on stateless infrastructure.
