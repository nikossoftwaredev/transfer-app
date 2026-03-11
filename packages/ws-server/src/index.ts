import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import { verifyToken } from "./auth.js";
import { handleGps } from "./handlers/gps.js";

const PORT = parseInt(process.env.WS_PORT || "3001", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

// Redis adapter for multi-instance support
const pubClient = new Redis(REDIS_URL);
const subClient = pubClient.duplicate();
const redisClient = new Redis(REDIS_URL);

Promise.all([
  new Promise<void>((resolve) => pubClient.on("connect", resolve)),
  new Promise<void>((resolve) => subClient.on("connect", resolve)),
])
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Redis adapter connected");
  })
  .catch((err) => {
    console.warn("Redis not available, running without adapter:", err.message);
  });

// JWT authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const payload = verifyToken(token);
    socket.data.userId = payload.id;
    socket.data.role = payload.role;
    socket.data.driverId = payload.driverId;
    socket.data.orgId = payload.orgId;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const { userId, role, driverId } = socket.data;
  console.log(`Connected: ${userId} (${role})`);

  // Driver joins their own room for GPS broadcasting
  if (role === "driver" && driverId) {
    socket.join(`driver:${driverId}`);

    // GPS handler
    socket.on("gps", (data) => handleGps(socket, redisClient, data));

    socket.on("disconnect", () => {
      console.log(`Driver disconnected: ${driverId}`);
    });
  }

  // Dashboard subscriptions
  if (role === "orgadmin" || role === "superadmin") {
    socket.on("subscribe:drivers", (driverIds: string[]) => {
      driverIds.forEach((id) => socket.join(`driver:${id}`));
    });

    socket.on("unsubscribe:drivers", (driverIds: string[]) => {
      driverIds.forEach((id) => socket.leave(`driver:${id}`));
    });
  }

  // Client tracking subscription
  if (role === "client") {
    socket.on("subscribe:trip", (tripDriverId: string) => {
      socket.join(`driver:${tripDriverId}`);
    });
  }
});

httpServer.listen(PORT, () => {
  console.log(`WS server running on port ${PORT}`);
});

export { io, redisClient };
