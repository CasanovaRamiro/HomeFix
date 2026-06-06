FROM node:22-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm build

EXPOSE 3000
CMD ["node", "dist/index.js"]
