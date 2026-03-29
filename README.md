# SkillAtlas

SkillAtlas — Skill Attack Trace Library for Agent Safety.

Half-open community for submitting audited vulnerability reports, reviewing evidence, and publishing public-safe case pages.

This MVP is intentionally **report-first**:

- reporters submit a structured **finding report**
- reviewers triage, dedupe, redact, and verify evidence
- publishing creates a standardized public case page
- public pages aggregate findings by reporter, dataset, vendor, skill, and model

Users do **not** upload a skill for the platform to audit. They upload an already-audited **vulnerability report** plus supporting artifacts.

## What Ships In This MVP

- Public area
  - home dashboard
  - published findings index
  - finding detail pages
  - leaderboards
  - dataset rollups
  - model rollups
- Submission area
  - authenticated draft creation
  - structured report form
  - artifact uploads
  - draft save and submit-for-review flow
  - reporter status pages for submitted reports
- Review area
  - reviewer queue
  - duplicate suggestions
  - artifact previews
  - redaction flags
  - reviewer verification
  - publish and unpublish controls
- Worker
  - parses artifact bundles
  - suggests duplicates
  - rebuilds public case payloads
  - refreshes aggregate snapshots

## Current Runtime Model

The repository is split into two layers:

- **schema-ready layer**: Prisma schema for a future Postgres-backed deployment
- **demo runtime layer**: file-backed state in `var/community-state.json`

That means:

- the app is runnable locally without standing up Postgres first
- the core community flows already work end-to-end
- the Prisma schema and job model are already defined for later persistence migration

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS 4
- NextAuth with GitHub OAuth
- Prisma schema for Postgres
- local file storage for MVP uploads
- Python worker for queued job processing

## Key Routes

- `/`
- `/findings`
- `/findings/[slug]`
- `/leaderboards`
- `/datasets`
- `/models`
- `/submit`
- `/reports`
- `/reports/[id]`
- `/review`
- `/review/[id]`

## API Surface

- `POST /api/findings`
- `POST /api/findings/:id/submit`
- `POST /api/findings/:id/uploads`
- `GET /api/review/findings`
- `POST /api/review/findings/:id/status`
- `POST /api/review/findings/:id/publish`
- `POST /api/review/findings/:id/unpublish`
- `GET /api/public/findings`
- `GET /api/public/findings/:slug`
- `GET /api/public/leaderboards`
- `GET /api/public/datasets`
- `GET /api/public/models`

## Roles

- `reporter`
  - create and edit drafts
  - upload artifacts
  - submit reports
  - view their own report status
- `reviewer`
  - triage reports
  - set duplicate and redaction states
  - verify and publish
- `admin`
  - same as reviewer in this MVP

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Copy env template

```bash
cp .env.example .env.local
```

3. Optional: configure GitHub OAuth

- `GITHUB_ID`
- `GITHUB_SECRET`
- `NEXTAUTH_SECRET`
- `ADMIN_GITHUB_LOGINS`
- `REVIEWER_GITHUB_LOGINS`

If you skip that, the app uses demo auth by default.

4. Start the web app

```bash
npm run dev
```

5. In another terminal, start the worker

```bash
npm run worker
```

6. Open `http://localhost:3000`

## Environment Variables

Core:

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GITHUB_ID`
- `GITHUB_SECRET`
- `ADMIN_GITHUB_LOGINS`
- `REVIEWER_GITHUB_LOGINS`

Storage:

- `LOCAL_STORAGE_ROOT`
- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`

Worker:

- `WORKER_POLL_SECONDS`
- `WORKER_NAME`

Demo:

- `DEMO_AUTH`
- `DEMO_ROLE`
- `DEMO_NAME`
- `DEMO_LOGIN`

## Worker Behavior

The worker reads queued jobs from `var/community-state.json`.

Supported job types:

- `parse_artifact_bundle`
- `suggest_duplicates`
- `build_public_case_payload`
- `refresh_public_aggregates`

Run once:

```bash
python3 worker/main.py --once
```

## Artifact Conventions

The upload parser understands these common SkillAtlas artifacts:

- `analysis.json`
- `attack.json`
- `judge.json`
- `judge_evidence.json`
- `judge_path_delta.json`
- `judge_decision_trace.json`
- `stdout.txt`
- `stderr.txt`
- `file_changes.json`
- `summary.md`
- `summary.pdf`

The worker and upload parser try to extract:

- verdict
- confidence
- smoking gun
- failure reason
- skill id
- run id
- target objective

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run prisma:generate
npm run db:push
npm run worker
```

## Notes

- This MVP favors a working local product flow over full production infrastructure.
- Public browsing is open, but submission requires authentication.
- Reviewer verification is evidence-first. No mandatory in-platform rerun is required in v1.
- Incentives, comments, payouts, and social feed mechanics are intentionally out of scope for this first cut.
