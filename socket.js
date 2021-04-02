
class Socket {
  constructor() {
    this.io = null;

  }

  init(io) {
    this.io = io;

    this.connect();

  }
  connect() {
    this.io.on("connection", (socket) => {
      console.log("PUBLIC SOCKET CONNECTION");
    });


  }
}

module.exports = new Socket();

