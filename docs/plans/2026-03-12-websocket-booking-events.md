# WebSocket Booking Events Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace polling with real-time Socket.IO events for booking flow (new ride requests → driver dashboard, driver acceptance → client finding-driver screen).

**Architecture:** The ws-server already handles Socket.IO with JWT auth and Redis adapter. We add booking event handlers to ws-server, a thin HTTP endpoint the Next.js server actions call to emit events, and socket.io-client hooks in the web app. The web app server actions POST to ws-server's internal API to trigger events. Clients subscribe via rooms.

**Tech Stack:** Socket.IO (existing ws-server), socket.io-client (new in web), existing JWT/NextAuth, Redis pub/sub (existing)

---

## Room Strategy

- `booking:drivers:<vehicleClassId>` — all online drivers of a vehicle class listen here for new ride requests
- `booking:<bookingId>` — the client who created the booking listens here for status updates (driver_assigned, timed_out, cancelled)
- Drivers join their vehicle class room on connect. Clients join booking room after creating a booking.

## Event Types

| Event | Direction | Room | Payload |
|-------|-----------|------|---------|
| `booking:new` | server→drivers | `booking:drivers:<vcId>` | `{ bookingId, pickupAddress, dropoffAddress, scheduledAt, passengerCount, estimatedFareMin, estimatedFareMax, estimatedDistanceKm, vehicleClassName, clientName }` |
| `booking:accepted` | server→client | `booking:<bookingId>` | `{ bookingId, driverName, plate, vehicleClassName }` |
| `booking:cancelled` | server→drivers | `booking:drivers:<vcId>` | `{ bookingId }` |
| `booking:timed_out` | server→client | `booking:<bookingId>` | `{ bookingId }` |

---

### Task 1: Add socket.io-client to web package

**Files:**
- Modify: `packages/web/package.json`

**Step 1: Install socket.io-client**

Run: `cd packages/web && pnpm add socket.io-client`

**Step 2: Verify installation**

Run: `cd packages/web && pnpm ls socket.io-client`
Expected: Shows socket.io-client version

**Step 3: Commit**

```bash
git add packages/web/package.json pnpm-lock.yaml
git commit -m "chore: add socket.io-client to web package"
```

---

### Task 2: Add shared event types to shared package

**Files:**
- Modify: `packages/shared/src/types/index.ts`
- Modify: `packages/shared/src/index.ts` (no change needed, already re-exports)

**Step 1: Add booking event types**

Append to `packages/shared/src/types/index.ts`:

```typescript
// ─── WebSocket Booking Events ────────────────────────────────────

export interface WsNewBookingPayload {
  bookingId: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledAt: string;
  passengerCount: number;
  estimatedFareMin: number | null;
  estimatedFareMax: number | null;
  estimatedDistanceKm: number | null;
  vehicleClassName: string;
  clientName: string;
}

export interface WsBookingAcceptedPayload {
  bookingId: string;
  driverName: string;
  plate: string;
  vehicleClassName: string;
}

export interface WsBookingRemovedPayload {
  bookingId: string;
}
```

**Step 2: Commit**

```bash
git add packages/shared/src/types/index.ts
git commit -m "feat: add WebSocket booking event types to shared package"
```

---

### Task 3: Add internal event emission API to ws-server

The Next.js server actions can't import socket.io server directly (different process). We add a simple HTTP endpoint on ws-server that the web app calls to emit events.

**Files:**
- Modify: `packages/ws-server/src/index.ts`
- Create: `packages/ws-server/src/handlers/bookings.ts`

**Step 1: Create booking handler**

Create `packages/ws-server/src/handlers/bookings.ts`:

```typescript
import type { Server } from "socket.io";

interface NewBookingPayload {
  bookingId: string;
  vehicleClassId: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledAt: string;
  passengerCount: number;
  estimatedFareMin: number | null;
  estimatedFareMax: number | null;
  estimatedDistanceKm: number | null;
  vehicleClassName: string;
  clientName: string;
}

interface BookingAcceptedPayload {
  bookingId: string;
  vehicleClassId: string;
  driverName: string;
  plate: string;
  vehicleClassName: string;
}

interface BookingRemovedPayload {
  bookingId: string;
  vehicleClassId: string;
}

export function setupBookingEmitter(io: Server) {
  return {
    emitNewBooking(data: NewBookingPayload) {
      io.to(`booking:drivers:${data.vehicleClassId}`).emit("booking:new", {
        bookingId: data.bookingId,
        pickupAddress: data.pickupAddress,
        dropoffAddress: data.dropoffAddress,
        scheduledAt: data.scheduledAt,
        passengerCount: data.passengerCount,
        estimatedFareMin: data.estimatedFareMin,
        estimatedFareMax: data.estimatedFareMax,
        estimatedDistanceKm: data.estimatedDistanceKm,
        vehicleClassName: data.vehicleClassName,
        clientName: data.clientName,
      });
    },

    emitBookingAccepted(data: BookingAcceptedPayload) {
      // Notify the client waiting on this booking
      io.to(`booking:${data.bookingId}`).emit("booking:accepted", {
        bookingId: data.bookingId,
        driverName: data.driverName,
        plate: data.plate,
        vehicleClassName: data.vehicleClassName,
      });
      // Also tell drivers to remove this booking from their list
      io.to(`booking:drivers:${data.vehicleClassId}`).emit("booking:removed", {
        bookingId: data.bookingId,
      });
    },

    emitBookingTimedOut(bookingId: string) {
      io.to(`booking:${bookingId}`).emit("booking:timed_out", { bookingId });
    },

    emitBookingCancelled(data: BookingRemovedPayload) {
      io.to(`booking:drivers:${data.vehicleClassId}`).emit("booking:removed", {
        bookingId: data.bookingId,
      });
      io.to(`booking:${data.bookingId}`).emit("booking:cancelled", {
        bookingId: data.bookingId,
      });
    },
  };
}
```

**Step 2: Add internal HTTP API + room joins to ws-server index**

Replace `packages/ws-server/src/index.ts` with the updated version that:
1. Adds driver auto-join to `booking:drivers:<vehicleClassId>` room on connect
2. Adds client room join for `booking:<bookingId>` via socket event
3. Adds internal HTTP API (`POST /emit`) for the web app to trigger events

```typescript
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

    // Driver sends their vehicleClassId on connect to join the booking room
    socket.on("driver:register", (data: { vehicleClassId: string }) => {
      if (data.vehicleClassId) {
        socket.join(`booking:drivers:${data.vehicleClassId}`);
        console.log(`Driver ${driverId} joined booking:drivers:${data.vehicleClassId}`);
      }
    });

    // GPS handler
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
// This runs on the same httpServer, handling raw requests before Socket.IO
const originalListeners = httpServer.listeners("request").slice();
httpServer.removeAllListeners("request");

httpServer.on("request", (req, res) => {
  // Internal emit endpoint
  if (req.method === "POST" && req.url === "/emit") {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${INTERNAL_SECRET}`) {
      res.writeHead(401);
      res.end("Unauthorized");
      return;
    }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
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
      } catch (err) {
        res.writeHead(400);
        res.end("Invalid JSON");
      }
    });
    return;
  }

  // Health check
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    res.end("ok");
    return;
  }

  // Pass through to Socket.IO
  for (const listener of originalListeners) {
    (listener as Function).call(httpServer, req, res);
  }
});

httpServer.listen(PORT, () => {
  console.log(`WS server running on port ${PORT}`);
});

export { io, redisClient };
```

**Step 3: Commit**

```bash
git add packages/ws-server/src/handlers/bookings.ts packages/ws-server/src/index.ts
git commit -m "feat: add booking event emission to ws-server with internal HTTP API"
```

---

### Task 4: Create ws-emit utility in web app

A helper the server actions call to notify ws-server of booking events.

**Files:**
- Create: `packages/web/lib/ws/emit.ts`

**Step 1: Create the emit utility**

```typescript
const WS_SERVER_URL = process.env.WS_SERVER_URL || "http://localhost:3001";
const INTERNAL_SECRET = process.env.CRON_SECRET || "dev-secret";

export async function wsEmit(event: string, data: Record<string, unknown>) {
  try {
    await fetch(`${WS_SERVER_URL}/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${INTERNAL_SECRET}`,
      },
      body: JSON.stringify({ event, data }),
    });
  } catch (err) {
    // Non-blocking: if ws-server is down, booking still works via polling fallback
    console.warn("Failed to emit WS event:", event, err);
  }
}
```

**Step 2: Commit**

```bash
git add packages/web/lib/ws/emit.ts
git commit -m "feat: add wsEmit utility for server actions to notify ws-server"
```

---

### Task 5: Wire server actions to emit WebSocket events

**Files:**
- Modify: `packages/web/server_actions/bookings.ts`

**Step 1: Add wsEmit calls to createBooking, acceptBooking, cancelBooking**

Add import at top of `bookings.ts`:
```typescript
import { wsEmit } from "@/lib/ws/emit";
```

In `createBooking()`, after `broadcastToDrivers(...)` call (line ~175), add:
```typescript
  // Real-time notification via WebSocket
  const vehicleClass = await prisma.vehicleClass.findUnique({
    where: { id: input.vehicleClassId },
    select: { name: true },
  });
  await wsEmit("booking:new", {
    bookingId: booking.id,
    vehicleClassId: input.vehicleClassId,
    pickupAddress: input.pickupAddress,
    dropoffAddress: input.dropoffAddress,
    scheduledAt: scheduledDate.toISOString(),
    passengerCount: input.passengerCount || 1,
    estimatedFareMin: fareRange?.min || null,
    estimatedFareMax: fareRange?.max || null,
    estimatedDistanceKm: route.distanceKm,
    vehicleClassName: vehicleClass?.name || "",
    clientName: session.user.name || "Client",
  });
```

In `acceptBooking()`, after the push notification block (after line ~300), add:
```typescript
  // Real-time notification via WebSocket
  if (booking) {
    await wsEmit("booking:accepted", {
      bookingId,
      vehicleClassId: booking.vehicleClassId,
      driverName: booking.driver?.user.name || "Driver",
      plate: booking.driver?.vehicle?.plateNumber || "",
      vehicleClassName: booking.driver?.vehicle?.vehicleClass.name || "",
    });
  }
```

In `cancelBooking()`, after the updateMany call succeeds (after line ~428), add:
```typescript
  // Notify via WebSocket
  const cancelled = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { vehicleClassId: true },
  });
  if (cancelled) {
    await wsEmit("booking:cancelled", {
      bookingId,
      vehicleClassId: cancelled.vehicleClassId,
    });
  }
```

**Step 2: Commit**

```bash
git add packages/web/server_actions/bookings.ts packages/web/lib/ws/emit.ts
git commit -m "feat: emit WebSocket events from booking server actions"
```

---

### Task 6: Create useSocket hook for web app

**Files:**
- Create: `packages/web/hooks/use-socket.ts`

**Step 1: Create the hook**

```typescript
"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

export function useSocket() {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    // Build a simple token from session data
    // The ws-server verifies this with the same NEXTAUTH_SECRET
    const socket = io(WS_URL, {
      auth: { token: session.wsToken },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on("connect", () => {
      console.log("WS connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("WS connection error:", err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session]);

  return socketRef;
}
```

**Step 2: Commit**

```bash
git add packages/web/hooks/use-socket.ts
git commit -m "feat: add useSocket hook for WebSocket connection"
```

---

### Task 7: Add wsToken to NextAuth JWT and session

The ws-server verifies JWTs using `NEXTAUTH_SECRET`. We need to generate a JWT the ws-server can verify and include it in the session.

**Files:**
- Modify: `packages/web/lib/auth/auth.ts`
- Modify: `packages/web/types/next-auth.d.ts`

**Step 1: Add jsonwebtoken to web package**

Run: `cd packages/web && pnpm add jsonwebtoken && pnpm add -D @types/jsonwebtoken`

**Step 2: Generate wsToken in the jwt callback**

In `packages/web/lib/auth/auth.ts`, add import:
```typescript
import jwt from "jsonwebtoken";
```

In the `session` callback (around line 124-130), add wsToken generation:
```typescript
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.orgId = token.orgId;
      session.user.driverId = token.driverId;
      // Generate a WS token the ws-server can verify
      session.wsToken = jwt.sign(
        {
          id: token.id,
          role: token.role,
          orgId: token.orgId,
          driverId: token.driverId,
        },
        process.env.NEXTAUTH_SECRET || "dev-secret",
        { expiresIn: "24h" }
      );
      return session;
    },
```

**Step 3: Update next-auth type declarations**

In `packages/web/types/next-auth.d.ts`, add `wsToken` to Session:
```typescript
declare module "next-auth" {
  interface Session {
    user: { ... };
    wsToken: string; // JWT for WebSocket authentication
  }
}
```

**Step 4: Commit**

```bash
git add packages/web/lib/auth/auth.ts packages/web/types/next-auth.d.ts packages/web/package.json pnpm-lock.yaml
git commit -m "feat: add wsToken to NextAuth session for WebSocket auth"
```

---

### Task 8: Replace polling in FindingDriver with WebSocket

**Files:**
- Modify: `packages/web/components/booking/finding-driver.tsx`

**Step 1: Replace polling with socket subscription**

Replace the polling `useEffect` (lines 37-63) with socket-based updates. Keep polling as a fallback in case ws-server is down.

The component should:
1. Use the `useSocket` hook
2. Emit `subscribe:booking` with the bookingId
3. Listen for `booking:accepted` and `booking:timed_out` events
4. Keep a reduced-frequency polling fallback (every 10s instead of 3s)

```typescript
"use client";

import { useEffect, useState } from "react";
import { X, Car, Check } from "lucide-react";
import { useBookingStore } from "@/lib/stores/booking-store";
import { cancelBooking, getBooking } from "@/server_actions/bookings";
import { useSocket } from "@/hooks/use-socket";
import { toast } from "sonner";

export const FindingDriver = () => {
  const bookingId = useBookingStore((s) => s.bookingId);
  const reset = useBookingStore((s) => s.reset);
  const [timeLeft, setTimeLeft] = useState(300);
  const [status, setStatus] = useState<string>("pending");
  const [driverInfo, setDriverInfo] = useState<{
    name: string;
    plate: string;
    vehicleClass: string;
  } | null>(null);
  const socketRef = useSocket();

  // Subscribe to booking room via WebSocket
  useEffect(() => {
    if (!bookingId || status !== "pending") return;
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("subscribe:booking", bookingId);

    const handleAccepted = (data: { bookingId: string; driverName: string; plate: string; vehicleClassName: string }) => {
      if (data.bookingId === bookingId) {
        setStatus("driver_assigned");
        setDriverInfo({
          name: data.driverName,
          plate: data.plate,
          vehicleClass: data.vehicleClassName,
        });
      }
    };

    const handleTimedOut = (data: { bookingId: string }) => {
      if (data.bookingId === bookingId) {
        setStatus("timed_out");
      }
    };

    const handleCancelled = (data: { bookingId: string }) => {
      if (data.bookingId === bookingId) {
        setStatus("cancelled");
      }
    };

    socket.on("booking:accepted", handleAccepted);
    socket.on("booking:timed_out", handleTimedOut);
    socket.on("booking:cancelled", handleCancelled);

    return () => {
      socket.off("booking:accepted", handleAccepted);
      socket.off("booking:timed_out", handleTimedOut);
      socket.off("booking:cancelled", handleCancelled);
    };
  }, [bookingId, status, socketRef]);

  // Countdown timer (unchanged)
  useEffect(() => {
    if (status !== "pending") return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setStatus("timed_out");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Fallback polling (reduced frequency: every 10s)
  useEffect(() => {
    if (!bookingId || status !== "pending") return;

    const pollInterval = setInterval(async () => {
      try {
        const booking = await getBooking(bookingId);
        if (booking.status === "driver_assigned") {
          setStatus("driver_assigned");
          setDriverInfo({
            name: booking.driver?.user.name || "Driver",
            plate: booking.driver?.vehicle?.plateNumber || "",
            vehicleClass: booking.driver?.vehicle?.vehicleClass.name || "",
          });
        } else if (booking.status === "timed_out" || booking.status === "cancelled") {
          setStatus(booking.status);
        }
      } catch {
        // ignore polling errors
      }
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [bookingId, status]);

  // ... rest of component (handleCancel + JSX) stays the same
};
```

**Step 2: Commit**

```bash
git add packages/web/components/booking/finding-driver.tsx
git commit -m "feat: replace polling with WebSocket in FindingDriver, keep 10s fallback"
```

---

### Task 9: Replace polling in driver dashboard with WebSocket

**Files:**
- Modify: `packages/web/components/driver/driver-dashboard.tsx`

**Step 1: Add socket-based new booking listener**

Replace the 5-second `router.refresh()` polling with:
1. Use `useSocket` hook
2. Emit `driver:register` with vehicleClassId on connect
3. Listen for `booking:new` → trigger `router.refresh()` once (to re-fetch server data)
4. Listen for `booking:removed` → trigger `router.refresh()` once
5. Keep a reduced 30s polling fallback for resilience

Key changes at the top of the component:

```typescript
import { useSocket } from "@/hooks/use-socket";

// Inside the component:
const socketRef = useSocket();

// Replace the old 5s polling useEffect with:
useEffect(() => {
  if (!isOnline) return;
  const socket = socketRef.current;

  if (socket) {
    // Register for booking events for this vehicle class
    const vcId = driver.vehicle?.vehicleClass.id;
    if (vcId) {
      socket.emit("driver:register", { vehicleClassId: vcId });
    }

    const handleNewBooking = () => router.refresh();
    const handleBookingRemoved = () => router.refresh();

    socket.on("booking:new", handleNewBooking);
    socket.on("booking:removed", handleBookingRemoved);

    return () => {
      socket.off("booking:new", handleNewBooking);
      socket.off("booking:removed", handleBookingRemoved);
    };
  }

  // Fallback: poll every 30s if no socket
  const interval = setInterval(() => router.refresh(), 30000);
  return () => clearInterval(interval);
}, [isOnline, router, socketRef, driver.vehicle?.vehicleClass.id]);
```

**Step 2: Commit**

```bash
git add packages/web/components/driver/driver-dashboard.tsx
git commit -m "feat: replace polling with WebSocket in driver dashboard"
```

---

### Task 10: Add NEXT_PUBLIC_WS_URL env variable

**Files:**
- Modify: `packages/web/.env.local` (or `.env`)

**Step 1: Add the env var**

Add to `.env.local`:
```
NEXT_PUBLIC_WS_URL=http://localhost:3001
WS_SERVER_URL=http://localhost:3001
```

`NEXT_PUBLIC_WS_URL` is used by the client-side `useSocket` hook.
`WS_SERVER_URL` is used by server-side `wsEmit` utility.

**Step 2: Verify both servers can start**

Terminal 1: `cd packages/web && pnpm dev`
Terminal 2: `cd packages/ws-server && pnpm dev`

**Step 3: Commit**

```bash
git add packages/web/.env.example  # if you maintain one
git commit -m "chore: add WS_SERVER_URL env variables"
```

---

### Task 11: End-to-end test

**Manual test procedure:**

1. Start ws-server: `cd packages/ws-server && pnpm dev`
2. Start web: `cd packages/web && pnpm dev`
3. Re-seed: `curl -X POST "http://localhost:3000/api/seed?secret=YOUR_SECRET"`
4. **Tab 1 (Client):** Log in via Google, go to /book, complete booking flow with E Class
5. **Tab 2 (Driver):** Log in as driver (6911111111 / 1234), should see the ride appear instantly
6. Click Accept on driver tab
7. Client tab should show "Driver found" within 1 second (via WebSocket) instead of 3s polling

**Verify fallback:** Stop ws-server, repeat test. Should still work via 10s/30s polling fallback.

---

### Summary of changes

| Package | File | Change |
|---------|------|--------|
| shared | `src/types/index.ts` | Add WS event payload types |
| ws-server | `src/handlers/bookings.ts` | New: booking event emitter |
| ws-server | `src/index.ts` | Add booking rooms, internal HTTP API |
| web | `package.json` | Add socket.io-client, jsonwebtoken |
| web | `lib/ws/emit.ts` | New: server-side wsEmit utility |
| web | `hooks/use-socket.ts` | New: client-side useSocket hook |
| web | `lib/auth/auth.ts` | Generate wsToken in session |
| web | `types/next-auth.d.ts` | Add wsToken to Session type |
| web | `server_actions/bookings.ts` | Emit WS events on create/accept/cancel |
| web | `components/booking/finding-driver.tsx` | Subscribe to WS, fallback poll 10s |
| web | `components/driver/driver-dashboard.tsx` | Subscribe to WS, fallback poll 30s |
