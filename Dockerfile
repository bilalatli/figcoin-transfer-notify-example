FROM node:14.15.4-alpine as builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --silent
COPY . .

CMD ["node", "index.js"]