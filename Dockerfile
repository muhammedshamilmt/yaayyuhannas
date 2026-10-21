# Root Dockerfile for Render / Cloud deployment
FROM node:22-alpine AS builder

WORKDIR /app

# Copy mcp-server dependencies and build files
COPY mcp-server/package*.json mcp-server/tsconfig.json ./
RUN npm ci

COPY mcp-server/src ./src
COPY mcp-server/public ./public
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY mcp-server/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY mcp-server/public ./public

# Default port (Render automatically overrides with PORT=10000)
EXPOSE 3001

CMD ["node", "dist/index.js"]
