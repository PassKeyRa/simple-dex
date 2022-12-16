const express = require('express');
const app = express();

const SERVER_PORT   = process.env.SERVER_PORT || 8888;
const SERVER_ADDR   = process.env.SERVER_ADDR || '127.0.0.1';

app.use("/", express.static(__dirname + "/public"));

app.listen(SERVER_PORT, SERVER_ADDR, () => {
  console.log(`Listening on ${SERVER_ADDR}:${SERVER_PORT}`);
});
