import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface GpsRecord {
  driverId: string;
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  bearing: number | null;
  recordedAt: string;
}

/**
 * Batch insert GPS records from WS server.
 * Protected by CRON_SECRET.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { records } = (await req.json()) as { records: GpsRecord[] };

  if (!records?.length) {
    return NextResponse.json({ inserted: 0 });
  }

  await prisma.driverLocation.createMany({
    data: records.map((r) => ({
      driverId: r.driverId,
      lat: r.lat,
      lng: r.lng,
      accuracy: r.accuracy,
      speed: r.speed,
      bearing: r.bearing,
      recordedAt: new Date(r.recordedAt),
    })),
  });

  return NextResponse.json({ inserted: records.length });
}
