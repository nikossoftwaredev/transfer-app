"use client";

import { useBookingStore } from "@/lib/stores/booking-store";
import { Users, Luggage, Clock, MessageSquare } from "lucide-react";

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
    <div className="space-y-3">
      {/* Date & Time */}
      <div className="rounded-2xl bg-white/6 border border-white/10 p-4">
        <label className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-widest mb-2">
          <Clock className="size-3.5" />
          Pickup Date & Time
        </label>
        <input
          type="datetime-local"
          value={formatDateTimeLocal(scheduledAt)}
          onChange={(e) => {
            const date = new Date(e.target.value);
            if (!isNaN(date.getTime())) setScheduledAt(date);
          }}
          min={formatDateTimeLocal(new Date())}
          className="w-full bg-transparent text-white text-sm outline-none scheme-dark"
        />
      </div>

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

      {/* Special instructions */}
      <div className="rounded-2xl bg-white/6 border border-white/10 p-4">
        <label className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-widest mb-2">
          <MessageSquare className="size-3.5" />
          Special Instructions
        </label>
        <textarea
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          placeholder="Flight number, meeting point details..."
          maxLength={500}
          rows={3}
          className="w-full bg-transparent text-white text-sm outline-none resize-none placeholder:text-white/20"
        />
      </div>
    </div>
  );
};
