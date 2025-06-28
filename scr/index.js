const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config/config");
const logger = require("./config/logger");
const redis = require('redis');
const { createAdapter } = require("@socket.io/redis-adapter");
const http = require("http");
const port = config.port || 5000;
const { directImportController } = require("./controllers");
// Create Redis clients for subscribing and publishing
const redisPublisher = redis.createClient({
    url: `redis://${process.env.redis_host}:11042`,
    password: process.env.redis_pass
});
const redisSubscriber = redisPublisher.duplicate();

const adapterPublisher = redis.createClient({
    url: `redis://${process.env.redis_host}:11042`,
    password: process.env.redis_pass
});
const adapterSubscriber = adapterPublisher.duplicate();
// MongoDB Connection
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
    logger.info("Connected to MongoDB");
}).catch(err => {
    logger.error("MongoDB connection error:", err);
    process.exit(1);
});

// Initialize Redis clients and set up the server
async function initialize() {
    try {
        await redisPublisher.connect();
        console.log('Redis publisher client connected');

        await redisSubscriber.connect();
        console.log('Redis subscriber client connected');

        await adapterPublisher.connect();
        console.log('Redis publisher client connected');

        await adapterSubscriber.connect();
        console.log('Redis subscriber client connected');

        const server = http.createServer(app);
        const io = require('socket.io')(server, {
            cors: {
                origin: "https://dev.zeitblast.com/",
                methods: ["GET", "POST"],
                //allowedHeaders: "*",
                'Access-Control-Allow-Origin': '*',
                credentials: true
            }
        });

        const userSocketMap = new Map();

        io.on('connection', (socket) => {
            socket.on('register', userId => {
                userSocketMap.set(userId, socket.id);
                console.log("New connection", userId);
                socket.on('disconnect', () => {
                    userSocketMap.delete(userId);
                });
            });
        });

      
        
        const listener = (message, channel) => {
            console.log(`Received message from channel ${channel}: ${message}`);
            // Log the raw message
            console.log("Raw message:", message);
            message = JSON.parse(message);
            const socketId = userSocketMap.get(String(message.userId));
            if (process.env.NODE_APP_INSTANCE === '0') {
                console.log("Emitting message from master instance",message.data);
                //io.to(socketId).emit("new-message", message.data);
                io.emit('new-message', message.data);
            }
            // Emit the message
            //io.emit('new-message', message);
        };
        await redisSubscriber.subscribe('socket-channel',listener);
        //await redisPublisher.publish('socket-channel',"message");

        const listener1 = async (message, channel) => {
            console.log(`Received message from channel ${channel}: ${message}`);

            if (process.env.NODE_APP_INSTANCE === '0') {
                console.log("Emitting message from master instance",message);
                let fileimported = await directImportController.processFileQue(message);
                console.log("fileimported",fileimported);
            }
        };
        await redisSubscriber.subscribe('file-process',listener1);

        const listenerComplete = async(message, channel) => {
            console.log(`Received message from channel ${channel}: ${message}`);

            if (process.env.NODE_APP_INSTANCE === '0') {
                console.log("Emitting message from master instance",message);
                //io.to(socketId).emit("new-message", message.data);
                io.emit('file-complete', message);
            }
            // Emit the message
            //io.emit('new-message', message);
        };
        await redisSubscriber.subscribe('file-complete',listenerComplete);



        global.redisPublisher = redisPublisher;
        
        io.adapter(createAdapter(adapterSubscriber, adapterPublisher));
        
        server.listen(port, () => {
            logger.info(`Listening on port ${port}`);
        });

        // Handle graceful shutdown
        const exitHandler = () => {
            server.close(() => {
                logger.info("Server closed");
                mongoose.disconnect();
                redisPublisher.quit();
                redisSubscriber.quit();
                process.exit(1);
            });
        };

        process.on("uncaughtException", exitHandler);
        process.on("unhandledRejection", exitHandler);
        process.on("SIGTERM", exitHandler);
        process.on("SIGINT", exitHandler);

        // Expose io and userSocketMap globally if necessary
        global.io = io;
        global.userSocketMap = userSocketMap;
        

    } catch (err) {
        logger.error('Server initialization error:', err);
        process.exit(1);
    }
}

initialize();
