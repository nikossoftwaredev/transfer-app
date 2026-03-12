"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  User,
  Car,
  Phone,
  CreditCard,
  Star,
  MapPin,
  CalendarDays,
  Palette,
  Hash,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface DriverProfileProps {
  driver: {
    id: string;
    licenseNo: string | null;
    availability: string;
    inviteStatus: string;
    vehicleMake: string | null;
    vehicleModel: string | null;
    vehicleYear: number | null;
    vehicleColor: string | null;
    photoUrl: string | null;
    user: {
      name: string;
      phone: string | null;
      image: string | null;
      org: { name: string } | null;
    };
    vehicle: {
      plateNumber: string;
      year: number | null;
      vehicleClass: { name: string };
    } | null;
  };
  stats: {
    totalTrips: number;
    avgRating: number | null;
    reviewCount: number;
    memberSince: Date | string;
  };
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export const DriverProfile = ({ driver, stats }: DriverProfileProps) => {
  const router = useRouter();
  const isOnline = driver.availability === "online";
  const photo = driver.photoUrl || driver.user.image;

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4">
      {/* Back button + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex size-9 items-center justify-center rounded-full bg-muted transition-colors duration-300 hover:bg-muted/70"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-xl font-bold">My Profile</h1>
      </div>

      {/* Profile header */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <Avatar className="size-24 ring-2 ring-border ring-offset-2 ring-offset-background transition-all duration-300">
          {photo && <AvatarImage src={photo} alt={driver.user.name} />}
          <AvatarFallback className="text-2xl font-semibold">
            {getInitials(driver.user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-lg font-semibold">{driver.user.name}</h2>
          <Badge
            variant={isOnline ? "default" : "secondary"}
            className="transition-colors duration-300"
          >
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
      </div>

      {/* Personal Info */}
      <Card className="transition-shadow duration-300 hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4" />
            Personal Info
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <InfoRow icon={User} label="Name" value={driver.user.name} />
          <InfoRow icon={Phone} label="Phone" value={driver.user.phone} />
          <InfoRow icon={CreditCard} label="License" value={driver.licenseNo} />
        </CardContent>
      </Card>

      {/* Vehicle */}
      <Card className="transition-shadow duration-300 hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="size-4" />
            Vehicle
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {driver.vehicle && (
            <InfoRow
              icon={Car}
              label="Class"
              value={driver.vehicle.vehicleClass.name}
            />
          )}
          <InfoRow icon={Car} label="Make" value={driver.vehicleMake} />
          <InfoRow icon={Car} label="Model" value={driver.vehicleModel} />
          <InfoRow
            icon={CalendarDays}
            label="Year"
            value={driver.vehicleYear ?? driver.vehicle?.year}
          />
          <InfoRow icon={Palette} label="Color" value={driver.vehicleColor} />
          {driver.vehicle && (
            <InfoRow
              icon={Hash}
              label="Plate"
              value={driver.vehicle.plateNumber}
            />
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="transition-shadow duration-300 hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="size-4" />
            Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <InfoRow
            icon={Car}
            label="Total trips"
            value={stats.totalTrips.toLocaleString()}
          />
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="size-4" />
              <span className="text-sm">Rating</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-3.5 ${
                      i < Math.round(stats.avgRating ?? 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">
                {stats.avgRating?.toFixed(1) ?? "—"}
              </span>
              <span className="text-xs text-muted-foreground">
                ({stats.reviewCount} reviews)
              </span>
            </div>
          </div>
          <InfoRow
            icon={CalendarDays}
            label="Member since"
            value={formatDate(stats.memberSince)}
          />
        </CardContent>
      </Card>
    </div>
  );
};
