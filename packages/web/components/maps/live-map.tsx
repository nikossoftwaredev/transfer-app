"use client";

import { useEffect, useState, useCallback } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
} from "@vis.gl/react-google-maps";

interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  speed: number | null;
  bearing: number | null;
  timestamp: string;
  driver: {
    id: string;
    availability: string;
    user: { name: string };
    vehicle: {
      plateNumber: string;
      vehicleClass: { name: string };
    } | null;
  };
}

interface LiveMapProps {
  /**
   * "admin" - all drivers, "org" - org's drivers, "client" - single driver
   */
  variant: "admin" | "org" | "client";
  /** For client variant: the specific driver to track */
  trackDriverId?: string;
  /** Center coordinates (defaults to Athens) */
  center?: { lat: number; lng: number };
  /** Zoom level */
  zoom?: number;
  className?: string;
}

const DEFAULT_CENTER = { lat: 37.9838, lng: 23.7275 }; // Athens

export const LiveMap = ({
  variant,
  trackDriverId,
  center = DEFAULT_CENTER,
  zoom = 12,
  className = "h-[500px] w-full rounded-lg",
}: LiveMapProps) => {
  const [locations, setLocations] = useState<DriverLocation[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // SSE connection for driver locations
  useEffect(() => {
    if (variant === "client" && !trackDriverId) return;

    const url =
      variant === "client"
        ? `/api/sse/driver-locations?driverId=${trackDriverId}`
        : "/api/sse/driver-locations";

    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "locations") {
          setLocations(parsed.data);
        }
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      // Will auto-reconnect
    };

    return () => eventSource.close();
  }, [variant, trackDriverId]);

  if (!apiKey) {
    return (
      <div className={`${className} bg-muted flex items-center justify-center`}>
        <p className="text-muted-foreground">
          Google Maps API key not configured
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={center}
        defaultZoom={zoom}
        mapId="live-map"
        className={className}
        gestureHandling="greedy"
        disableDefaultUI={false}
      >
        {locations.map((loc) => (
          <AdvancedMarker
            key={loc.driverId}
            position={{ lat: loc.lat, lng: loc.lng }}
            title={`${loc.driver.user.name} - ${loc.driver.vehicle?.plateNumber || "No vehicle"}`}
            onClick={() =>
              setSelectedDriver(
                selectedDriver === loc.driverId ? null : loc.driverId
              )
            }
          >
            <Pin
              background={
                loc.driver.availability === "online" ? "#22c55e" : "#94a3b8"
              }
              borderColor="#fff"
              glyphColor="#fff"
            />
          </AdvancedMarker>
        ))}
      </Map>

      {/* Selected driver info */}
      {selectedDriver && (
        <DriverInfoPanel
          driver={locations.find((l) => l.driverId === selectedDriver)}
          onClose={() => setSelectedDriver(null)}
        />
      )}
    </APIProvider>
  );
};

function DriverInfoPanel({
  driver,
  onClose,
}: {
  driver: DriverLocation | undefined;
  onClose: () => void;
}) {
  if (!driver) return null;

  return (
    <div className="absolute bottom-4 left-4 right-4 bg-background border rounded-lg p-4 shadow-lg max-w-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{driver.driver.user.name}</h3>
          {driver.driver.vehicle && (
            <p className="text-sm text-muted-foreground">
              {driver.driver.vehicle.vehicleClass.name} —{" "}
              {driver.driver.vehicle.plateNumber}
            </p>
          )}
          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
            {driver.speed !== null && <span>{Math.round(driver.speed)} km/h</span>}
            <span>
              {new Date(driver.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          ×
        </button>
      </div>
    </div>
  );
}
