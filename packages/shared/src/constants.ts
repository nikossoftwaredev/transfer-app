// ─── Enums ───────────────────────────────────────────────────────

export const OrgStatus = {
  PENDING: "pending",
  VERIFIED: "verified",
  SUSPENDED: "suspended",
} as const;
export type OrgStatus = (typeof OrgStatus)[keyof typeof OrgStatus];

export const UserRole = {
  SUPERADMIN: "superadmin",
  ORGADMIN: "orgadmin",
  DRIVER: "driver",
  CLIENT: "client",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const BookingStatus = {
  PENDING: "pending",
  DRIVER_ASSIGNED: "driver_assigned",
  DRIVER_EN_ROUTE: "driver_en_route",
  WAITING_AT_PICKUP: "waiting_at_pickup",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  TIMED_OUT: "timed_out",
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const DriverAvailability = {
  ONLINE: "online",
  OFFLINE: "offline",
  ON_TRIP: "on_trip",
} as const;
export type DriverAvailability =
  (typeof DriverAvailability)[keyof typeof DriverAvailability];

export const InviteStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
} as const;
export type InviteStatus = (typeof InviteStatus)[keyof typeof InviteStatus];

export const PaymentMethod = {
  CASH: "cash",
  POS: "pos",
} as const;
export type PaymentMethod =
  (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const VehicleStatus = {
  AVAILABLE: "available",
  ON_TRIP: "on_trip",
  MAINTENANCE: "maintenance",
} as const;
export type VehicleStatus =
  (typeof VehicleStatus)[keyof typeof VehicleStatus];

export const DevicePlatform = {
  ANDROID: "android",
  IOS: "ios",
  WEB: "web",
} as const;
export type DevicePlatform =
  (typeof DevicePlatform)[keyof typeof DevicePlatform];

// ─── Constants ───────────────────────────────────────────────────

export const BOOKING_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
export const GPS_INTERVAL_MS = 4_000; // 4 seconds
export const GPS_DB_WRITE_INTERVAL_MS = 30_000; // 30 seconds
export const GPS_MAX_ACCURACY_M = 50; // discard if accuracy > 50m
export const NIGHT_HOURS = { start: 0, end: 6 } as const; // 00:00–06:00
export const DEFAULT_COMMISSION_RATE = 0.15; // 15%
