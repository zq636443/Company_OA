# Company OA Backend

NestJS backend for the Enterprise WeCom OA workflow MVP.

## Local Start

```bash
cd backend
npm install
cp .env.example .env
npm run setup
npm run dev
```

API base URL:

```text
http://127.0.0.1:3001/api
```

Swagger docs:

```text
http://127.0.0.1:3001/docs
```

## Current Modules

- `templates`: workflow template CRUD and publish/draft status
- `workflows`: workflow instance creation, detail, node actions
- `notifications`: records notification intents, ready for WeCom message push
- `wecom`: enterprise WeChat config placeholder
- `ai`: AI provider placeholder for future template generation, summaries, risk checks

Local development uses SQLite to keep the project runnable without extra services. The `setup` script initializes SQLite tables with `prisma/init.sql` and then seeds data through Prisma Client. Production should switch Prisma datasource to PostgreSQL and use Prisma migrations plus Redis-backed queues for notifications and AI jobs.
