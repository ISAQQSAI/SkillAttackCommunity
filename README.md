# SkillAtlas

SkillAtlas is a public-safe report community for agent and skill security.

The production workflow is:

- guest uploads a `report_bundle.zip`
- the server parses and stores it into a structured display result
- the upload is submitted immediately and returns a submission ID
- admin reviews the original bundle plus the sanitized preview from a local-only review backend
- approved submissions become public-safe case pages immediately

Raw bundles, raw JSON, full trajectories, and skill archives are not exposed in the public UI.

## Core Product Flow

- Guest submission
  - upload a standardized zip bundle
  - inspect the parsed display result
  - submit without registering
  - receive a submission ID
- Admin review
  - open the review queue
  - inspect sanitized findings and download the original bundle
  - publish or reject submissions from the local-only review console
- Public community
  - browse published skills first
  - open skill detail pages and their published case pages
  - read structured finding summaries
  - never receive raw traces or raw report files

## Runtime Stack

- Next.js 16
- TypeScript
- Tailwind CSS 4
- optional NextAuth with GitHub OAuth for local admin sign-in
- Prisma
- PostgreSQL
- local persistent storage for uploaded bundles under `var/uploads`

## Main Routes

- `/`
- `/home`
- `/skills`
- `/skills/[skillId]`
- `/skills/[skillId]/cases/[slug]`
- `/submit`
- `/reports`
- `/findings` (compat redirect)
- `/findings/[slug]` (compat redirect)
- `/review`
- `/review/[id]`

## API Surface

- `POST /api/uploads`
- `GET /api/submissions/:id`
- `GET /api/admin/reports`
- `GET /api/admin/reports/:id`
- `GET /api/admin/reports/:id/bundle`
- `POST /api/admin/reports/:id/review`
- `GET /api/public/cases`
- `GET /api/public/cases/:slug`

## Database Model

The main production tables are:

- `User`
- `Submission`
- `ParsedBundle`
- `ParsedBundleFinding`
- `ParsedBundleArtifact`
- `ReviewRecord`
- `PublicCase`

See [prisma/schema.prisma](./prisma/schema.prisma).

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Create `.env.local`

Set at least:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/skillattack_community?schema=public"
```

By default this gives you:

- guest browsing and submission for everyone
- local-only admin access to `/review` and `/api/admin/*`

If you also want GitHub identity on localhost, fill:

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GITHUB_ID`
- `GITHUB_SECRET`
- `ADMIN_GITHUB_LOGINS`

3. Start PostgreSQL

Use any local Postgres instance and point `DATABASE_URL` at it.

4. Apply migrations

```bash
npx prisma migrate deploy
```

5. Start the web app

```bash
npm run dev
```

6. Open `http://localhost:3000`

Admin review is intentionally local-only. Open `/review` from localhost, or use an SSH tunnel in production.

## Production Deployment

Use:

- [docker-compose.yml](./docker-compose.yml)
- [Dockerfile](./Dockerfile)
- [DEPLOY.md](./DEPLOY.md)

The default production setup is:

- one VM
- one PostgreSQL container
- one web container
- one Caddy container
- persistent volumes for Postgres and uploaded bundles

## Security Notes

- guest uploads are private by default
- admin review routes are local-only by default
- optional GitHub admin login is restricted by `ADMIN_GITHUB_LOGINS`
- public pages render only sanitized structured data
- local paths, runtime paths, file URIs, emails, IPs, and common secret patterns are redacted from preview data
