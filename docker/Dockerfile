FROM node:24-slim AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:24-slim AS server-deps
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev

FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app/server
COPY --from=server-deps /app/server/node_modules ./node_modules
COPY server/ ./
COPY --from=client-build /app/client/dist ./public
RUN mkdir -p data && chown -R node:node /app/server
USER node
EXPOSE 3000
CMD ["npm", "start"]
