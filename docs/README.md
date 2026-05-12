# Company OA Docs

## Project Layout

- `frontend/`: React H5 app for the mobile OA workflow UI.
- `backend/`: NestJS API service with Prisma and MySQL.
- `docs/`: deployment and project notes.
- `docker-compose.yml`: one-command deployment entry for the frontend and backend.

## Local Development

Run the frontend from the repository root:

```bash
npm run frontend:dev
```

Run the backend from the repository root:

```bash
docker compose up -d mysql
npm run backend:setup
npm run backend:dev
```

The backend listens on `http://127.0.0.1:3001/api` by default. Swagger is available at `http://127.0.0.1:3001/docs`.

## Docker Deployment

Before deploying, create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env` with the production WeCom values, OAuth callback domain, and any other backend settings. The default database URL points to MySQL:

```text
mysql://company_oa:company_oa_password@127.0.0.1:3307/company_oa
```

Start the stack:

```bash
docker compose up -d --build
```

The stack starts MySQL, the NestJS backend, and the frontend. The frontend is exposed on port `8081`, and Nginx proxies `/api` requests to the backend service.

MySQL is bound to `127.0.0.1:3307` for local backend development and is not exposed on public interfaces by default.
