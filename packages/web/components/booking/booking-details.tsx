"use client";

import { useBookingStore } from "@/lib/stores/booking-store";
import { Clock, MessageSquare } from "lucide-react";

export const BookingDetails = () => {
  const specialInstructions = useBookingStore((s) => s.specialInstructions);
  const scheduledAt = useBookingStore((s) => s.scheduledAt);
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
