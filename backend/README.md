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

The backend uses MySQL through Prisma. Start a local MySQL instance first, or from the repository root run:

```bash
docker compose up -d mysql
```

Then set `DATABASE_URL` in `backend/.env`. The `setup` script runs Prisma Client generation, pushes the schema to MySQL, and seeds demo data.
