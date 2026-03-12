# Booking Map Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a full-screen dark Google Map behind the booking flow as a bottom sheet, showing route polyline, pickup/dropoff markers, nearby drivers, and live driver tracking after acceptance.

**Architecture:** The booking page becomes a full-screen map with a draggable bottom sheet containing the booking steps. The map reacts to the booking state: shows pickup pin during location entry, route polyline + nearby drivers after route calculation, radar overlay during driver search, and live GPS tracking after driver acceptance. Uses `@vis.gl/react-google-maps` (already installed) with dark map styling, the existing encoded polyline from Google Routes API, and WebSocket GPS subscription for live tracking.

**Tech Stack:** `@vis.gl/react-google-maps`, Google Maps JS API (geometry library for polyline decoding), WebSocket (existing `useSocket` hook), Zustand booking store, SSE for nearby driver locations.

---

### Task 1: Create polyline decoder utility

**Files:**
- Create: `packages/web/lib/maps/polyline.ts`

**Context:** Google Routes API returns an encoded polyline string (stored in `booking-store.ts` as `route.polyline`). We need to decode it into `{lat, lng}[]` for rendering on the map. We'll use a pure TypeScript implementation rather than depending on `google.maps.geometry` being loaded.

**Step 1: Create the decoder**

```typescript
// packages/web/lib/maps/polyline.ts

/**
 * Decode a Google encoded polyline string into an array of lat/lng points.
 * Algorithm: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd packages/web && pnpm tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/web/lib/maps/polyline.ts
git commit -m "feat: add polyline decoder utility for Google encoded polylines"
```

---

### Task 2: Create SSE endpoint for client nearby-drivers

**Files:**
- Create: `packages/web/app/api/sse/nearby-drivers/route.ts`

**Context:** The existing `/api/sse/driver-locations` requires orgadmin/superadmin role. Clients need to see nearby online drivers on the booking map. This endpoint is lightweight — returns online driver positions from `DriverLocation` table (last 5 min), no auth required (positions are approximate, no PII exposed).

**Step 1: Create the endpoint**

```typescript
// packages/web/app/api/sse/nearby-drivers/route.ts
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
      const interval = setInterval(poll, 10000); // every 10s

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
```

**Step 2: Verify TypeScript compiles**

Run: `cd packages/web && pnpm tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/web/app/api/sse/nearby-drivers/route.ts
git commit -m "feat: add SSE endpoint for nearby online drivers (no auth, no PII)"
```

---

### Task 3: Create BookingMap component

**Files:**
- Create: `packages/web/components/booking/booking-map.tsx`

**Context:** This is the full-screen dark-themed map that sits behind the booking bottom sheet. It shows:
- Pickup marker (amber dot) when pickup is set
- Dropoff marker (white dot) when dropoff is set
- Route polyline (amber line) when route is calculated
- Nearby driver car markers (from SSE)
- Auto-fits bounds to show all markers

Uses `@vis.gl/react-google-maps` with `APIProvider`, `Map`, `AdvancedMarker`. Uses `useMap()` hook to draw the polyline via the raw Google Maps API. Dark map style via `mapId` or inline styles.

**Step 1: Create the component**

```typescript
// packages/web/components/booking/booking-map.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from "@vis.gl/react-google-maps";
import { useBookingStore } from "@/lib/stores/booking-store";
import { decodePolyline } from "@/lib/maps/polyline";

interface NearbyDriver {
  lat: number;
  lng: number;
  bearing: number | null;
  vehicleClassId: string | null;
}

const DARK_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8a9a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a3e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a2e" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a3a4e" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e0e1a" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

const DEFAULT_CENTER = { lat: 37.9838, lng: 23.7275 }; // Athens

export const BookingMap = () => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const pickupLat = useBookingStore((s) => s.pickupLat);
  const pickupLng = useBookingStore((s) => s.pickupLng);
  const dropoffLat = useBookingStore((s) => s.dropoffLat);
  const dropoffLng = useBookingStore((s) => s.dropoffLng);
  const stops = useBookingStore((s) => s.stops);
  const route = useBookingStore((s) => s.route);
  const step = useBookingStore((s) => s.step);

  const [drivers, setDrivers] = useState<NearbyDriver[]>([]);

  // SSE for nearby drivers
  useEffect(() => {
    if (step === "finding") return; // finding step has its own tracking
    const eventSource = new EventSource("/api/sse/nearby-drivers");
    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "drivers") {
          setDrivers(parsed.data);
        }
      } catch { /* ignore */ }
    };
    return () => eventSource.close();
  }, [step]);

  const center =
    pickupLat && pickupLng
      ? { lat: pickupLat, lng: pickupLng }
      : DEFAULT_CENTER;

  if (!apiKey) return null;

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={center}
        defaultZoom={13}
        className="absolute inset-0 w-full h-full"
        gestureHandling="greedy"
        disableDefaultUI
        styles={DARK_MAP_STYLES}
      >
        {/* Pickup marker */}
        {pickupLat && pickupLng && (
          <AdvancedMarker position={{ lat: pickupLat, lng: pickupLng }}>
            <div className="size-4 rounded-full bg-amber-400 border-2 border-white shadow-lg shadow-amber-400/50" />
          </AdvancedMarker>
        )}

        {/* Stop markers */}
        {stops.map((stop, i) => (
          <AdvancedMarker key={i} position={{ lat: stop.lat, lng: stop.lng }}>
            <div className="size-3 rounded-full bg-white/60 border border-white shadow-sm" />
          </AdvancedMarker>
        ))}

        {/* Dropoff marker */}
        {dropoffLat && dropoffLng && (
          <AdvancedMarker position={{ lat: dropoffLat, lng: dropoffLng }}>
            <div className="size-4 rounded-full bg-white border-2 border-amber-400 shadow-lg" />
          </AdvancedMarker>
        )}

        {/* Nearby driver markers */}
        {drivers.map((d, i) => (
          <AdvancedMarker key={i} position={{ lat: d.lat, lng: d.lng }}>
            <div
              className="text-lg"
              style={d.bearing != null ? { transform: `rotate(${d.bearing}deg)` } : undefined}
            >
              🚗
            </div>
          </AdvancedMarker>
        ))}

        {/* Route polyline + auto-fit */}
        <MapEffects />
      </Map>
    </APIProvider>
  );
};

/**
 * Inner component that uses useMap() to draw the polyline and fit bounds.
 * Must be inside <Map> for useMap() to work.
 */
function MapEffects() {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  const pickupLat = useBookingStore((s) => s.pickupLat);
  const pickupLng = useBookingStore((s) => s.pickupLng);
  const dropoffLat = useBookingStore((s) => s.dropoffLat);
  const dropoffLng = useBookingStore((s) => s.dropoffLng);
  const stops = useBookingStore((s) => s.stops);
  const route = useBookingStore((s) => s.route);

  // Draw/update polyline
  useEffect(() => {
    if (!map) return;

    // Clear previous
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (!route?.polyline) return;

    const path = decodePolyline(route.polyline);
    if (path.length === 0) return;

    polylineRef.current = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#fbbf24", // amber-400
      strokeOpacity: 0.9,
      strokeWeight: 4,
      map,
    });

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, route?.polyline]);

  // Fit bounds to show all markers
  useEffect(() => {
    if (!map) return;
    if (!pickupLat || !pickupLng) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: pickupLat, lng: pickupLng });

    if (dropoffLat && dropoffLng) {
      bounds.extend({ lat: dropoffLat, lng: dropoffLng });
    }

    stops.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));

    // Only fit bounds when we have at least 2 points
    if (dropoffLat && dropoffLng) {
      map.fitBounds(bounds, { top: 60, bottom: 400, left: 40, right: 40 });
    } else {
      map.panTo({ lat: pickupLat, lng: pickupLng });
      map.setZoom(14);
    }
  }, [map, pickupLat, pickupLng, dropoffLat, dropoffLng, stops]);

  return null;
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd packages/web && pnpm tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add packages/web/components/booking/booking-map.tsx
git commit -m "feat: add BookingMap component with dark theme, polyline, driver markers"
```

---

### Task 4: Restructure booking page to full-screen map + bottom sheet

**Files:**
- Modify: `packages/web/app/[locale]/book/page.tsx`
- Modify: `packages/web/components/booking/booking-flow.tsx`

**Context:** Currently the booking page is a centered card on a dark background. We need to restructure it to:
1. Full-screen `BookingMap` as the background
2. A bottom sheet (fixed to bottom, scrollable) containing the `BookingFlow` steps
3. The sheet has a semi-transparent dark background with `backdrop-blur`
4. Remove the ambient background effects (map replaces them)
5. Load Google Maps via `APIProvider` in the map component, but still need the script tag for Places autocomplete

**Step 1: Update the booking page**

Replace `packages/web/app/[locale]/book/page.tsx` with:

```typescript
import { setRequestLocale } from "next-intl/server";
import { BookingFlow } from "@/components/booking/booking-flow";
import { BookingMap } from "@/components/booking/booking-map";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function BookingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <div className="fixed inset-0 bg-[#0a0a0f]">
      {/* Google Maps JS (Places library for autocomplete) */}
      <script
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
        async
      />

      {/* Full-screen map background */}
      <BookingMap />

      {/* Bottom sheet with booking flow */}
      <div className="absolute inset-x-0 bottom-0 top-[30vh] pointer-events-none">
        <div className="h-full pointer-events-auto overflow-y-auto rounded-t-3xl bg-[#0a0a0f]/90 backdrop-blur-xl border-t border-white/10 shadow-2xl">
          <div className="mx-auto w-full max-w-lg px-5 pt-3 pb-8">
            {/* Drag handle */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <BookingFlow />
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd packages/web && pnpm tsc --noEmit`
Expected: No errors

**Step 3: Screenshot and verify**

Run: `node packages/web/screenshot.mjs http://localhost:3000/en/book booking-map`
Read the screenshot and verify: map visible behind the bottom sheet, booking form visible in the sheet, dark theme consistent.

**Step 4: Commit**

```bash
git add packages/web/app/\[locale\]/book/page.tsx
git commit -m "feat: restructure booking page to full-screen map + bottom sheet"
```

---

### Task 5: Update FindingDriver to show map with driver tracking

**Files:**
- Modify: `packages/web/components/booking/finding-driver.tsx`
- Modify: `packages/web/components/booking/booking-map.tsx`

**Context:** When the booking enters the "finding" step, the FindingDriver component shows the radar animation. Now we want:
1. The map behind it continues to show the route
2. When a driver accepts, the map switches to show the driver's live position moving toward pickup
3. The FindingDriver UI overlays on top of the map (semi-transparent)

The booking map needs to know when a driver is assigned and start tracking their GPS. We'll use the existing WebSocket infrastructure — the client already subscribes to `booking:<bookingId>` room and receives `booking:accepted` events. After acceptance, subscribe to the driver's GPS via `subscribe:trip` (already wired in ws-server).

**Step 1: Add driver tracking state to BookingMap**

Add to `packages/web/components/booking/booking-map.tsx`:
- New state: `trackingDriverId` (set when driver accepts)
- New state: `driverPosition` (updated via WebSocket GPS)
- A car marker that animates to the driver's position
- Stop the nearby drivers SSE when in finding/tracking mode

The BookingMap component needs access to the socket for GPS tracking. Add `useSocket` integration.

**Step 2: Add `driverId` to booking store for tracking**

In `packages/web/lib/stores/booking-store.ts`, add:
```typescript
// In BookingState interface:
driverId: string | null;
setDriverId: (id: string | null) => void;

// In initialState:
driverId: null as string | null,

// In create():
setDriverId: (id) => set({ driverId: id }),
```

**Step 3: Update FindingDriver to set driverId on acceptance**

When the `booking:accepted` WebSocket event fires in `finding-driver.tsx`, also call `setDriverId(data.driverId)` from the booking store (the ws-server needs to include `driverId` in the accepted payload — check and add if missing).

**Step 4: Update BookingMap to track driver GPS**

When `driverId` is set in the store and step is "finding", use the socket to subscribe to `driver:{driverId}` room and listen for `gps` events. Show the driver marker on the map animating toward pickup.

**Step 5: Verify TypeScript compiles**

Run: `cd packages/web && pnpm tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add packages/web/components/booking/booking-map.tsx packages/web/components/booking/finding-driver.tsx packages/web/lib/stores/booking-store.ts
git commit -m "feat: add live driver tracking on booking map after acceptance"
```

---

### Task 6: Wire ws-server to broadcast driver GPS to booking room clients

**Files:**
- Modify: `packages/ws-server/src/handlers/bookings.ts`
- Modify: `packages/ws-server/src/index.ts`

**Context:** When a client subscribes to `booking:<bookingId>`, they need to receive the assigned driver's GPS updates. Currently, GPS updates go to `driver:<driverId>` room. When a booking is accepted, the ws-server should:
1. Include `driverId` in the `booking:accepted` event payload
2. Forward GPS updates from `driver:<driverId>` to `booking:<bookingId>` room

The simplest approach: when emitting `booking:accepted`, also join the booking room members into the driver's GPS room.

**Step 1: Add driverId to BookingAcceptedPayload**

In `packages/ws-server/src/handlers/bookings.ts`, add `driverId: string` to `BookingAcceptedPayload` and emit it.

**Step 2: In ws-server index.ts, handle GPS forwarding**

When a client is in `booking:<bookingId>` room and the booking is accepted, the `subscribe:trip` event (already exists at line 92-94 of index.ts) joins the client into `driver:<driverId>` room, which means they'll receive `gps` events. This is already wired! Just need to ensure the accepted payload includes `driverId`.

**Step 3: Also emit driverId from web server action**

In `packages/web/server_actions/bookings.ts` `acceptBooking()`, the `wsEmit("booking:accepted", ...)` call needs to include `driverId`.

**Step 4: Verify TypeScript compiles for both packages**

Run: `cd packages/web && pnpm tsc --noEmit`
Run: `cd packages/ws-server && pnpm tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add packages/ws-server/src/handlers/bookings.ts packages/web/server_actions/bookings.ts
git commit -m "feat: include driverId in booking:accepted event for GPS tracking"
```

---

### Task 7: Final verification and cleanup

**Files:**
- All modified files

**Step 1: Run TypeScript check**

Run: `cd packages/web && pnpm tsc --noEmit`
Expected: No errors

**Step 2: Run lint**

Run: `cd packages/web && pnpm lint`
Expected: No errors or warnings

**Step 3: Screenshot full flow**

Take screenshots of:
1. Location step with map: `node packages/web/screenshot.mjs http://localhost:3000/en/book map-location`
2. Verify map renders, bottom sheet visible, dark theme matches

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "feat: complete booking map integration — full-screen map, polyline, nearby drivers, live tracking"
```
