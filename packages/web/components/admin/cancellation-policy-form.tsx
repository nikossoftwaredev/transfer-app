"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2 } from "lucide-react";
import { updateCancellationPolicy } from "@/server_actions/admin";
import { toast } from "sonner";

interface CancellationPolicyFormProps {
  policy: {
    freeWindowMinutes: number;
    lateCancelFeePercent: number;
    noShowFeePercent: number;
  };
}

export const CancellationPolicyForm = ({
  policy,
}: CancellationPolicyFormProps) => {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(policy);

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateCancellationPolicy(form);
        toast.success("Cancellation policy updated");
      } catch {
        toast.error("Failed to update policy");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Cancellation Policy</h1>
        <p className="text-muted-foreground">
          Configure platform-wide cancellation fees.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Policy Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Free Cancellation Window (minutes before pickup)</Label>
            <Input
              type="number"
              min={0}
              value={form.freeWindowMinutes}
              onChange={(e) =>
                setForm({
                  ...form,
                  freeWindowMinutes: parseInt(e.target.value) || 0,
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Clients can cancel for free up to this many minutes before the scheduled pickup.
            </p>
          </div>

          <div>
            <Label>Late Cancellation Fee (% of estimated fare)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={form.lateCancelFeePercent}
              onChange={(e) =>
                setForm({
                  ...form,
                  lateCancelFeePercent: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>

          <div>
            <Label>No-Show Fee (% of estimated fare)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={form.noShowFeePercent}
              onChange={(e) =>
                setForm({
                  ...form,
                  noShowFeePercent: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>

          <Button onClick={handleSave} disabled={isPending} className="w-full">
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Save Policy"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
