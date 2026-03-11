"use server";

interface SnappedPoint {
  lat: number;
  lng: number;
}

/**
 * Snap GPS trace to roads using Google Roads API.
 * Returns snapped points and actual road distance.
 */
export async function snapToRoads(
  points: { lat: number; lng: number }[]
): Promise<{ snappedPoints: SnappedPoint[]; distanceMeters: number }> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey || points.length < 2) {
    return {
      snappedPoints: points,
      distanceMeters: calculateTraceDistance(points),
    };
  }

  // Roads API accepts max 100 points per request
  const allSnapped: SnappedPoint[] = [];

  for (let i = 0; i < points.length; i += 100) {
    const chunk = points.slice(i, i + 100);
    const path = chunk.map((p) => `${p.lat},${p.lng}`).join("|");

    try {
      const res = await fetch(
        `https://roads.googleapis.com/v1/snapToRoads?path=${path}&interpolate=true&key=${apiKey}`
      );

      if (!res.ok) {
        console.error("Roads API error:", await res.text());
        allSnapped.push(...chunk);
        continue;
      }

      const data = await res.json();
      const snapped = (data.snappedPoints || []).map(
        (p: { location: { latitude: number; longitude: number } }) => ({
          lat: p.location.latitude,
          lng: p.location.longitude,
        })
      );
      allSnapped.push(...snapped);
    } catch (error) {
      console.error("Roads API failed:", error);
      allSnapped.push(...chunk);
    }
  }

  return {
    snappedPoints: allSnapped,
    distanceMeters: calculateTraceDistance(allSnapped),
  };
}

/**
 * Calculate total distance from a GPS trace using Haversine.
 */
function calculateTraceDistance(
  points: { lat: number; lng: number }[]
): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += haversine(points[i], points[i + 1]);
  }
  return total;
}

function haversine(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aVal =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng *
      sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
}
