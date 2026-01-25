FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:alpine

# nginx envsubst support (already included, but explicit is fine)
RUN apk add --no-cache gettext

# Template instead of static config
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Static files
COPY --from=build /app/dist /usr/share/nginx/html

# Entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
