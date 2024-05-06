FROM node:18-alpine as build-env
RUN apk update
RUN apk upgrade

WORKDIR /usr/app
COPY package*.json ./
RUN npm install --no-fund --no-audit
COPY . .
RUN npm run build && npm prune --production
EXPOSE 3000
FROM gcr.io/distroless/nodejs18-debian11
WORKDIR /usr/app
COPY --from=build-env /usr/app/dist /usr/app/dist
COPY --from=build-env /usr/app/node_modules ./node_modules
CMD ["dist/server.js"]
