"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Navigation,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useBookingStore } from "@/lib/stores/booking-store";
import { AddressInput } from "./address-input";
import { VehicleSelector } from "./vehicle-selector";
import { BookingDetails } from "./booking-details";
import { BookingSummary } from "./booking-summary";
import { FindingDriver } from "./finding-driver";
import {
  getAvailableVehicleClasses,
  createBooking,
} from "@/server_actions/bookings";
import { toast } from "sonner";

export const BookingFlow = () => {
  const [isPending, startTransition] = useTransition();
  const step = useBookingStore((s) => s.step);
  const setStep = useBookingStore((s) => s.setStep);

  // Location state
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
  const setRoute = useBookingStore((s) => s.setRoute);
  const setVehicleClasses = useBookingStore((s) => s.setVehicleClasses);
  const setBookingId = useBookingStore((s) => s.setBookingId);

  const [showAddStop, setShowAddStop] = useState(false);

  const canProceedToVehicle =
    pickupLat !== null &&
    pickupLng !== null &&
    dropoffLat !== null &&
    dropoffLng !== null;

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
          specialInstructions: specialInstructions || undefined,
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

  if (step === "finding") {
    return <FindingDriver />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Book a Transfer</h1>
        <p className="text-muted-foreground">
          {step === "location" && "Enter your pickup and dropoff locations."}
          {step === "vehicle" && "Choose your vehicle and review the fare."}
          {step === "details" && "Add trip details and confirm."}
          {step === "confirm" && "Review and confirm your booking."}
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 text-sm">
        {(["location", "vehicle", "details", "confirm"] as const).map(
          (s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && (
                <div className="h-px w-6 bg-border" />
              )}
              <div
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : (["location", "vehicle", "details", "confirm"] as const).indexOf(step) > i
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
              </div>
            </div>
          )
        )}
      </div>

      {/* Location step */}
      {step === "location" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-5" />
              Route
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddressInput
              label="Pickup Location"
              value={pickupAddress}
              placeholder="Enter pickup address..."
              onSelect={(addr, lat, lng) => setPickup(addr, lat, lng)}
            />

            {stops.map((stop, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <AddressInput
                    label={`Stop ${i + 1}`}
                    value={stop.address}
                    placeholder={`Enter stop ${i + 1} address...`}
                    onSelect={(addr, lat, lng) => {
                      // Update stop in place
                      const newStops = [...stops];
                      newStops[i] = { address: addr, lat, lng };
                      // Re-set all stops
                      stops.forEach((_, idx) => removeStop(idx));
                      newStops.forEach((s) => addStop(s));
                    }}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStop(i)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}

            {stops.length < 5 && !showAddStop && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddStop(true)}
                className="w-full"
              >
                <Plus className="size-4" />
                Add Stop
              </Button>
            )}

            {showAddStop && (
              <div className="flex items-end gap-2">
                <div className="flex-1">
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddStop(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}

            <AddressInput
              label="Dropoff Location"
              value={dropoffAddress}
              placeholder="Enter dropoff address..."
              onSelect={(addr, lat, lng) => setDropoff(addr, lat, lng)}
            />

            <Button
              onClick={handleGetVehicles}
              disabled={!canProceedToVehicle || isPending}
              className="w-full"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Navigation className="size-4" />
                  Get Available Vehicles
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Vehicle selection step */}
      {step === "vehicle" && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <VehicleSelector />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("location")}
                className="flex-1"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep("details")}
                disabled={!selectedClassId}
                className="flex-1"
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details step */}
      {step === "details" && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <BookingDetails />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("vehicle")}
                className="flex-1"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button
                onClick={() => setStep("confirm")}
                className="flex-1"
              >
                Review Booking
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm step */}
      {step === "confirm" && (
        <div className="space-y-4">
          <BookingSummary />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep("details")}
              className="flex-1"
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button
              onClick={handleConfirmBooking}
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
