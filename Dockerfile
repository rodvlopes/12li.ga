FROM node:16-alpine

WORKDIR /app

COPY package.* ./

RUN npm install

CMD node server.js
