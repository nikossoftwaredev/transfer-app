"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  MapPin,
  Plus,
  X,
  Loader2,
  LocateFixed,
  Clock,
  Route,
  Users,
  Luggage,
  ChevronRight,
  ChevronLeft,
  CircleDot,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/general/utils";
import { useBookingStore } from "@/lib/stores/booking-store";
import { AddressInput } from "./address-input";
import { VehicleSelector } from "./vehicle-selector";
import { AssistanceSelector } from "./assistance-selector";
import { BookingDetails } from "./booking-details";
import { FindingDriver } from "./finding-driver";
import {
  getAvailableVehicleClasses,
  createBooking,
} from "@/server_actions/bookings";
import { toast } from "sonner";

function reverseGeocode(lat: number, lng: number): Promise<string> {
  return new Promise((resolve) => {
    if (!window.google?.maps?.Geocoder) {
      resolve(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      return;
    }
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        resolve(results[0].formatted_address);
      } else {
        resolve(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    });
  });
}

const STEPS = ["location", "vehicle", "assistance", "details", "confirm"] as const;

export const BookingFlow = () => {
  const [isPending, startTransition] = useTransition();
  const step = useBookingStore((s) => s.step);
  const setStep = useBookingStore((s) => s.setStep);

  const pickupAddress = useBookingStore((s) => s.pickupAddress);
  const pickupLat = useBookingStore((s) => s.pickupLat);
  const pickupLng = useBookingStore((s) => s.pickupLng);
  const dropoffAddress = useBookingStore((s) => s.dropoffAddress);
  const dropoffLat = useBookingStore((s) => s.dropoffLat);
  const dropoffLng = useBookingStore((s) => s.dropoffLng);
  const stops = useBookingStore((s) => s.stops);
  const setPickup = useBookingStore((s) => s.setPickup);
  const setDropoff = useBookingStore((s) => s.setDropoff);
  const addStop = useBookingStore((s) => s.addStop);
  const removeStop = useBookingStore((s) => s.removeStop);
  const scheduledAt = useBookingStore((s) => s.scheduledAt);
  const selectedClassId = useBookingStore((s) => s.selectedClassId);
  const passengerCount = useBookingStore((s) => s.passengerCount);
  const luggageCount = useBookingStore((s) => s.luggageCount);
  const specialInstructions = useBookingStore((s) => s.specialInstructions);
  const route = useBookingStore((s) => s.route);
  const vehicleClasses = useBookingStore((s) => s.vehicleClasses);
  const assistance = useBookingStore((s) => s.assistance);
  const setPassengerCount = useBookingStore((s) => s.setPassengerCount);
  const setLuggageCount = useBookingStore((s) => s.setLuggageCount);
  const setRoute = useBookingStore((s) => s.setRoute);
  const setVehicleClasses = useBookingStore((s) => s.setVehicleClasses);
  const setBookingId = useBookingStore((s) => s.setBookingId);

  const [showAddStop, setShowAddStop] = useState(false);
  const [locating, setLocating] = useState(false);
  const hasAutoLocated = useRef(false);

  // Auto-detect current location on mount
  useEffect(() => {
    if (hasAutoLocated.current || pickupLat !== null) return;
    hasAutoLocated.current = true;
    if (!navigator.geolocation) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const waitForGoogle = () =>
          new Promise<void>((resolve) => {
            if (window.google?.maps?.Geocoder) { resolve(); return; }
            const iv = setInterval(() => {
              if (window.google?.maps?.Geocoder) { clearInterval(iv); resolve(); }
            }, 200);
          });
        await waitForGoogle();
        const address = await reverseGeocode(latitude, longitude);
        setPickup(address, latitude, longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [pickupLat, setPickup]);

  const canProceedToVehicle =
    pickupLat !== null && pickupLng !== null &&
    dropoffLat !== null && dropoffLng !== null;

  const handleGetVehicles = () => {
    if (!canProceedToVehicle) return;
    startTransition(async () => {
      try {
        const result = await getAvailableVehicleClasses({
          pickupLat: pickupLat!,
          pickupLng: pickupLng!,
          dropoffLat: dropoffLat!,
          dropoffLng: dropoffLng!,
          stops: stops.map((s) => ({ lat: s.lat, lng: s.lng })),
          scheduledAt: scheduledAt.toISOString(),
        });
        setRoute(result.route);
        setVehicleClasses(result.vehicleClasses);
        setStep("vehicle");
      } catch {
        toast.error("Failed to calculate route. Please try again.");
      }
    });
  };

  const handleConfirmBooking = () => {
    if (!selectedClassId) return;
    startTransition(async () => {
      try {
        const assistanceNotes = Object.entries(assistance)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(", ");
        const instructions = [specialInstructions, assistanceNotes && `Assistance: ${assistanceNotes}`]
          .filter(Boolean)
          .join(". ");

        const booking = await createBooking({
          vehicleClassId: selectedClassId,
          pickupAddress,
          pickupLat: pickupLat!,
          pickupLng: pickupLng!,
          dropoffAddress,
          dropoffLat: dropoffLat!,
          dropoffLng: dropoffLng!,
          stops: stops.length > 0 ? stops : undefined,
          scheduledAt: scheduledAt.toISOString(),
          passengerCount,
          luggageCount,
          specialInstructions: instructions || undefined,
        });
        setBookingId(booking.id);
        setStep("finding");
        toast.success("Booking created! Finding your driver...");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create booking"
        );
      }
    });
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const address = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setPickup(address, pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => { toast.error("Could not get your location"); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (step === "finding") {
    return <FindingDriver />;
  }

  const currentStepIndex = STEPS.indexOf(step as typeof STEPS[number]);
  const selectedClass = vehicleClasses.find((vc) => vc.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            TransferGR
          </h1>
          <p className="text-xs text-white/40 tracking-widest uppercase mt-0.5">
            Premium Transfers
          </p>
        </div>
        {step !== "location" && (
          <button
            onClick={() => {
              const prevStep = STEPS[currentStepIndex - 1];
              if (prevStep) setStep(prevStep);
            }}
            className="flex items-center gap-1 text-sm text-white/50 hover:text-white/80 transition-colors duration-300"
          >
            <ChevronLeft className="size-4" />
            Back
          </button>
        )}
      </div>

      {/* ── Progress ────────────────────────────────────── */}
      <div className="flex gap-1">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-0.5 flex-1 rounded-full transition-all duration-500",
              i <= currentStepIndex
                ? "bg-amber-400"
                : "bg-white/10"
            )}
          />
        ))}
      </div>

      {/* ── Route summary (shown after location step) ──── */}
      {step !== "location" && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-0.5 pt-1.5">
              <div className="size-2.5 rounded-full bg-amber-400" />
              <div className="w-px h-5 bg-white/20" />
              {stops.map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <div className="size-1.5 rounded-full bg-white/40" />
                  <div className="w-px h-5 bg-white/20" />
                </div>
              ))}
              <div className="size-2.5 rounded-full bg-white" />
            </div>
            <div className="flex-1 min-w-0 space-y-2.5">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Pickup</span>
                <p className="text-sm text-white/90 truncate">{pickupAddress}</p>
              </div>
              {stops.map((stop, i) => (
                <div key={i}>
                  <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Stop {i + 1}</span>
                  <p className="text-sm text-white/90 truncate">{stop.address}</p>
                </div>
              ))}
              <div>
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Destination</span>
                <p className="text-sm text-white/90 truncate">{dropoffAddress}</p>
              </div>
            </div>
            {route && (
              <div className="text-right shrink-0 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                  <Route className="size-3" />
                  {route.distanceKm} km
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                  <Clock className="size-3" />
                  ~{route.durationMinutes} min
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Location Step ───────────────────────────────── */}
      {step === "location" && (
        <div className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Where to?
            </h2>
            <p className="text-white/40 text-sm">
              Enter your pickup and destination
            </p>
          </div>

          {/* Location card */}
          <div className="rounded-2xl bg-white/6 border border-white/10 overflow-hidden backdrop-blur-sm">
            <div className="flex items-stretch">
              <div className="flex flex-col items-center justify-center w-12 py-6">
                <CircleDot className="size-4 text-amber-400" />
                <div className="w-px flex-1 bg-white/15 my-1.5" />
                <MapPin className="size-4 text-white/70" />
              </div>
              <div className="flex-1 divide-y divide-white/10">
                <div className="py-1">
                  <AddressInput
                    label=""
                    value={pickupAddress}
                    placeholder={locating ? "Detecting location..." : "Pickup location"}
                    onSelect={(addr, lat, lng) => setPickup(addr, lat, lng)}
                  />
                </div>
                <div className="py-1">
                  <AddressInput
                    label=""
                    value={dropoffAddress}
                    placeholder="Where to?"
                    onSelect={(addr, lat, lng) => setDropoff(addr, lat, lng)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Current location */}
          <button
            type="button"
            disabled={locating}
            onClick={requestLocation}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-amber-400 transition-colors duration-300 disabled:opacity-50"
          >
            {locating
              ? <Loader2 className="size-3.5 animate-spin" />
              : <LocateFixed className="size-3.5" />
            }
            {locating ? "Detecting..." : "Use current location"}
          </button>

          {/* Stops */}
          {stops.map((stop, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1 rounded-2xl bg-white/6 border border-white/10 overflow-hidden px-4">
                <AddressInput
                  label={`Stop ${i + 1}`}
                  value={stop.address}
                  placeholder={`Stop ${i + 1} address...`}
                  onSelect={(addr, lat, lng) => {
                    const newStops = [...stops];
                    newStops[i] = { address: addr, lat, lng };
                    stops.forEach((_, idx) => removeStop(idx));
                    newStops.forEach((s) => addStop(s));
                  }}
                />
              </div>
              <button
                onClick={() => removeStop(i)}
                className="p-2.5 text-white/30 hover:text-white/60 transition-colors duration-300"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}

          {stops.length < 3 && !showAddStop && (
            <button
              onClick={() => setShowAddStop(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-white/15 text-sm text-white/30 hover:text-white/50 hover:border-white/25 transition-all duration-300"
            >
              <Plus className="size-4" />
              Add a stop
            </button>
          )}

          {showAddStop && (
            <div className="flex items-end gap-2">
              <div className="flex-1 rounded-2xl bg-white/6 border border-white/10 overflow-hidden px-4">
                <AddressInput
                  label={`Stop ${stops.length + 1}`}
                  value=""
                  placeholder="Enter stop address..."
                  onSelect={(addr, lat, lng) => {
                    addStop({ address: addr, lat, lng });
                    setShowAddStop(false);
                  }}
                />
              </div>
              <button
                onClick={() => setShowAddStop(false)}
                className="p-2.5 text-white/30 hover:text-white/60 transition-colors duration-300"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Passengers & Luggage */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/6 border border-white/10 p-4">
              <label className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-widest mb-2">
                <Users className="size-3.5" />
                Passengers
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                  className="size-8 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 flex items-center justify-center transition-colors duration-300 text-lg"
                >
                  -
                </button>
                <span className="text-xl font-semibold text-white tabular-nums w-6 text-center">
                  {passengerCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPassengerCount(Math.min(50, passengerCount + 1))}
                  className="size-8 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 flex items-center justify-center transition-colors duration-300 text-lg"
                >
                  +
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-white/6 border border-white/10 p-4">
              <label className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-widest mb-2">
                <Luggage className="size-3.5" />
                Luggage
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setLuggageCount(Math.max(0, luggageCount - 1))}
                  className="size-8 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 flex items-center justify-center transition-colors duration-300 text-lg"
                >
                  -
                </button>
                <span className="text-xl font-semibold text-white tabular-nums w-6 text-center">
                  {luggageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setLuggageCount(Math.min(20, luggageCount + 1))}
                  className="size-8 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 flex items-center justify-center transition-colors duration-300 text-lg"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleGetVehicles}
            disabled={!canProceedToVehicle || isPending}
            className={cn(
              "w-full h-14 rounded-2xl text-base font-semibold tracking-wide transition-all duration-300",
              "flex items-center justify-center gap-2",
              canProceedToVehicle && !isPending
                ? "bg-white text-[#0a0a0f] hover:bg-amber-400 hover:text-[#0a0a0f] active:scale-[0.98]"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            )}
          >
            {isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                CONFIRM PICKUP
                <ChevronRight className="size-5" />
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Vehicle Step ────────────────────────────────── */}
      {step === "vehicle" && (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-white tracking-tight">Choose a ride</h2>
          <VehicleSelector />
          <button
            onClick={() => setStep("assistance")}
            disabled={!selectedClassId}
            className={cn(
              "w-full h-14 rounded-2xl text-base font-semibold tracking-wide transition-all duration-300",
              "flex items-center justify-center gap-2",
              selectedClassId
                ? "bg-white text-[#0a0a0f] hover:bg-amber-400 active:scale-[0.98]"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            )}
          >
            {selectedClass
              ? `REQUEST ${selectedClass.name.toUpperCase()}`
              : "SELECT A VEHICLE"
            }
          </button>
        </div>
      )}

      {/* ── Assistance Step ─────────────────────────────── */}
      {step === "assistance" && (
        <div className="space-y-5">
          <AssistanceSelector />
          <button
            onClick={() => setStep("details")}
            className="w-full h-14 rounded-2xl bg-white text-[#0a0a0f] text-base font-semibold tracking-wide hover:bg-amber-400 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
          >
            CONTINUE
            <ChevronRight className="size-5" />
          </button>
        </div>
      )}

      {/* ── Details Step ────────────────────────────────── */}
      {step === "details" && (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-white tracking-tight">Trip details</h2>
          <BookingDetails />
          <button
            onClick={() => setStep("confirm")}
            className="w-full h-14 rounded-2xl bg-white text-[#0a0a0f] text-base font-semibold tracking-wide hover:bg-amber-400 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
          >
            REVIEW BOOKING
            <ChevronRight className="size-5" />
          </button>
        </div>
      )}

      {/* ── Confirm Step ────────────────────────────────── */}
      {step === "confirm" && (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-white tracking-tight">Confirm booking</h2>

          {selectedClass && (
            <div className="rounded-2xl bg-white/6 border border-white/10 backdrop-blur-sm overflow-hidden">
              {/* Vehicle + price */}
              <div className="p-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg text-white">{selectedClass.name}</p>
                  <p className="text-sm text-white/40 mt-0.5">{selectedClass.description}</p>
                  {Object.values(assistance).some(Boolean) && (
                    <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                      <Shield className="size-3" />
                      Assistance included
                    </p>
                  )}
                </div>
                {selectedClass.fareRange && (
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white tabular-nums">
                      €{selectedClass.fareRange.min === selectedClass.fareRange.max
                        ? selectedClass.fareRange.min.toFixed(0)
                        : `${selectedClass.fareRange.min.toFixed(0)}–${selectedClass.fareRange.max.toFixed(0)}`}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-white/30 mt-0.5">estimated</p>
                  </div>
                )}
              </div>

              {/* Details row */}
              <div className="border-t border-white/10 px-5 py-3 flex items-center gap-6 text-sm text-white/50">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span>{scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  <span>{passengerCount} pax</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Luggage className="size-3.5" />
                  <span>{luggageCount} bags</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleConfirmBooking}
            disabled={isPending}
            className={cn(
              "w-full h-14 rounded-2xl text-base font-semibold tracking-wide transition-all duration-300",
              "flex items-center justify-center gap-2",
              isPending
                ? "bg-white/10 text-white/30"
                : "bg-amber-400 text-[#0a0a0f] hover:bg-amber-300 active:scale-[0.98]"
            )}
          >
            {isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              "CONFIRM BOOKING"
            )}
          </button>

          <p className="text-center text-xs text-white/25">
            By confirming, you agree to our terms of service
          </p>
        </div>
      )}
    </div>
  );
};
