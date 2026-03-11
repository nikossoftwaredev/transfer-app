import { NextRequest, NextResponse } from "next/server";
import { processTimedOutBookings } from "@/server_actions/bookings";

/**
 * Cron endpoint to process timed-out bookings.
 * Can be called by Vercel Cron or external scheduler.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Require secret in production
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await processTimedOutBookings();
  return NextResponse.json({ processed: count });
}
