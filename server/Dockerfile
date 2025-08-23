# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- run ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# install only production deps
COPY package*.json ./
RUN npm ci --omit=dev
# copy compiled JS
COPY --from=build /app/dist ./dist
# default port
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/index.js"]
