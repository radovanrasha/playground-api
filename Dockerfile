# syntax=docker/dockerfile:1

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

# Install deps separately so this layer is cached unless package*.json change.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# Run as the non-root user that ships with the node image.
USER node

# server.js listens on PORT (default 3007).
EXPOSE 3007
CMD ["node", "server.js"]
