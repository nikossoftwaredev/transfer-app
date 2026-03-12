import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import { verifyToken } from "./auth.js";
import { handleGps } from "./handlers/gps.js";
import { setupBookingEmitter } from "./handlers/bookings.js";

const PORT = parseInt(process.env.WS_PORT || "3001", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
const INTERNAL_SECRET = process.env.CRON_SECRET || "dev-secret";

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

// Booking event emitter
const bookingEmitter = setupBookingEmitter(io);

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

  // Driver joins their own room for GPS + vehicle class room for bookings
  if (role === "driver" && driverId) {
    socket.join(`driver:${driverId}`);

    socket.on("driver:register", (data: { vehicleClassId: string }) => {
      if (data.vehicleClassId) {
        socket.join(`booking:drivers:${data.vehicleClassId}`);
        console.log(`Driver ${driverId} joined booking:drivers:${data.vehicleClassId}`);
      }
    });

    socket.on("gps", (data) => handleGps(socket, redisClient, data));

    socket.on("disconnect", () => {
      console.log(`Driver disconnected: ${driverId}`);
    });
  }

  // Client subscribes to their booking's room
  if (role === "client") {
    socket.on("subscribe:booking", (bookingId: string) => {
      socket.join(`booking:${bookingId}`);
      console.log(`Client ${userId} subscribed to booking:${bookingId}`);
    });

    socket.on("subscribe:trip", (tripDriverId: string) => {
      socket.join(`driver:${tripDriverId}`);
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
});

// ─── Internal HTTP API for web app to emit events ──────────────────
const originalListeners = httpServer.listeners("request").slice();
httpServer.removeAllListeners("request");

httpServer.on("request", (req, res) => {
  if (req.method === "POST" && req.url === "/emit") {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${INTERNAL_SECRET}`) {
      res.writeHead(401);
      res.end("Unauthorized");
      return;
    }

    let body = "";
    req.on("data", (chunk: string) => (body += chunk));
    req.on("end", () => {
      try {
        const { event, data } = JSON.parse(body);

        switch (event) {
          case "booking:new":
            bookingEmitter.emitNewBooking(data);
            break;
          case "booking:accepted":
            bookingEmitter.emitBookingAccepted(data);
            break;
          case "booking:timed_out":
            bookingEmitter.emitBookingTimedOut(data.bookingId);
            break;
          case "booking:cancelled":
            bookingEmitter.emitBookingCancelled(data);
            break;
          default:
            res.writeHead(400);
            res.end(`Unknown event: ${event}`);
            return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400);
        res.end("Invalid JSON");
      }
    });
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    res.end("ok");
    return;
  }

  for (const listener of originalListeners) {
    (listener as Function).call(httpServer, req, res);
  }
});

httpServer.listen(PORT, () => {
  console.log(`WS server running on port ${PORT}`);
});

export { io, redisClient };
