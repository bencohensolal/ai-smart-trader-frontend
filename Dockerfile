# Railway Node.js static frontend Dockerfile for Vite build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve static files with nginx
FROM nginx:1.25-alpine
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/../dist/public /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]
