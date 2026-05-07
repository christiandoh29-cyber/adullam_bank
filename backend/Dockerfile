FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS builder
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
COPY prisma ./prisma

# Générer le client Prisma avec debug
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN ls -la node_modules/.prisma/client/
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production

# Copier les dépendances depuis le builder (pas deps séparé)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 3998
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/index.js"]
