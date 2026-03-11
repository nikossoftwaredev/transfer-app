import type { Socket } from "socket.io";
import type { Redis } from "ioredis";

interface GpsPayload {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  bearing: number | null;
  timestamp: number;
}

// Batch GPS writes to Postgres every 30 seconds
const GPS_BATCH_INTERVAL = 30000;
const gpsBuffer: Map<string, GpsPayload[]> = new Map();

// Flush GPS buffer to database via HTTP call to the web app
async function flushGpsBuffer() {
  const apiUrl = process.env.WEB_API_URL || "http://localhost:3000";
  const entries = Array.from(gpsBuffer.entries());
  gpsBuffer.clear();

  if (entries.length === 0) return;

  const records = entries.flatMap(([driverId, points]) =>
    points.map((p) => ({
      driverId,
      lat: p.lat,
      lng: p.lng,
      accuracy: p.accuracy,
      speed: p.speed,
      bearing: p.bearing,
      recordedAt: new Date(p.timestamp).toISOString(),
    }))
  );

  try {
    await fetch(`${apiUrl}/api/gps/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CRON_SECRET || ""}`,
      },
      body: JSON.stringify({ records }),
    });
  } catch (err) {
    console.error("Failed to flush GPS buffer:", err);
  }
}

setInterval(flushGpsBuffer, GPS_BATCH_INTERVAL);

export function handleGps(
  socket: Socket,
  redis: Redis,
  data: GpsPayload
) {
  const driverId = socket.data.driverId;
  if (!driverId) return;

  // Validate accuracy
  if (data.accuracy > 50) return;

  // Store latest position in Redis
  const key = `driver:${driverId}:location`;
  redis
    .set(
      key,
      JSON.stringify({
        lat: data.lat,
        lng: data.lng,
        speed: data.speed,
        bearing: data.bearing,
        timestamp: data.timestamp,
      }),
      "EX",
      300 // expire after 5 min if no update
    )
    .catch((err) => console.error("Redis set error:", err));

  // Broadcast to room (dashboards + tracking clients)
  socket.to(`driver:${driverId}`).emit("driver:location", {
    driverId,
    lat: data.lat,
    lng: data.lng,
    speed: data.speed,
    bearing: data.bearing,
    timestamp: data.timestamp,
  });

  // Buffer for batch DB write
  const buffer = gpsBuffer.get(driverId) || [];
  buffer.push(data);
  gpsBuffer.set(driverId, buffer);
}
