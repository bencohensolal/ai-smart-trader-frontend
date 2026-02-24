# Railway Node.js static frontend Dockerfile for Vite build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve static files with nginx
FROM nginx:1.25-alpine
COPY scripts/10-prepare-api-url.envsh /docker-entrypoint.d/10-prepare-api-url.envsh
RUN chmod +x /docker-entrypoint.d/10-prepare-api-url.envsh
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]
