"use server";

interface RouteRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  intermediates?: { lat: number; lng: number }[];
}

interface RouteResult {
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  polyline: string;
}

/**
 * Calculate route using Google Routes API.
 * Falls back to Haversine distance if API fails.
 */
export async function calculateRoute(
  req: RouteRequest
): Promise<RouteResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return haversineFallback(req);
  }

  try {
    const body: Record<string, unknown> = {
      origin: {
        location: {
          latLng: { latitude: req.origin.lat, longitude: req.origin.lng },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: req.destination.lat,
            longitude: req.destination.lng,
          },
        },
      },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
    };

    if (req.intermediates?.length) {
      body.intermediates = req.intermediates.map((wp) => ({
        location: {
          latLng: { latitude: wp.lat, longitude: wp.lng },
        },
      }));
    }

    const res = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      console.error("Routes API error:", await res.text());
      return haversineFallback(req);
    }

    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return haversineFallback(req);

    const distanceMeters = route.distanceMeters;
    const durationSeconds = parseInt(route.duration?.replace("s", "") || "0");

    return {
      distanceMeters,
      distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
      durationSeconds,
      durationMinutes: Math.ceil(durationSeconds / 60),
      polyline: route.polyline?.encodedPolyline || "",
    };
  } catch (error) {
    console.error("Routes API failed, using Haversine:", error);
    return haversineFallback(req);
  }
}

function haversineFallback(req: RouteRequest): RouteResult {
  const points = [
    req.origin,
    ...(req.intermediates || []),
    req.destination,
  ];

  let totalMeters = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalMeters += haversineDistance(points[i], points[i + 1]);
  }

  // Rough estimate: multiply by 1.3 for road factor
  totalMeters = totalMeters * 1.3;
  const durationSeconds = Math.ceil((totalMeters / 1000 / 50) * 3600); // 50 km/h avg

  return {
    distanceMeters: Math.round(totalMeters),
    distanceKm: Math.round((totalMeters / 1000) * 10) / 10,
    durationSeconds,
    durationMinutes: Math.ceil(durationSeconds / 60),
    polyline: "",
  };
}

function haversineDistance(
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
