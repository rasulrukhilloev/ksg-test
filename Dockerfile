FROM node:14-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

FROM node:14-alpine

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package*.json ./

RUN npm install --only=production

CMD ["sh", "-c", "node dist/db/setupDB.js && node dist/server.js"]

EXPOSE 3000