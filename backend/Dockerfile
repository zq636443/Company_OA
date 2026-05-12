FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/nest-cli.json backend/tsconfig.json backend/tsconfig.build.json ./
COPY backend/prisma ./prisma
COPY backend/src ./src
COPY backend/docker-entrypoint.sh ./docker-entrypoint.sh

RUN npm run build && npx prisma generate

EXPOSE 3001

CMD ["sh", "./docker-entrypoint.sh"]
