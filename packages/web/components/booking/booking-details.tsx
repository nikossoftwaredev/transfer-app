"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBookingStore } from "@/lib/stores/booking-store";
import { Users, Luggage } from "lucide-react";

export const BookingDetails = () => {
  const passengerCount = useBookingStore((s) => s.passengerCount);
  const luggageCount = useBookingStore((s) => s.luggageCount);
  const specialInstructions = useBookingStore((s) => s.specialInstructions);
  const scheduledAt = useBookingStore((s) => s.scheduledAt);
  const setPassengerCount = useBookingStore((s) => s.setPassengerCount);
  const setLuggageCount = useBookingStore((s) => s.setLuggageCount);
  const setSpecialInstructions = useBookingStore(
    (s) => s.setSpecialInstructions
  );
  const setScheduledAt = useBookingStore((s) => s.setScheduledAt);

  const formatDateTimeLocal = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">
        Trip Details
      </h3>

      <div>
        <Label>Pickup Date & Time</Label>
        <Input
          type="datetime-local"
          value={formatDateTimeLocal(scheduledAt)}
          onChange={(e) => {
            const date = new Date(e.target.value);
            if (!isNaN(date.getTime())) setScheduledAt(date);
          }}
          min={formatDateTimeLocal(new Date())}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="flex items-center gap-1">
            <Users className="size-3" />
            Passengers
          </Label>
          <Input
            type="number"
            min={1}
            max={50}
            value={passengerCount}
            onChange={(e) =>
              setPassengerCount(Math.max(1, parseInt(e.target.value) || 1))
            }
          />
        </div>
        <div>
          <Label className="flex items-center gap-1">
            <Luggage className="size-3" />
            Luggage
          </Label>
          <Input
            type="number"
            min={0}
            max={20}
            value={luggageCount}
            onChange={(e) =>
              setLuggageCount(Math.max(0, parseInt(e.target.value) || 0))
            }
          />
        </div>
      </div>

      <div>
        <Label>Special Instructions (optional)</Label>
        <Textarea
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          placeholder="Flight number, child seat needed, wheelchair accessible..."
          maxLength={500}
          rows={3}
        />
      </div>
    </div>
  );
};
