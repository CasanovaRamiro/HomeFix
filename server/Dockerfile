FROM node:22-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

WORKDIR /app

COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm build

EXPOSE 3000
CMD ["node", "dist/index.js"]
