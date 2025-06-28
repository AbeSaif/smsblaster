const cluster = require("cluster");
const http = require("http");
const { Server } = require("socket.io");
const numCPUs = require("os").cpus().length;
const { setupMaster, setupWorker } = require("@socket.io/sticky");
const { createAdapter, setupPrimary } = require("@socket.io/cluster-adapter");

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  const httpServer = http.createServer();

  // setup sticky sessions
  setupMaster(httpServer, {
    loadBalancingMethod: "least-connection",
  });

  // setup connections between the workers
  setupPrimary();

  // needed for packets containing buffers (you can ignore it if you only send plaintext objects)
  // Node.js < 16.0.0
  cluster.setupMaster({
    serialization: "advanced",
  });
  // Node.js > 16.0.0
  // cluster.setupPrimary({
  //   serialization: "advanced",
  // });

  httpServer.listen(3000);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  console.log(`Worker ${process.pid} started`);
  
  mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
    logger.info("Connected to MongoDB");
  }).catch(err => {
    logger.error("MongoDB connection error:", err);
    process.exit(1);
  });


  const httpServer = http.createServer();
  const io = new Server(httpServer);

  // use the cluster adapter
  io.adapter(createAdapter());

  // setup connection with the primary process
  setupWorker(io);

  const userSocketMap = new Map();

   io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id); // Log socket connection

    socket.on("register", (userId) => {
        console.log("Register event received for user:", userId); // Log register event and userId

        if (socket && socket.id) {
        console.log("Socket and socket.id are defined"); // Log socket and socket.id status

        userSocketMap.set(userId, socket.id);
        console.log("New connection", userId);

        const storedSocketId = userSocketMap.get(userId);
        if (storedSocketId === socket.id) {
            console.log(`Successfully set socket.id for user ${userId}`);
        } else {
            console.error(`Failed to set socket.id for user ${userId}`);
        }

        socket.on("disconnect", () => {
            userSocketMap.delete(userId);
            console.log("User disconnected:", userId); // Log user disconnection
        });
        } else {
        // Handle error or log a message if socket or socket.id is undefined
        console.error("Socket or socket.id is undefined");
        }
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id); // Log socket disconnection
    });
    });
    global.io = io;
    global.userSocketMap = userSocketMap;

}