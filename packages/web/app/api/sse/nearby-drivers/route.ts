import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

/**
 * SSE endpoint for nearby online drivers.
 * Returns lat/lng + vehicleClassId only (no PII).
 * Used by booking map to show car icons near pickup.
 */
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const poll = async () => {
        try {
          const locations = await prisma.driverLocation.findMany({
            where: {
              recordedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
              driver: {
                availability: "online",
                inviteStatus: "accepted",
                user: { org: { status: "verified" } },
              },
            },
            orderBy: { recordedAt: "desc" },
            distinct: ["driverId"],
            select: {
              lat: true,
              lng: true,
              bearing: true,
              driver: {
                select: {
                  vehicleClassId: true,
                },
              },
            },
            take: 50,
          });

          send({
            type: "drivers",
            data: locations.map((l) => ({
              lat: l.lat,
              lng: l.lng,
              bearing: l.bearing,
              vehicleClassId: l.driver.vehicleClassId,
            })),
          });
        } catch (err) {
          console.error("Nearby drivers SSE error:", err);
        }
      };

      await poll();
      const interval = setInterval(poll, 10000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
