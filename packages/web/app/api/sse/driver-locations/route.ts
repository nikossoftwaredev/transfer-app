import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";

/**
 * SSE endpoint for driver locations.
 * Org admins see their org's drivers, superadmin sees all.
 * Polls DB every 5 seconds (Redis subscription would be better but SSE keeps it simple).
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const role = token.role as string;
  const orgId = token.orgId as string | undefined;

  if (role !== "orgadmin" && role !== "superadmin") {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      const poll = async () => {
        try {
          const where =
            role === "superadmin"
              ? {}
              : { driver: { user: { orgId: orgId! } } };

          // Get latest location per driver from last 5 minutes
          const locations = await prisma.driverLocation.findMany({
            where: {
              ...where,
              recordedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
            },
            orderBy: { recordedAt: "desc" },
            distinct: ["driverId"],
            include: {
              driver: {
                select: {
                  id: true,
                  availability: true,
                  user: { select: { name: true } },
                  vehicle: {
                    select: {
                      plateNumber: true,
                      vehicleClass: { select: { name: true } },
                    },
                  },
                },
              },
            },
            take: 200,
          });

          send({ type: "locations", data: locations });
        } catch (err) {
          console.error("SSE poll error:", err);
        }
      };

      // Initial send
      await poll();

      // Poll every 5 seconds
      const interval = setInterval(poll, 5000);

      // Cleanup on close
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
