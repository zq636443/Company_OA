# Company OA Docs

## Project Layout

- `frontend/`: React H5 app for the mobile OA workflow UI.
- `backend/`: NestJS API service with Prisma and SQLite for the current MVP.
- `docs/`: deployment and project notes.
- `docker-compose.yml`: one-command deployment entry for the frontend and backend.

## Local Development

Run the frontend from the repository root:

```bash
npm run frontend:dev
```

Run the backend from the repository root:

```bash
npm run backend:setup
npm run backend:dev
```

The backend listens on `http://127.0.0.1:3001/api` by default. Swagger is available at `http://127.0.0.1:3001/docs`.

## Docker Deployment

Before deploying, create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env` with the production WeCom values, OAuth callback domain, and any other backend settings.

Start the stack:

```bash
docker compose up -d --build
```

The frontend is exposed on port `8080`, and Nginx proxies `/api` requests to the backend service.
