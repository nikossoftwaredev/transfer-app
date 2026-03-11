import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";

/**
 * SSE endpoint for trip status updates.
 * Client polls their active booking status.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const bookingId = req.nextUrl.searchParams.get("bookingId");
  if (!bookingId) {
    return new Response("bookingId required", { status: 400 });
  }

  const userId = token.id as string;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      let lastStatus = "";

      const poll = async () => {
        try {
          const booking = await prisma.booking.findFirst({
            where: {
              id: bookingId,
              OR: [
                { clientId: userId },
                { driver: { user: { id: userId } } },
              ],
            },
            select: {
              status: true,
              driver: {
                select: {
                  user: { select: { name: true, image: true } },
                  vehicle: {
                    select: {
                      plateNumber: true,
                      vehicleClass: { select: { name: true } },
                    },
                  },
                },
              },
              trip: {
                select: {
                  waitingStartedAt: true,
                  waitingEndedAt: true,
                  waitingMinutes: true,
                },
              },
            },
          });

          if (booking && booking.status !== lastStatus) {
            lastStatus = booking.status;
            send({ type: "status", data: booking });
          }
        } catch (err) {
          console.error("SSE trip poll error:", err);
        }
      };

      await poll();
      const interval = setInterval(poll, 3000);

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
