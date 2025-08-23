# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---------- run (Node, no Nginx) ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY server.js ./server.js
ENV PORT=80
EXPOSE 80
CMD ["node", "server.js"]
