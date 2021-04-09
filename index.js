const express = require("express");
require("dotenv").config();
const http = require("http");
const WebSocket = require("ws");
const app = express();

const axios = require("axios");
const {response} = require("express");
let ws = null;

const RECONNECT_DELAY = 5;
const DEFAULT_PORT = Number(process.env.PORT || 5110);
const NOTIFY_URL = process.env.NOTIFY_URL || null;
const SOCKET_URL = process.env.SOCKET_URL || null;

app.get("*", (req, res) => {
    res.status(201).json("Hello From FIG Notifier - v0.0.0.1");
});

const httpServer = app.listen(DEFAULT_PORT, () => {
    console.log(`listening on ${DEFAULT_PORT}`);
});

function initializeSocketConnection() {
    if (SOCKET_URL === null) {
        httpServer.close();
        throw new Error(`Socket connection url is not defined. Closing application`);
    }
    ws = new WebSocket(`${process.env.SOCKET_URL}`, {
        perMessageDeflate: false
    });

    setEventListeners();
    heartBeat();
}

function setEventListeners() {
    if (ws === null || ws.isConnected === false) {
        console.warn(`Socket is not connected or initialized`);
    }
    ws.on("open", (data) => {
        console.log(`SOCKET: Connection established`);
        if (data !== null && data !== '' && typeof data !== 'undefined') {
            console.log(`Welcome Data : ${data}`);
        }
    });
    ws.on("message", (msg) => {
        msg = JSON.parse(msg);
        if (typeof msg.type !== 'undefined' && typeof msg.data !== 'undefined' && msg.type === 2) {
            const data = JSON.parse(msg.data);
            const blockNumber = data[0].index;
            console.log(`-------------------------------------------------`);
            console.log(`Reading ${blockNumber} block for new transactions`);
            msgChecker(data[0]);
        }
    });
    ws.on("close", () => {
        onSocketError();
    });
    ws.on("error", (error) => {
        console.log(`Socket error: ${error}`);
        onSocketError();
    });
}

function heartBeat() {
    if (ws === null || ws.readyState !== 1) {
        return;
    }
    // console.log(`  # Socket heartbeat was sent`);
    ws.send(`heartbeat`);
    setTimeout(heartBeat, 500);
}

function onSocketError() {
    console.warn(`Socket connection is disconnected. Trying to reconnect after ${RECONNECT_DELAY} second...`);
    ws.close();
    ws = null;
    setTimeout(function () {
        initializeSocketConnection();
    }, RECONNECT_DELAY * 1000);
}

const msgChecker = async (transaction) => {
    const {hash, index} = transaction;
    let nonce = Math.floor(Math.random() * 1000000);

    if (transaction.data.length < 2) {
        console.log(`${index} Transaction not found in current block`);
        notify(index, {txId: null, receiver: null, sender: null, hash: hash, amount: 1, nonce: nonce});
    } else {
        const {receiver, sender, id, amount} = transaction.data[1];
        notify(index, {txId: id, receiver: receiver, sender: sender, hash: hash, amount: amount, nonce: nonce});
    }
};

async function notify(blockNumber, transaction) {
    // Return if notify url is not defined
    if (NOTIFY_URL === null) {
        return;
    }
    await axios.post(NOTIFY_URL, transaction)
        .then(response => {
            if (typeof response.data.status !== 'undefined') {
                if (!!response.data.status === true) {
                    console.log(`Notification completed. Answer from server : ${response.data.status}`);
                } else {
                    console.warn(`Notification is not completed : ${response.data.message || ''}`);
                }
            }
        })
        .catch(reason => {
            console.warn(`  > Notification failed. Reason is ${reason}`);
        });
}

initializeSocketConnection();