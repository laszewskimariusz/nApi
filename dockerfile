# --- Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

# --- Production image
FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
