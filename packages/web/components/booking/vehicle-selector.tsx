"use client";

import { Users, Check } from "lucide-react";
import { cn } from "@/lib/general/utils";
import { useBookingStore } from "@/lib/stores/booking-store";

const VEHICLE_ICONS: Record<string, string> = {
  "Mercedes E Class": "🚗",
  "Mercedes S Class": "🚘",
  "Mercedes Vito": "🚐",
  "Mercedes V Class": "🚐",
  "Mercedes Sprinter": "🚌",
};

export const VehicleSelector = () => {
  const vehicleClasses = useBookingStore((s) => s.vehicleClasses);
  const selectedClassId = useBookingStore((s) => s.selectedClassId);
  const setSelectedClass = useBookingStore((s) => s.setSelectedClass);
  const passengerCount = useBookingStore((s) => s.passengerCount);

  const filteredClasses = vehicleClasses.filter(
    (vc) => vc.capacity >= passengerCount
  );

  if (filteredClasses.length === 0) {
    return (
      <div className="text-center text-white/30 py-12">
        No vehicles available for {passengerCount} passengers.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredClasses.map((vc) => {
        const active = selectedClassId === vc.id;
        const icon = VEHICLE_ICONS[vc.name] || "🚗";

        return (
          <button
            key={vc.id}
            type="button"
            onClick={() => setSelectedClass(vc.id)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
              "text-left group",
              active
                ? "bg-white/10 border-amber-400/50"
                : "bg-white/6 border-white/10 hover:bg-white/8 hover:border-white/20"
            )}
          >
            {/* Vehicle icon */}
            <div className="text-3xl shrink-0 w-12 text-center">{icon}</div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-semibold transition-colors duration-300",
                  active ? "text-white" : "text-white/80"
                )}>
                  {vc.name}
                </span>
                {active && (
                  <div className="size-5 rounded-full bg-amber-400 flex items-center justify-center">
                    <Check className="size-3 text-[#0a0a0f]" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-white/40 flex items-center gap-1">
                  <Users className="size-3" />
                  {vc.capacity}
                </span>
                {vc.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-xs text-white/30">
                    {tag}
                  </span>
                ))}
              </div>
              {vc.description && (
                <p className="text-xs text-white/25 mt-1 truncate">{vc.description}</p>
              )}
            </div>

            {/* Price */}
            <div className="text-right shrink-0">
              {vc.fareRange ? (
                <>
                  <div className={cn(
                    "text-xl font-bold tabular-nums transition-colors duration-300",
                    active ? "text-amber-400" : "text-white"
                  )}>
                    €{vc.fareRange.min === vc.fareRange.max
                      ? vc.fareRange.min.toFixed(0)
                      : `${vc.fareRange.min.toFixed(0)}–${vc.fareRange.max.toFixed(0)}`}
                  </div>
                  <div className="text-[10px] text-white/30 uppercase tracking-wider">
                    est.
                  </div>
                </>
              ) : (
                <span className="text-sm text-white/30">—</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
