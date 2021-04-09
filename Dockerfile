
FROM node:12

RUN npm install pm2 -g
ENV PM2_PUBLIC_KEY dz5rlwgbn3w9eo7
ENV PM2_SECRET_KEY 9z3144tyxvf6mlk

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["pm2-runtime", "index.js"]