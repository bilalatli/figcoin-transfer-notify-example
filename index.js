const express = require("express");
require("dotenv").config();
const http = require("http");
const WebSocket = require("ws");
const app = express();

const axios = require("axios");
const { response } = require("express");

//TYPE 3 - SOCKET

//Default
app.get("*", (req, res) => {
  res.status(201).json("Hello From FIG Notifier - v0.0.0.1");
});

//Start
const DEFAULT_PORT = Number(process.env.PORT || 5110);
const NOTIFY_URL = process.env.NOTIFY_URL;

app.listen(DEFAULT_PORT, () => {
  console.log(`listening on ${DEFAULT_PORT}`);
});

const ws = new WebSocket(`${process.env.SOCKET_URL}`, {
  perMessageDeflate: false,
});

ws.on("open", (data) => {
  console.log("CONNECT");
  console.log(data, "DATA OPENN");
});

ws.on("message", (msg) => {
  console.log("New Transaction");
  msg = JSON.parse(msg);

  if (msg.type === 2) {
    const data = JSON.parse(msg.data);
    msgChecker(data[0]);
  }
});

const msgChecker = async (transaction) => {
  const { hash } = transaction;
  let nonce = Math.floor(Math.random() * 1000000);

  if (transaction.data.length < 2) {
    console.log("There is no transaction in the block.");

    const response = await axios.post(`${NOTIFY_URL}`, {
      txId: null,
      receiver: null,
      sender: null,
      hash,
      amount: 1,
      nonce,
    });

    if (response.data.status === true) {
      console.log(response.data.message);
    }
    if (response.data.status === false) {
      console.log(response.data.message);
    }
  } else {
    const { receiver, sender, id, amount } = transaction.data[1];

    const response = await axios.post(`${NOTIFY_URL}`, {
      txId: id,
      receiver,
      sender,
      hash,
      amount,
      nonce,
    });

    if (response.data.status === true) {
      console.log(response.data.message);
    }
    if (response.data.status === false) {
      console.log(response.data.message);
    }
  }
};
