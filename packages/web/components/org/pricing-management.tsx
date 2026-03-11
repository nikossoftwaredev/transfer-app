"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Loader2, Calculator } from "lucide-react";
import { upsertPricingRule } from "@/server_actions/pricing";
import { toast } from "sonner";

interface PricingRule {
  id: string;
  vehicleClassId: string;
  minimumFare: number;
  ratePerKm: number;
  nightMultiplier: number;
  airportFixedRate: number | null;
  freeWaitingMinutes: number;
  waitingRatePerMin: number;
  extraStopFee: number;
  vehicleClass: { id: string; name: string };
}

interface VehicleClassOption {
  id: string;
  name: string;
}

interface PricingManagementProps {
  pricingRules: PricingRule[];
  vehicleClasses: VehicleClassOption[];
}

const DEFAULT_RULE = {
  minimumFare: 8,
  ratePerKm: 1.2,
  nightMultiplier: 1.5,
  airportFixedRate: "",
  freeWaitingMinutes: 5,
  waitingRatePerMin: 0.3,
  extraStopFee: 3,
};

export const PricingManagement = ({
  pricingRules,
  vehicleClasses,
}: PricingManagementProps) => {
  const [isPending, startTransition] = useTransition();
  const [selectedClass, setSelectedClass] = useState(
    vehicleClasses[0]?.id || ""
  );

  const existingRule = pricingRules.find(
    (r) => r.vehicleClassId === selectedClass
  );

  const [form, setForm] = useState(() => {
    if (existingRule) {
      return {
        minimumFare: existingRule.minimumFare,
        ratePerKm: existingRule.ratePerKm,
        nightMultiplier: existingRule.nightMultiplier,
        airportFixedRate: existingRule.airportFixedRate?.toString() || "",
        freeWaitingMinutes: existingRule.freeWaitingMinutes,
        waitingRatePerMin: existingRule.waitingRatePerMin,
        extraStopFee: existingRule.extraStopFee,
      };
    }
    return DEFAULT_RULE;
  });

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    const rule = pricingRules.find((r) => r.vehicleClassId === classId);
    if (rule) {
      setForm({
        minimumFare: rule.minimumFare,
        ratePerKm: rule.ratePerKm,
        nightMultiplier: rule.nightMultiplier,
        airportFixedRate: rule.airportFixedRate?.toString() || "",
        freeWaitingMinutes: rule.freeWaitingMinutes,
        waitingRatePerMin: rule.waitingRatePerMin,
        extraStopFee: rule.extraStopFee,
      });
    } else {
      setForm(DEFAULT_RULE);
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await upsertPricingRule({
          vehicleClassId: selectedClass,
          minimumFare: form.minimumFare,
          ratePerKm: form.ratePerKm,
          nightMultiplier: form.nightMultiplier,
          airportFixedRate: form.airportFixedRate
            ? parseFloat(form.airportFixedRate)
            : null,
          freeWaitingMinutes: form.freeWaitingMinutes,
          waitingRatePerMin: form.waitingRatePerMin,
          extraStopFee: form.extraStopFee,
        });
        toast.success("Pricing rule saved");
      } catch {
        toast.error("Failed to save pricing rule");
      }
    });
  };

  // Preview calculator
  const previewDistance = 15; // km
  const baseFare = Math.max(
    form.minimumFare,
    form.ratePerKm * previewDistance
  );
  const dayFare = baseFare;
  const nightFare = baseFare * form.nightMultiplier;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pricing</h1>
        <p className="text-muted-foreground">
          Set fare rules per vehicle class. Only classes with pricing configured
          will appear in booking broadcasts.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Label>Vehicle Class</Label>
        <Select value={selectedClass} onValueChange={handleClassChange}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            {vehicleClasses.map((vc) => (
              <SelectItem key={vc.id} value={vc.id}>
                {vc.name}
                {pricingRules.some((r) => r.vehicleClassId === vc.id)
                  ? " ✓"
                  : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="size-5" />
              Fare Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Minimum Fare (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.minimumFare}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minimumFare: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Rate per km (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.ratePerKm}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ratePerKm: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Night Multiplier (×)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.nightMultiplier}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nightMultiplier: parseFloat(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div>
                <Label>Airport Fixed Rate (€, optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.airportFixedRate}
                  onChange={(e) =>
                    setForm({ ...form, airportFixedRate: e.target.value })
                  }
                  placeholder="Leave empty for formula"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Free Waiting (min)</Label>
                <Input
                  type="number"
                  value={form.freeWaitingMinutes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      freeWaitingMinutes: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Waiting Rate (€/min)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.waitingRatePerMin}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      waitingRatePerMin: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Extra Stop Fee (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.extraStopFee}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      extraStopFee: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={isPending || !selectedClass}
              className="w-full"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : existingRule ? (
                "Update Pricing"
              ) : (
                "Save Pricing"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="size-5" />
              Fare Preview ({previewDistance}km trip)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Day fare</span>
              <span className="font-bold">€{dayFare.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Night fare (00:00–06:00)
              </span>
              <span className="font-bold">€{nightFare.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                + 10 min waiting ({form.freeWaitingMinutes} free)
              </span>
              <span className="font-bold">
                €
                {(
                  Math.max(0, 10 - form.freeWaitingMinutes) *
                  form.waitingRatePerMin
                ).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">+ 2 extra stops</span>
              <span className="font-bold">
                €{(2 * form.extraStopFee).toFixed(2)}
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between text-lg">
              <span className="font-semibold">Total (day, 10min wait, 2 stops)</span>
              <span className="font-bold">
                €
                {(
                  dayFare +
                  Math.max(0, 10 - form.freeWaitingMinutes) *
                    form.waitingRatePerMin +
                  2 * form.extraStopFee
                ).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configured classes */}
      {pricingRules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configured Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pricingRules.map((r) => (
                <div
                  key={r.id}
                  className="rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-muted transition-colors duration-300"
                  onClick={() => handleClassChange(r.vehicleClassId)}
                >
                  <span className="font-medium">{r.vehicleClass.name}</span>
                  <span className="text-muted-foreground ml-2">
                    €{r.minimumFare} min / €{r.ratePerKm}/km
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
