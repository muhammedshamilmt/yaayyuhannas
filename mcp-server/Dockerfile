# Multi-stage production Dockerfile for Render / Railway / Cloud
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
COPY public ./public
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY public ./public

# Default port (Render overrides with PORT=10000)
EXPOSE 3001

CMD ["node", "dist/index.js"]
