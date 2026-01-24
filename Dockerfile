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
