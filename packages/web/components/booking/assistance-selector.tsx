"use client";

import { cn } from "@/lib/general/utils";
import { useBookingStore, type AssistanceOptions } from "@/lib/stores/booking-store";
import { Luggage, Baby, Accessibility, PawPrint, Check } from "lucide-react";

const assistanceItems: {
  key: keyof AssistanceOptions;
  label: string;
  description: string;
  icon: typeof Luggage;
}[] = [
  { key: "suitcases", label: "Luggage Help", description: "Driver assists with bags", icon: Luggage },
  { key: "childSeat", label: "Child Seat", description: "Secured child seating", icon: Baby },
  { key: "wheelchair", label: "Wheelchair", description: "Accessible vehicle", icon: Accessibility },
  { key: "pet", label: "Pet Friendly", description: "Pets welcome on board", icon: PawPrint },
];

export const AssistanceSelector = () => {
  const assistance = useBookingStore((s) => s.assistance);
  const toggleAssistance = useBookingStore((s) => s.toggleAssistance);

  const activeCount = Object.values(assistance).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Need assistance?
        </h2>
        <p className="text-sm text-white/40 mt-1">
          Select any special requirements — no extra charge
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {assistanceItems.map((item) => {
          const active = assistance[item.key];
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => toggleAssistance(item.key)}
              className={cn(
                "relative flex flex-col items-center gap-2 p-5 rounded-2xl border transition-all duration-300",
                "text-center group",
                active
                  ? "bg-amber-400/10 border-amber-400/40"
                  : "bg-white/6 border-white/10 hover:bg-white/8 hover:border-white/20"
              )}
            >
              {active && (
                <div className="absolute top-2.5 right-2.5 size-5 rounded-full bg-amber-400 flex items-center justify-center">
                  <Check className="size-3 text-[#0a0a0f]" />
                </div>
              )}

              <div
                className={cn(
                  "size-10 rounded-xl flex items-center justify-center transition-colors duration-300",
                  active
                    ? "bg-amber-400/20 text-amber-400"
                    : "bg-white/10 text-white/50"
                )}
              >
                <item.icon className="size-5" />
              </div>
              <div>
                <span className={cn(
                  "text-sm font-medium block transition-colors duration-300",
                  active ? "text-white" : "text-white/70"
                )}>
                  {item.label}
                </span>
                <span className="text-[11px] text-white/30">{item.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      {activeCount > 0 && (
        <p className="text-xs text-amber-400/60 text-center">
          {activeCount} assistance option{activeCount > 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
};
