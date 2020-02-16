# Builder container
FROM node:12-slim AS builder
WORKDIR /opt/app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npx webpack -p


# Build prod container
FROM node:12-slim
ENV NODE_ENV=production
ENV TZ="Europe/Helsinki"
WORKDIR /opt/app

COPY package.json package-lock.json ./
RUN npm install

COPY --from=builder /opt/app/public ./public
COPY server ./server

RUN mkdir -p /opt/app/logs && chown node /opt/app/logs

CMD ["node", "./server/app.js"]

USER node

EXPOSE 8005/tcp