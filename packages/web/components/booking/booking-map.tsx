"use client";

import { useEffect, useState, useRef } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from "@vis.gl/react-google-maps";
import { useBookingStore } from "@/lib/stores/booking-store";
import { useSocket } from "@/hooks/use-socket";
import { decodePolyline } from "@/lib/maps/polyline";

interface NearbyDriver {
  lat: number;
  lng: number;
  bearing: number | null;
  vehicleClassId: string | null;
}

const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8a9a" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2a2a3e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a1a2e" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3a3a4e" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0e0e1a" }],
  },
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
  const step = useBookingStore((s) => s.step);
  const driverId = useBookingStore((s) => s.driverId);

  const [drivers, setDrivers] = useState<NearbyDriver[]>([]);
  const [driverPos, setDriverPos] = useState<{
    lat: number;
    lng: number;
    bearing: number | null;
  } | null>(null);

  const socketRef = useSocket();

  // SSE for nearby drivers (only when not tracking a specific driver)
  useEffect(() => {
    if (driverId) return; // tracking a specific driver, skip SSE
    const eventSource = new EventSource("/api/sse/nearby-drivers");
    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "drivers") {
          setDrivers(parsed.data);
        }
      } catch {
        /* ignore */
      }
    };
    return () => eventSource.close();
  }, [driverId]);

  // WebSocket GPS tracking for assigned driver
  useEffect(() => {
    if (!driverId) return;
    const socket = socketRef.current;
    if (!socket) return;

    const handleGps = (data: {
      lat: number;
      lng: number;
      bearing: number | null;
    }) => {
      setDriverPos({ lat: data.lat, lng: data.lng, bearing: data.bearing });
    };

    socket.on("gps", handleGps);
    return () => {
      socket.off("gps", handleGps);
    };
  }, [driverId, socketRef]);

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

        {/* Nearby driver markers (when not tracking specific driver) */}
        {!driverId &&
          drivers.map((d, i) => (
            <AdvancedMarker key={i} position={{ lat: d.lat, lng: d.lng }}>
              <div
                className="text-lg drop-shadow-md"
                style={
                  d.bearing != null
                    ? { transform: `rotate(${d.bearing}deg)` }
                    : undefined
                }
              >
                🚗
              </div>
            </AdvancedMarker>
          ))}

        {/* Tracked driver marker (after acceptance) */}
        {driverPos && (
          <AdvancedMarker
            position={{ lat: driverPos.lat, lng: driverPos.lng }}
          >
            <div
              className="text-2xl drop-shadow-lg"
              style={
                driverPos.bearing != null
                  ? { transform: `rotate(${driverPos.bearing}deg)` }
                  : undefined
              }
            >
              🚘
            </div>
          </AdvancedMarker>
        )}

        {/* Route polyline + auto-fit bounds */}
        <MapEffects />
      </Map>
    </APIProvider>
  );
};

/**
 * Inner component using useMap() to draw polyline and fit bounds.
 * Must be inside <Map>.
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
      strokeColor: "#fbbf24",
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

  // Fit bounds
  useEffect(() => {
    if (!map || !pickupLat || !pickupLng) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: pickupLat, lng: pickupLng });

    if (dropoffLat && dropoffLng) {
      bounds.extend({ lat: dropoffLat, lng: dropoffLng });
    }

    stops.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));

    if (dropoffLat && dropoffLng) {
      map.fitBounds(bounds, { top: 60, bottom: 400, left: 40, right: 40 });
    } else {
      map.panTo({ lat: pickupLat, lng: pickupLng });
      map.setZoom(14);
    }
  }, [map, pickupLat, pickupLng, dropoffLat, dropoffLng, stops]);

  return null;
}
