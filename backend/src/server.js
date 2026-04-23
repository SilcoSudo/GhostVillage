import app from "./app.js";
import { connectDB } from "./config/db.js";
import { config } from "./config/env.js";
import http from "http";
import { Server } from "socket.io";
import { authenticateSocket } from "./middlewares/auth.middleware.js";
import { startNotificationCleanup } from "./modules/forum/notifications/notificationCleanup.js";
import {
  getOnlineUserIds,
  markUserOffline,
  markUserOnline,
} from "./services/presenceService.js";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.cors.origin || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware Socket.IO - Authenticate user
io.use(authenticateSocket);

// Socket.IO connection handlers
io.on("connection", (socket) => {
  const userId = socket.userId;
  const normalizedUserId = String(userId);
  console.log(`✓ User ${userId} connected (Socket ID: ${socket.id})`);

  // Join user to personal room
  socket.join(`user:${userId}`);
  socket.join(`user_${userId}`); // Alternative room format

  const presence = markUserOnline(userId);

  if (presence.becameOnline) {
    io.emit("user:presence", {
      userId: normalizedUserId,
      isOnline: true,
    });
  }

  socket.emit("presence:snapshot", {
    onlineUserIds: getOnlineUserIds(),
  });

  // Handle user joining their room (for receiving messages)
  socket.on("join:user", ({ userId: userIdToJoin }) => {
    socket.join(`user_${userIdToJoin}`);
    console.log(`✓ User ${userId} joined room user_${userIdToJoin}`);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`✗ User ${userId} disconnected`);

    const updatedPresence = markUserOffline(userId);

    if (updatedPresence.becameOffline) {
      io.emit("user:presence", {
        userId: normalizedUserId,
        isOnline: false,
      });
    }
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error(`Socket error for user ${userId}:`, error);
  });
});

// Attach io to app for use in controllers
app.set("io", io);

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start notification cleanup job (15-day auto-delete)
    startNotificationCleanup();

    // Start server with Socket.IO
    server.listen(config.port, () => {
      console.log(`✓ Server running on port ${config.port}`);
      console.log(`✓ Server started at http://localhost:${config.port}`);
      console.log(`✓ Socket.IO enabled`);
    });
  } catch (error) {
    console.error(" Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(" Unhandled Rejection:", err);
  if (config.nodeEnv === "production") {
    process.exit(1);
  }
});

process.on("SIGINT", () => {
  console.log("✓ Server shutting down...");
  process.exit(0);
});
