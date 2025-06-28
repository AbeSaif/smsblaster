const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config/config");
const logger = require("./config/logger");
const port = config.port || 5000;
const {ReminderSocket} = require("./models")
let server;
// let sslServer;
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info("Connected to MongoDB");
});

server = app.listen(port, "0.0.0.0", () => {
  logger.info(`Listening on port ${port}`);
});

const io = require('socket.io')(server, {
  cors: {
      //origin: "https://dev.zeitblast.com/",
      origin:"https://dev.zeitblast.com/",
      methods: ["GET", "POST"],
      allowedHeaders: "*",
      credentials: true
  }
});


const userSocketMap = new Map();

io.on('connection', (socket) => {
    socket.on('register', userId => {
        userSocketMap.set(userId, socket.id);
        console.log("New connection",userId);
        socket.on('disconnect', () => {
            userSocketMap.delete(userId);
        });
    });
});

global.io = io;
global.userSocketMap = userSocketMap;
const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  if (server) {
    server.close();
  }
});