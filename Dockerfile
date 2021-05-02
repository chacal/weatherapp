# Builder container
FROM node:14-slim AS builder
WORKDIR /opt/app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npx webpack --mode production


# Build prod container
FROM node:14-slim
ENV NODE_ENV=production
ENV TZ="Europe/Helsinki"
WORKDIR /opt/app

COPY package.json package-lock.json ./
RUN npm install

COPY --from=builder /opt/app/public ./public
COPY server ./server

CMD ["node", "./server/app.js"]

USER node

EXPOSE 8005/tcp