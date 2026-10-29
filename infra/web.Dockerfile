FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
# Keep host node_modules (including Windows native binaries) out of this layer.
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
COPY public ./public
RUN npm run build
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN printf 'server { listen 80; root /usr/share/nginx/html; client_max_body_size 22m; location /v1/ { proxy_pass http://api:8000; proxy_buffering off; proxy_read_timeout 3600s; } location /health { proxy_pass http://api:8000; } location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
