import type {
  BookingStatus,
  DevicePlatform,
  DriverAvailability,
  InviteStatus,
  OrgStatus,
  PaymentMethod,
  UserRole,
  VehicleStatus,
} from "../constants";

// ─── Organization ────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  contactEmail: string;
  status: OrgStatus;
  commissionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── User ────────────────────────────────────────────────────────

export interface User {
  id: string;
  orgId: string | null;
  role: UserRole;
  name: string;
  phone: string | null;
  email: string | null;
  image: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Device Token ────────────────────────────────────────────────

export interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: DevicePlatform;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Vehicle Class ───────────────────────────────────────────────

export interface VehicleClass {
  id: string;
  name: string;
  tags: string[];
  capacity: number;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Vehicle ─────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  orgId: string;
  vehicleClassId: string;
  plateNumber: string;
  year: number | null;
  photoUrl: string | null;
  status: VehicleStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Driver ──────────────────────────────────────────────────────

export interface Driver {
  id: string;
  userId: string;
  vehicleId: string | null;
  licenseNo: string;
  photoUrl: string | null;
  availability: DriverAvailability;
  inviteStatus: InviteStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Booking Stop ────────────────────────────────────────────────

export interface BookingStop {
  address: string;
  lat: number;
  lng: number;
}

// ─── Booking ─────────────────────────────────────────────────────

export interface Booking {
  id: string;
  clientId: string;
  orgId: string | null;
  driverId: string | null;
  vehicleId: string | null;
  vehicleClassId: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  stops: BookingStop[] | null;
  scheduledAt: Date;
  passengerCount: number;
  luggageCount: number;
  specialInstructions: string | null;
  status: BookingStatus;
  timeoutAt: Date | null;
  estimatedDistanceKm: number | null;
  estimatedFareMin: number | null;
  estimatedFareMax: number | null;
  acceptedFare: number | null;
  actualDistanceKm: number | null;
  actualFare: number | null;
  waitingChargeAmount: number | null;
  paymentMethod: PaymentMethod | null;
  proxySessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Trip ────────────────────────────────────────────────────────

export interface Trip {
  id: string;
  bookingId: string;
  driverId: string;
  startedAt: Date;
  endedAt: Date | null;
  waitingStartedAt: Date | null;
  waitingEndedAt: Date | null;
  waitingMinutes: number | null;
  paymentConfirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Rating ──────────────────────────────────────────────────────

export interface Rating {
  id: string;
  bookingId: string;
  clientId: string;
  driverId: string;
  stars: number;
  comment: string | null;
  createdAt: Date;
}

// ─── Driver Location ─────────────────────────────────────────────

export interface DriverLocation {
  id: string;
  driverId: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  bearing: number | null;
  recordedAt: Date;
}

// ─── GPS Payload (Socket.IO) ─────────────────────────────────────

export interface GpsPayload {
  driverId: string;
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  bearing: number | null;
  timestamp: number; // Unix ms
}

// ─── Pricing Rule ────────────────────────────────────────────────

export interface PricingRule {
  id: string;
  orgId: string;
  vehicleClassId: string;
  minimumFare: number;
  ratePerKm: number;
  nightMultiplier: number;
  airportFixedRate: number | null;
  freeWaitingMinutes: number;
  waitingRatePerMin: number;
  extraStopFee: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Cancellation Policy ─────────────────────────────────────────

export interface CancellationPolicy {
  id: string;
  freeWindowMinutes: number;
  lateCancelFeePercent: number;
  noShowFeePercent: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Saved Location ──────────────────────────────────────────────

export interface SavedLocation {
  id: string;
  userId: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Audit Log ───────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
