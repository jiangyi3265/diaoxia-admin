FROM node:22-alpine AS builder
WORKDIR /source
COPY package.json package-lock.json ./
RUN npm ci --registry=https://registry.npmjs.org
COPY . .
RUN npm run build:prod

FROM nginx:1.30.3-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/proxy.conf /etc/nginx/proxy.conf
COPY --from=builder /source/dist /usr/share/nginx/html
EXPOSE 80
