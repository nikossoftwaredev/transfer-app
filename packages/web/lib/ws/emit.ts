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
