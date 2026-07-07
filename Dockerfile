# Stage 1: build the React frontend
FROM node:22-slim AS frontend
RUN npm install -g pnpm
WORKDIR /app/client
COPY client/package.json client/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY client/ .

ARG VITE_API_URL=""
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_AUTH0_AUDIENCE
ARG VITE_AUTH0_CALLBACK_URL

ENV VITE_API_URL=$VITE_API_URL \
    VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN \
    VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID \
    VITE_AUTH0_AUDIENCE=$VITE_AUTH0_AUDIENCE \
    VITE_AUTH0_CALLBACK_URL=$VITE_AUTH0_CALLBACK_URL

RUN pnpm build

# Stage 2: build the backend and embed the frontend
FROM node:22-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm
WORKDIR /app/server
COPY server/package.json server/pnpm-lock.yaml ./
COPY server/prisma ./prisma
RUN pnpm install --frozen-lockfile
COPY server/ .
RUN pnpm build
COPY --from=frontend /app/client/dist ./public

EXPOSE 3000
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/index.js"]
