import { z } from "zod";

import {
  BookingStatus,
  DevicePlatform,
  DriverAvailability,
  InviteStatus,
  OrgStatus,
  PaymentMethod,
  UserRole,
  VehicleStatus,
} from "./constants";

// ─── Helpers ─────────────────────────────────────────────────────

const enumValues = <T extends Record<string, string>>(obj: T) =>
  Object.values(obj) as [string, ...string[]];

// ─── Organization ────────────────────────────────────────────────

export const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
  contactEmail: z.string().email(),
});

export const updateOrgSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  contactEmail: z.string().email().optional(),
  status: z.enum(enumValues(OrgStatus)).optional(),
  commissionRate: z.number().min(0).max(1).optional(),
});

// ─── Vehicle Class ───────────────────────────────────────────────

export const createVehicleClassSchema = z.object({
  name: z.string().min(2).max(100),
  tags: z.array(z.string()).default([]),
  capacity: z.number().int().min(1).max(50),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateVehicleClassSchema = createVehicleClassSchema.partial();

// ─── Vehicle ─────────────────────────────────────────────────────

export const createVehicleSchema = z.object({
  vehicleClassId: z.string().cuid(),
  plateNumber: z.string().min(2).max(20),
  year: z.number().int().min(2000).max(2030).optional(),
  photoUrl: z.string().url().optional(),
});

export const updateVehicleSchema = z.object({
  vehicleClassId: z.string().cuid().optional(),
  plateNumber: z.string().min(2).max(20).optional(),
  year: z.number().int().min(2000).max(2030).optional(),
  photoUrl: z.string().url().optional(),
  status: z.enum(enumValues(VehicleStatus)).optional(),
});

// ─── Driver ──────────────────────────────────────────────────────

export const inviteDriverSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(8).max(20),
  licenseNo: z.string().min(2).max(50),
});

export const acceptInviteSchema = z.object({
  pin: z.string().length(4).regex(/^\d{4}$/, "PIN must be 4 digits"),
});

export const updateDriverSchema = z.object({
  vehicleId: z.string().cuid().nullable().optional(),
  licenseNo: z.string().min(2).max(50).optional(),
  photoUrl: z.string().url().optional(),
  availability: z.enum(enumValues(DriverAvailability)).optional(),
  inviteStatus: z.enum(enumValues(InviteStatus)).optional(),
});

// ─── Booking ─────────────────────────────────────────────────────

const bookingStopSchema = z.object({
  address: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const createBookingSchema = z.object({
  vehicleClassId: z.string().cuid(),
  pickupAddress: z.string().min(1),
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  dropoffAddress: z.string().min(1),
  dropoffLat: z.number().min(-90).max(90),
  dropoffLng: z.number().min(-180).max(180),
  stops: z.array(bookingStopSchema).max(5).optional(),
  scheduledAt: z.coerce.date(),
  passengerCount: z.number().int().min(1).max(50).default(1),
  luggageCount: z.number().int().min(0).max(20).default(0),
  specialInstructions: z.string().max(500).optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(enumValues(BookingStatus)),
});

export const acceptBookingSchema = z.object({
  bookingId: z.string().cuid(),
});

// ─── Pricing ─────────────────────────────────────────────────────

export const updatePricingSchema = z.object({
  vehicleClassId: z.string().cuid(),
  minimumFare: z.number().min(0),
  ratePerKm: z.number().min(0),
  nightMultiplier: z.number().min(1).default(1.5),
  airportFixedRate: z.number().min(0).nullable().optional(),
  freeWaitingMinutes: z.number().int().min(0).default(5),
  waitingRatePerMin: z.number().min(0).default(0.3),
  extraStopFee: z.number().min(0).default(3.0),
});

// ─── Cancellation Policy ─────────────────────────────────────────

export const updateCancellationPolicySchema = z.object({
  freeWindowMinutes: z.number().int().min(0),
  lateCancelFeePercent: z.number().min(0).max(1),
  noShowFeePercent: z.number().min(0).max(1),
});

// ─── Rating ──────────────────────────────────────────────────────

export const createRatingSchema = z.object({
  bookingId: z.string().cuid(),
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// ─── Saved Location ──────────────────────────────────────────────

export const createSavedLocationSchema = z.object({
  label: z.string().min(1).max(50),
  address: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// ─── Device Token ────────────────────────────────────────────────

export const registerDeviceTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(enumValues(DevicePlatform)),
});

// ─── GPS Payload ─────────────────────────────────────────────────

export const gpsPayloadSchema = z.object({
  driverId: z.string(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0),
  speed: z.number().nullable(),
  bearing: z.number().nullable(),
  timestamp: z.number(),
});

// ─── Re-export enum validators for convenience ───────────────────

export {
  BookingStatus,
  DevicePlatform,
  DriverAvailability,
  InviteStatus,
  OrgStatus,
  PaymentMethod,
  UserRole,
  VehicleStatus,
};
