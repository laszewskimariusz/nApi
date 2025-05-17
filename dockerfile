# === Base stage ===
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# === Build stage ===
FROM base AS builder
COPY . .
RUN npm run build

# === Production stage ===
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
COPY --from=builder /app ./

EXPOSE 3000
CMD ["npm", "start"]
