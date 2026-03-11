"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Plus, Trash2, Loader2 } from "lucide-react";
import {
  createSavedLocation,
  deleteSavedLocation,
} from "@/server_actions/saved-locations";
import { toast } from "sonner";

interface SavedLocation {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
}

interface SavedLocationsListProps {
  locations: SavedLocation[];
}

export const SavedLocationsList = ({
  locations,
}: SavedLocationsListProps) => {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ label: "", address: "", lat: 0, lng: 0 });

  const handleSave = () => {
    if (!form.label || !form.address) {
      toast.error("Label and address are required");
      return;
    }
    startTransition(async () => {
      try {
        await createSavedLocation(form);
        toast.success("Location saved");
        setDialogOpen(false);
        setForm({ label: "", address: "", lat: 0, lng: 0 });
      } catch {
        toast.error("Failed to save location");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteSavedLocation(id);
        toast.success("Location removed");
      } catch {
        toast.error("Failed to remove location");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Saved Locations</h1>
          <p className="text-muted-foreground">
            Quick access to your favorite addresses.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Add Location
        </Button>
      </div>

      <div className="grid gap-3">
        {locations.map((loc) => (
          <Card key={loc.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <MapPin className="size-5 text-primary" />
                <div>
                  <p className="font-medium">{loc.label}</p>
                  <p className="text-sm text-muted-foreground">{loc.address}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(loc.id)}
                disabled={isPending}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {locations.length === 0 && (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              No saved locations yet.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save a Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Label</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Home, Office, Airport..."
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Enter full address"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Save Location"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
