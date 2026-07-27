FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /repo

RUN corepack enable

COPY package.json .
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY turbo.json .

COPY packages ./packages
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile

RUN pnpm --filter web build

EXPOSE 3000

CMD ["pnpm","--filter","web","start"]
