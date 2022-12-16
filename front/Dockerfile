FROM node:14-alpine

RUN mkdir /app

COPY package.json /app

WORKDIR /app

RUN yarn

COPY . /app

EXPOSE 8888

ENTRYPOINT node index.js
