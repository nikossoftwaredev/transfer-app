# TransferGR Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a B2B corporate transfer platform with real-time GPS tracking, multi-org booking, fleet dispatch, and driver mobile app.

**Architecture:** pnpm monorepo with 3 packages: `web` (Next.js 16), `ws-server` (Socket.IO + Redis), `shared` (types + validation). Capacitor wraps the driver routes for native GPS. Supabase Postgres for data, Vercel + Hetzner for hosting.

**Tech Stack:** Next.js 16, NextAuth 4, Prisma, Socket.IO, Redis, Capacitor, Google Maps/Routes/Roads APIs, Twilio, Zustand, Zod, TypeScript.

**Design doc:** `docs/plans/2026-03-10-transfergr-architecture-design.md`

---

## Milestone 1: Monorepo Setup + Database Schema (Week 1)

### Task 1.1: Restructure into pnpm monorepo

**Files:**
- Modify: `pnpm-workspace.yaml`
- Create: `packages/web/` (move entire codebase here)
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/ws-server/package.json`
- Create: `packages/ws-server/tsconfig.json`
- Create: `packages/ws-server/src/index.ts`

**Step 1: Create the packages directory structure**

```bash
mkdir -p packages/shared/src packages/ws-server/src
```

**Step 2: Move existing codebase into packages/web**

Move everything except `node_modules`, `.git`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, and `docs/` into `packages/web/`:

```bash
# Create packages/web
mkdir -p packages/web

# Move all project files (not git/pnpm root files) into packages/web
# List of top-level items to move:
mv app components hooks lib messages public server_actions tasks types prompts \
   .env.template CLAUDE.md README.md package.json tsconfig.json next.config.ts \
   proxy.ts eslint.config.mjs postcss.config.mjs components.json global.d.ts \
   screenshot.mjs packages/web/
```

**Step 3: Update pnpm-workspace.yaml**

```yaml
packages:
  - packages/*
ignoredBuiltDependencies:
  - sharp
  - unrs-resolver
```

**Step 4: Create packages/shared/package.json**

```json
{
  "name": "@transfergr/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5",
    "zod": "^3.23.0"
  },
  "dependencies": {
    "zod": "^3.23.0"
  }
}
```

**Step 5: Create packages/shared/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**Step 6: Create packages/shared/src/index.ts**

```typescript
export * from "./types";
export * from "./constants";
export * from "./validation";
```

**Step 7: Create packages/ws-server/package.json**

```json
{
  "name": "@transfergr/ws-server",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@transfergr/shared": "workspace:*",
    "socket.io": "^4.8.0",
    "ioredis": "^5.4.0",
    "jsonwebtoken": "^9.0.0",
    "@socket.io/redis-adapter": "^8.3.0"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.0",
    "typescript": "^5",
    "tsx": "^4.19.0"
  }
}
```

**Step 8: Create packages/ws-server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {
      "@transfergr/shared": ["../shared/src"]
    }
  },
  "include": ["src/**/*"],
  "references": [{ "path": "../shared" }]
}
```

**Step 9: Create packages/ws-server/src/index.ts (placeholder)**

```typescript
import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: process.env.WEB_URL ?? "http://localhost:3000" },
});

const PORT = Number(process.env.PORT) || 3001;

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`WS server running on port ${PORT}`);
});
```

**Step 10: Add @transfergr/shared dependency to packages/web/package.json**

Add to the web package's dependencies:
```json
"@transfergr/shared": "workspace:*"
```

**Step 11: Update packages/web/tsconfig.json paths**

Add to compilerOptions.paths:
```json
"@transfergr/shared": ["../shared/src"]
```

**Step 12: Install all dependencies**

```bash
pnpm install
```

**Step 13: Verify web app still works**

```bash
cd packages/web && pnpm dev
# Verify http://localhost:3000 loads correctly
```

**Step 14: Commit**

```bash
git add -A
git commit -m "refactor: restructure into pnpm monorepo with web, ws-server, shared packages"
```

---

### Task 1.2: Create shared types and constants

**Files:**
- Create: `packages/shared/src/types/index.ts`
- Create: `packages/shared/src/types/organization.ts`
- Create: `packages/shared/src/types/user.ts`
- Create: `packages/shared/src/types/vehicle.ts`
- Create: `packages/shared/src/types/booking.ts`
- Create: `packages/shared/src/types/trip.ts`
- Create: `packages/shared/src/types/driver.ts`
- Create: `packages/shared/src/types/gps.ts`
- Create: `packages/shared/src/constants.ts`
- Create: `packages/shared/src/validation.ts`

**Step 1: Create type files**

`packages/shared/src/types/organization.ts`:
```typescript
export interface Organization {
  id: string;
  name: string;
  contactEmail: string;
  status: OrganizationStatus;
  pricingTier: string;
  createdAt: Date;
  updatedAt: Date;
}

export type OrganizationStatus = "active" | "suspended";
```

`packages/shared/src/types/user.ts`:
```typescript
export interface User {
  id: string;
  orgId: string | null;
  role: UserRole;
  name: string;
  phone: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = "superadmin" | "orgadmin" | "booker" | "driver";
```

`packages/shared/src/types/vehicle.ts`:
```typescript
export interface Vehicle {
  id: string;
  orgId: string | null;
  plateNumber: string;
  type: VehicleType;
  capacity: number;
  status: VehicleStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type VehicleType = "sedan" | "minivan" | "minibus";
export type VehicleStatus = "available" | "on_trip" | "maintenance";
```

`packages/shared/src/types/booking.ts`:
```typescript
export interface Booking {
  id: string;
  orgId: string;
  bookerId: string;
  driverId: string | null;
  vehicleId: string | null;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  scheduledAt: Date;
  passengerCount: number;
  vehicleTypePreference: string | null;
  specialInstructions: string | null;
  status: BookingStatus;
  estimatedDistanceKm: number | null;
  estimatedFare: number | null;
  actualDistanceKm: number | null;
  actualFare: number | null;
  paymentMethod: PaymentMethod | null;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "driver_assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

export type PaymentMethod = "cash" | "pos";
```

`packages/shared/src/types/trip.ts`:
```typescript
export interface Trip {
  id: string;
  bookingId: string;
  driverId: string;
  startedAt: Date;
  endedAt: Date | null;
  paymentConfirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

`packages/shared/src/types/driver.ts`:
```typescript
export interface Driver {
  id: string;
  userId: string;
  vehicleId: string | null;
  licenseNo: string;
  availability: DriverAvailability;
  createdAt: Date;
  updatedAt: Date;
}

export type DriverAvailability = "online" | "offline" | "on_trip";
```

`packages/shared/src/types/gps.ts`:
```typescript
export interface GpsUpdate {
  driverId: string;
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  bearing: number | null;
  timestamp: number; // Unix ms
}

export interface GpsBatch {
  driverId: string;
  points: GpsUpdate[];
}
```

`packages/shared/src/types/index.ts`:
```typescript
export * from "./organization";
export * from "./user";
export * from "./vehicle";
export * from "./booking";
export * from "./trip";
export * from "./driver";
export * from "./gps";
```

**Step 2: Create constants**

`packages/shared/src/constants.ts`:
```typescript
export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "driver_assigned",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export const USER_ROLES = ["superadmin", "orgadmin", "booker", "driver"] as const;
export const VEHICLE_TYPES = ["sedan", "minivan", "minibus"] as const;
export const VEHICLE_STATUSES = ["available", "on_trip", "maintenance"] as const;
export const DRIVER_AVAILABILITIES = ["online", "offline", "on_trip"] as const;
export const PAYMENT_METHODS = ["cash", "pos"] as const;
export const ORGANIZATION_STATUSES = ["active", "suspended"] as const;

// GPS config
export const GPS_UPDATE_INTERVAL_MS = 4000;
export const GPS_PERSIST_INTERVAL_MS = 30000;
export const GPS_MAX_ACCURACY_METERS = 50;

// Socket.IO events
export const WS_EVENTS = {
  GPS_UPDATE: "gps:update",
  GPS_BATCH: "gps:batch",
  DRIVER_LOCATION: "driver:location",
  TRIP_START: "trip:start",
  TRIP_END: "trip:end",
} as const;
```

**Step 3: Create Zod validation schemas**

`packages/shared/src/validation.ts`:
```typescript
import { z } from "zod";
import {
  BOOKING_STATUSES,
  DRIVER_AVAILABILITIES,
  ORGANIZATION_STATUSES,
  PAYMENT_METHODS,
  USER_ROLES,
  VEHICLE_STATUSES,
  VEHICLE_TYPES,
} from "./constants";

export const gpsUpdateSchema = z.object({
  driverId: z.string(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0),
  speed: z.number().nullable(),
  bearing: z.number().nullable(),
  timestamp: z.number(),
});

export const gpsBatchSchema = z.object({
  driverId: z.string(),
  points: z.array(gpsUpdateSchema),
});

export const createBookingSchema = z.object({
  orgId: z.string(),
  pickupAddress: z.string().min(1),
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  dropoffAddress: z.string().min(1),
  dropoffLat: z.number().min(-90).max(90),
  dropoffLng: z.number().min(-180).max(180),
  scheduledAt: z.string().datetime(),
  passengerCount: z.number().int().min(1).max(50),
  vehicleTypePreference: z.enum(VEHICLE_TYPES).nullable().optional(),
  specialInstructions: z.string().nullable().optional(),
});

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(255),
  contactEmail: z.string().email(),
  pricingTier: z.string().default("standard"),
});

export const createVehicleSchema = z.object({
  plateNumber: z.string().min(1).max(20),
  type: z.enum(VEHICLE_TYPES),
  capacity: z.number().int().min(1).max(50),
});

export const createDriverSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  pin: z.string().min(4).max(6),
  licenseNo: z.string().min(1),
  vehicleId: z.string().nullable().optional(),
});

export const assignDriverSchema = z.object({
  bookingId: z.string(),
  driverId: z.string(),
  vehicleId: z.string(),
  estimatedFare: z.number().min(0).optional(),
});

export const updateBookingStatusSchema = z.object({
  bookingId: z.string(),
  status: z.enum(BOOKING_STATUSES),
});

export const confirmPaymentSchema = z.object({
  tripId: z.string(),
  paymentMethod: z.enum(PAYMENT_METHODS),
});
```

**Step 4: Verify typecheck**

```bash
cd packages/shared && pnpm typecheck
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add shared types, constants, and Zod validation schemas"
```

---

### Task 1.3: Expand Prisma schema for TransferGR

**Files:**
- Modify: `packages/web/lib/db/schema.prisma`

**Step 1: Replace the Prisma schema with the full TransferGR data model**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Organization {
  id           String   @id @default(cuid())
  name         String
  contactEmail String   @map("contact_email")
  status       String   @default("active")
  pricingTier  String   @default("standard") @map("pricing_tier")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  users        User[]
  bookings     Booking[]
  vehicles     Vehicle[]
  pricingRules PricingRule[]

  @@map("organizations")
}

model User {
  id            String    @id @default(cuid())
  orgId         String?   @map("org_id")
  role          String    @default("booker")
  name          String
  phone         String?   @unique
  email         String?   @unique
  pinHash       String?   @map("pin_hash")
  image         String?
  emailVerified DateTime? @map("email_verified")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  org       Organization? @relation(fields: [orgId], references: [id])
  driver    Driver?
  bookings  Booking[]     @relation("BookerBookings")
  auditLogs AuditLog[]

  @@map("users")
}

model Vehicle {
  id          String   @id @default(cuid())
  orgId       String?  @map("org_id")
  plateNumber String   @unique @map("plate_number")
  type        String
  capacity    Int
  status      String   @default("available")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  org      Organization? @relation(fields: [orgId], references: [id])
  driver   Driver?
  bookings Booking[]

  @@map("vehicles")
}

model Driver {
  id           String   @id @default(cuid())
  userId       String   @unique @map("user_id")
  vehicleId    String?  @unique @map("vehicle_id")
  licenseNo    String   @map("license_no")
  availability String   @default("offline")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  user      User              @relation(fields: [userId], references: [id])
  vehicle   Vehicle?          @relation(fields: [vehicleId], references: [id])
  bookings  Booking[]
  locations DriverLocation[]
  trips     Trip[]

  @@map("drivers")
}

model Booking {
  id                    String   @id @default(cuid())
  orgId                 String   @map("org_id")
  bookerId              String   @map("booker_id")
  driverId              String?  @map("driver_id")
  vehicleId             String?  @map("vehicle_id")
  pickupAddress         String   @map("pickup_address")
  pickupLat             Float    @map("pickup_lat")
  pickupLng             Float    @map("pickup_lng")
  dropoffAddress        String   @map("dropoff_address")
  dropoffLat            Float    @map("dropoff_lat")
  dropoffLng            Float    @map("dropoff_lng")
  scheduledAt           DateTime @map("scheduled_at")
  passengerCount        Int      @default(1) @map("passenger_count")
  vehicleTypePreference String?  @map("vehicle_type_preference")
  specialInstructions   String?  @map("special_instructions")
  status                String   @default("pending")
  estimatedDistanceKm   Float?   @map("estimated_distance_km")
  estimatedFare         Float?   @map("estimated_fare")
  actualDistanceKm      Float?   @map("actual_distance_km")
  actualFare            Float?   @map("actual_fare")
  paymentMethod         String?  @map("payment_method")
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  org     Organization @relation(fields: [orgId], references: [id])
  booker  User         @relation("BookerBookings", fields: [bookerId], references: [id])
  driver  Driver?      @relation(fields: [driverId], references: [id])
  vehicle Vehicle?     @relation(fields: [vehicleId], references: [id])
  trip    Trip?

  @@index([orgId])
  @@index([driverId])
  @@index([status])
  @@map("bookings")
}

model Trip {
  id               String    @id @default(cuid())
  bookingId        String    @unique @map("booking_id")
  driverId         String    @map("driver_id")
  startedAt        DateTime  @default(now()) @map("started_at")
  endedAt          DateTime? @map("ended_at")
  paymentConfirmed Boolean   @default(false) @map("payment_confirmed")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  booking Booking @relation(fields: [bookingId], references: [id])
  driver  Driver  @relation(fields: [driverId], references: [id])

  @@map("trips")
}

model DriverLocation {
  id         String   @id @default(cuid())
  driverId   String   @map("driver_id")
  lat        Float
  lng        Float
  accuracy   Float?
  speed      Float?
  bearing    Float?
  recordedAt DateTime @default(now()) @map("recorded_at")

  driver Driver @relation(fields: [driverId], references: [id])

  @@index([driverId, recordedAt])
  @@map("driver_locations")
}

model PricingRule {
  id               String  @id @default(cuid())
  orgId            String? @map("org_id")
  vehicleType      String  @map("vehicle_type")
  baseFare         Float   @map("base_fare")
  ratePerKm        Float   @map("rate_per_km")
  ratePerMin        Float   @map("rate_per_min")
  nightMultiplier  Float   @default(1.0) @map("night_multiplier")
  airportFixedRate Float?  @map("airport_fixed_rate")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  org Organization? @relation(fields: [orgId], references: [id])

  @@unique([orgId, vehicleType])
  @@map("pricing_rules")
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  action    String
  entity    String
  entityId  String   @map("entity_id")
  metadata  Json?
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id])

  @@index([entity, entityId])
  @@index([userId])
  @@map("audit_logs")
}
```

**Step 2: Generate Prisma client**

```bash
cd packages/web && npx prisma generate
```

**Step 3: Create migration**

```bash
cd packages/web && npx prisma migrate dev --name init_transfergr_schema
```

**Step 4: Verify**

```bash
cd packages/web && npx prisma studio
# Check all tables exist with correct columns
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add full TransferGR database schema with organizations, vehicles, bookings, trips, drivers"
```

---

### Task 1.4: Add credentials provider to NextAuth for driver login

**Files:**
- Modify: `packages/web/lib/auth/auth.ts`
- Create: `packages/web/lib/auth/pin.ts`

**Step 1: Create PIN hashing utility**

`packages/web/lib/auth/pin.ts`:
```typescript
import { createHash } from "crypto";

export const hashPin = (pin: string): string => {
  return createHash("sha256").update(pin).digest("hex");
};

export const verifyPin = (pin: string, hash: string): boolean => {
  return hashPin(pin) === hash;
};
```

**Step 2: Add CredentialsProvider to NextAuth config**

Add to `packages/web/lib/auth/auth.ts`:

```typescript
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPin } from "./pin";

// Add to providers array:
CredentialsProvider({
  id: "driver-login",
  name: "Driver Login",
  credentials: {
    phone: { label: "Phone", type: "tel" },
    pin: { label: "PIN", type: "password" },
  },
  async authorize(credentials) {
    if (!credentials?.phone || !credentials?.pin) return null;

    const user = await prisma.user.findUnique({
      where: { phone: credentials.phone as string },
      include: { driver: true },
    });

    if (!user || user.role !== "driver" || !user.pinHash) return null;
    if (!verifyPin(credentials.pin as string, user.pinHash)) return null;

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      orgId: user.orgId,
    };
  },
}),
```

**Step 3: Update JWT and session callbacks to include role and orgId**

In the jwt callback:
```typescript
async jwt({ token, user }) {
  if (user) {
    token.role = user.role;
    token.orgId = user.orgId;
  }
  return token;
},
```

In the session callback:
```typescript
async session({ session, token }) {
  if (session.user) {
    session.user.id = token.sub!;
    session.user.role = token.role as string;
    session.user.orgId = token.orgId as string | null;
  }
  return session;
},
```

**Step 4: Extend NextAuth types**

In `packages/web/types/next-auth.d.ts`:
```typescript
import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    orgId?: string | null;
    phone?: string | null;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      orgId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    orgId?: string | null;
  }
}
```

**Step 5: Verify typecheck**

```bash
cd packages/web && pnpm tsc --noEmit
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add credentials provider for driver phone+PIN login alongside Google OAuth"
```

---

## Milestone 2: Auth + Organization Management (Weeks 2-3)

### Task 2.1: Role-based route protection middleware

**Files:**
- Modify: `packages/web/proxy.ts`
- Create: `packages/web/lib/auth/middleware.ts`

**Step 1: Create role-checking middleware helper**

`packages/web/lib/auth/middleware.ts`:
```typescript
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const ROUTE_ROLES: Record<string, string[]> = {
  "/admin": ["superadmin", "orgadmin"],
  "/dashboard": ["orgadmin", "booker"],
  "/driver": ["driver"],
};

export const withRoleProtection = async (request: NextRequest) => {
  const token = await getToken({ req: request });
  const pathname = request.nextUrl.pathname;

  // Strip locale prefix (e.g., /en/admin → /admin)
  const pathWithoutLocale = pathname.replace(/^\/(en|el)/, "");

  for (const [route, roles] of Object.entries(ROUTE_ROLES)) {
    if (pathWithoutLocale.startsWith(route)) {
      if (!token) {
        return NextResponse.redirect(new URL("/auth/signin", request.url));
      }
      if (!roles.includes(token.role as string)) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  return null; // Allow through
};
```

**Step 2: Integrate into proxy.ts**

Add role protection to the existing i18n middleware chain in `proxy.ts`.

**Step 3: Verify by accessing /admin without auth → redirect to signin**

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add role-based route protection middleware"
```

---

### Task 2.2: Super Admin — Organization CRUD

**Files:**
- Create: `packages/web/app/[locale]/admin/organizations/page.tsx`
- Create: `packages/web/app/[locale]/admin/organizations/columns.tsx`
- Create: `packages/web/components/admin/organizations/org-table.tsx`
- Create: `packages/web/components/admin/organizations/org-form-dialog.tsx`
- Create: `packages/web/server_actions/organizations.ts`

**Step 1: Create server actions for organization CRUD**

`packages/web/server_actions/organizations.ts`:
```typescript
"use server";

import { prisma } from "@/lib/db/prisma";
import { createOrganizationSchema } from "@transfergr/shared";
import { revalidatePath } from "next/cache";

export const getOrganizations = async () => {
  return prisma.organization.findMany({
    include: { _count: { select: { users: true, bookings: true } } },
    orderBy: { createdAt: "desc" },
  });
};

export const createOrganization = async (data: unknown) => {
  const parsed = createOrganizationSchema.parse(data);
  const org = await prisma.organization.create({ data: parsed });
  revalidatePath("/admin/organizations");
  return org;
};

export const updateOrganization = async (id: string, data: unknown) => {
  const parsed = createOrganizationSchema.partial().parse(data);
  const org = await prisma.organization.update({ where: { id }, data: parsed });
  revalidatePath("/admin/organizations");
  return org;
};

export const toggleOrganizationStatus = async (id: string) => {
  const org = await prisma.organization.findUniqueOrThrow({ where: { id } });
  const newStatus = org.status === "active" ? "suspended" : "active";
  await prisma.organization.update({ where: { id }, data: { status: newStatus } });
  revalidatePath("/admin/organizations");
};

export const deleteOrganization = async (id: string) => {
  await prisma.organization.delete({ where: { id } });
  revalidatePath("/admin/organizations");
};
```

**Step 2: Create organization list page with shadcn/ui DataTable**

Install shadcn Table component:
```bash
cd packages/web && npx shadcn@latest add table
```

Build the org management page with:
- Table listing all organizations (name, email, status, user count, booking count)
- "New Organization" button → dialog with form (name, email, pricing tier)
- Row actions: edit, suspend/activate, delete (with confirm dialog)
- Search/filter by name

**Step 3: Add translations to messages/en.json and messages/el.json**

**Step 4: Screenshot and verify the page renders correctly**

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add organization CRUD in super admin panel"
```

---

### Task 2.3: Super Admin — User Management per Organization

**Files:**
- Create: `packages/web/app/[locale]/admin/organizations/[orgId]/page.tsx`
- Create: `packages/web/components/admin/organizations/user-table.tsx`
- Create: `packages/web/components/admin/organizations/user-form-dialog.tsx`
- Create: `packages/web/server_actions/users.ts`

**Step 1: Create server actions for user CRUD**

- `getOrgUsers(orgId)` — list users for an org
- `createOrgUser(orgId, data)` — create orgadmin or booker
- `updateUser(id, data)` — edit user details
- `deleteUser(id)` — remove user

**Step 2: Build org detail page**

- Shows org info at top
- Tab layout: Users | Bookings | Pricing
- Users tab: table of org users with role badges
- "Add User" button → dialog (name, email, role: orgadmin/booker)

**Step 3: Screenshot and verify**

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add user management per organization in admin panel"
```

---

### Task 2.4: Super Admin — Fleet Management (Vehicles + Drivers)

**Files:**
- Create: `packages/web/app/[locale]/admin/fleet/page.tsx`
- Create: `packages/web/app/[locale]/admin/fleet/vehicles/page.tsx`
- Create: `packages/web/app/[locale]/admin/fleet/drivers/page.tsx`
- Create: `packages/web/components/admin/fleet/vehicle-table.tsx`
- Create: `packages/web/components/admin/fleet/vehicle-form-dialog.tsx`
- Create: `packages/web/components/admin/fleet/driver-table.tsx`
- Create: `packages/web/components/admin/fleet/driver-form-dialog.tsx`
- Create: `packages/web/server_actions/vehicles.ts`
- Create: `packages/web/server_actions/drivers.ts`

**Step 1: Create vehicle server actions**

- `getVehicles()` — list all vehicles with assigned driver
- `createVehicle(data)` — add vehicle (plate, type, capacity)
- `updateVehicle(id, data)` — edit
- `setVehicleStatus(id, status)` — available/maintenance
- `deleteVehicle(id)` — remove

**Step 2: Create driver server actions**

- `getDrivers()` — list all drivers with user info and vehicle
- `createDriver(data)` — creates User (role=driver) + Driver record + hashes PIN
- `updateDriver(id, data)` — edit
- `assignVehicle(driverId, vehicleId)` — link driver to vehicle
- `resetDriverPin(driverId, newPin)` — reset PIN
- `deleteDriver(id)` — remove

**Step 3: Build vehicles page**

- Table: plate number, type, capacity, status, assigned driver
- Add/edit/delete vehicle dialogs
- Status toggle (available ↔ maintenance)

**Step 4: Build drivers page**

- Table: name, phone, license, vehicle, availability status
- Add driver dialog (name, phone, PIN, license, optional vehicle assignment)
- Assign/unassign vehicle
- Reset PIN action

**Step 5: Screenshot and verify both pages**

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add fleet management — vehicles and drivers CRUD"
```

---

## Milestone 3: Booking Flow (Weeks 4-5)

### Task 3.1: Google Places autocomplete component

**Files:**
- Create: `packages/web/components/address-autocomplete.tsx`
- Create: `packages/web/lib/google-maps/loader.ts`

**Step 1: Install Google Maps packages**

```bash
cd packages/web && pnpm add @vis.gl/react-google-maps @googlemaps/js-api-loader
```

**Step 2: Create Google Maps loader utility**

`packages/web/lib/google-maps/loader.ts`:
```typescript
import { Loader } from "@googlemaps/js-api-loader";

let loaderInstance: Loader | null = null;

export const getGoogleMapsLoader = () => {
  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: "weekly",
      libraries: ["places", "geometry", "marker"],
    });
  }
  return loaderInstance;
};
```

**Step 3: Build AddressAutocomplete component**

A controlled input with Google Places Autocomplete that:
- Shows suggestions as user types
- Returns `{ address: string, lat: number, lng: number }` on selection
- Works within Greece by default (bias results)
- Uses shadcn/ui Input styling

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Google Places address autocomplete component"
```

---

### Task 3.2: Client booking portal — Create booking

**Files:**
- Create: `packages/web/app/[locale]/dashboard/page.tsx`
- Create: `packages/web/app/[locale]/dashboard/layout.tsx`
- Create: `packages/web/app/[locale]/dashboard/bookings/page.tsx`
- Create: `packages/web/app/[locale]/dashboard/bookings/new/page.tsx`
- Create: `packages/web/components/dashboard/booking-form.tsx`
- Create: `packages/web/components/dashboard/booking-map-preview.tsx`
- Create: `packages/web/server_actions/bookings.ts`

**Step 1: Create dashboard layout**

Reuse admin layout pattern but with dashboard-specific sidebar:
- Navigation: Dashboard Home, Bookings, Settings
- Shows org name in header

**Step 2: Create booking server actions**

```typescript
"use server";

export const createBooking = async (data: unknown) => {
  // Validate with createBookingSchema
  // Call Google Routes API for distance estimate
  // Calculate estimated fare from pricing rules
  // Create booking in DB
  // Return booking with estimate
};

export const getOrgBookings = async (orgId: string) => {
  // List bookings for org, ordered by scheduledAt desc
  // Include driver and vehicle info
};

export const cancelBooking = async (bookingId: string) => {
  // Check booking belongs to user's org
  // Check cancellation lead time rules
  // Update status to cancelled
};
```

**Step 3: Build booking form page**

- Pickup address (AddressAutocomplete)
- Dropoff address (AddressAutocomplete)
- Map preview showing route between pickup and dropoff
- Date/time picker (shadcn Calendar + time input)
- Passenger count
- Vehicle type preference (sedan/minivan/minibus radio group)
- Special instructions textarea
- Estimated fare shown after addresses are entered (calls Routes API)
- Submit button → creates booking → redirects to booking list

**Step 4: Build booking list page**

- Table/card list of org bookings
- Status badges (pending, confirmed, in_progress, completed, cancelled)
- Filter by status, date range
- Click to view booking details
- Cancel button (with confirm dialog, respects lead-time rules)

**Step 5: Screenshot and verify**

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add client booking portal with Google Maps route preview and fare estimate"
```

---

### Task 3.3: Google Routes API integration for fare estimation

**Files:**
- Create: `packages/web/lib/google-maps/routes.ts`
- Create: `packages/web/lib/pricing/calculator.ts`

**Step 1: Create Routes API client**

`packages/web/lib/google-maps/routes.ts`:
```typescript
interface RouteEstimate {
  distanceMeters: number;
  durationSeconds: number;
  polyline: string; // encoded polyline for map display
}

export const getRouteEstimate = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RouteEstimate> => {
  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY!,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
      }),
    }
  );
  const data = await response.json();
  const route = data.routes[0];
  return {
    distanceMeters: route.distanceMeters,
    durationSeconds: parseInt(route.duration.replace("s", "")),
    polyline: route.polyline.encodedPolyline,
  };
};
```

**Step 2: Create pricing calculator**

`packages/web/lib/pricing/calculator.ts`:
```typescript
import { prisma } from "@/lib/db/prisma";

interface FareInput {
  distanceKm: number;
  durationMin: number;
  vehicleType: string;
  orgId: string;
  scheduledAt: Date;
}

export const calculateFare = async (input: FareInput): Promise<number> => {
  // Look up org-specific pricing first, fall back to platform default (orgId=null)
  const rule = await prisma.pricingRule.findFirst({
    where: {
      vehicleType: input.vehicleType,
      orgId: { in: [input.orgId, null] },
    },
    orderBy: { orgId: "desc" }, // org-specific first (non-null sorts after null? use raw)
  });

  if (!rule) throw new Error(`No pricing rule for vehicle type: ${input.vehicleType}`);

  // Check airport fixed rate
  if (rule.airportFixedRate) {
    // TODO: check if pickup or dropoff is near airport coordinates
  }

  let fare = rule.baseFare
    + (input.distanceKm * rule.ratePerKm)
    + (input.durationMin * rule.ratePerMin);

  // Night surcharge: 00:00-06:00
  const hour = input.scheduledAt.getHours();
  if (hour >= 0 && hour < 6) {
    fare *= rule.nightMultiplier;
  }

  return Math.round(fare * 100) / 100; // Round to 2 decimals
};
```

**Step 3: Wire into booking creation flow**

When `createBooking` server action is called:
1. Call `getRouteEstimate(pickup, dropoff)`
2. Call `calculateFare({ distanceKm, durationMin, vehicleType, orgId, scheduledAt })`
3. Store `estimatedDistanceKm` and `estimatedFare` on the booking

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Google Routes API integration and fare calculation engine"
```

---

### Task 3.4: Operator dispatch — Assign driver to booking

**Files:**
- Create: `packages/web/app/[locale]/admin/bookings/page.tsx`
- Create: `packages/web/components/admin/bookings/booking-table.tsx`
- Create: `packages/web/components/admin/bookings/assign-driver-dialog.tsx`
- Modify: `packages/web/server_actions/bookings.ts`

**Step 1: Add operator booking server actions**

```typescript
export const getAllBookings = async (filters?: { status?: string; orgId?: string }) => {
  // List all bookings across all orgs (for operator/super admin)
  // Include org name, driver name, vehicle info
};

export const assignDriverToBooking = async (data: unknown) => {
  // Validate with assignDriverSchema
  // Check driver is available (not on_trip)
  // Check vehicle is available
  // Update booking: set driverId, vehicleId, status → driver_assigned
  // Update driver availability → on_trip
  // Update vehicle status → on_trip
  // Set estimatedFare if provided
};
```

**Step 2: Build operator bookings page**

- Table of all bookings across all orgs
- Columns: booking ID, org name, pickup, dropoff, scheduled time, status, driver, vehicle
- Filter by status, org, date
- "Assign Driver" button on unassigned bookings → dialog showing available drivers and vehicles
- Assign dialog: dropdown of available drivers, dropdown of available vehicles, optional fare override

**Step 3: Screenshot and verify**

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add operator dispatch panel for booking management and driver assignment"
```

---

## Milestone 4: Driver App (Weeks 6-7)

### Task 4.1: Driver route group and login page

**Files:**
- Create: `packages/web/app/[locale]/driver/page.tsx`
- Create: `packages/web/app/[locale]/driver/layout.tsx`
- Create: `packages/web/components/driver/driver-login-form.tsx`

**Step 1: Create driver layout**

Mobile-optimized layout:
- No sidebar
- Bottom navigation bar (Trips, Map, Profile)
- Full-width content area
- Installable PWA manifest headers

**Step 2: Create driver login page**

- Phone number input (tel type)
- PIN input (4-6 digits, masked)
- Login button
- Calls NextAuth `signIn("driver-login", { phone, pin })`
- On success: redirect to `/driver/trips`

**Step 3: Screenshot on mobile viewport**

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add driver login page with phone+PIN authentication"
```

---

### Task 4.2: Driver trip list and trip detail

**Files:**
- Create: `packages/web/app/[locale]/driver/trips/page.tsx`
- Create: `packages/web/components/driver/trip-list.tsx`
- Create: `packages/web/components/driver/trip-card.tsx`
- Create: `packages/web/app/[locale]/driver/trips/[bookingId]/page.tsx`
- Create: `packages/web/components/driver/trip-detail.tsx`
- Create: `packages/web/server_actions/driver-trips.ts`

**Step 1: Create driver trip server actions**

```typescript
export const getDriverTrips = async (driverId: string) => {
  // Get all bookings assigned to this driver
  // Ordered: in_progress first, then driver_assigned, then completed
};

export const acceptTrip = async (bookingId: string) => {
  // Update booking status: driver_assigned → confirmed
};

export const rejectTrip = async (bookingId: string) => {
  // Unassign driver, set booking back to pending
  // Set driver availability back to online
};

export const startTrip = async (bookingId: string) => {
  // Create Trip record
  // Update booking status → in_progress
  // Update driver availability → on_trip
};

export const completeTrip = async (bookingId: string) => {
  // Set trip endedAt
  // Update booking status → completed
  // Calculate actual fare from GPS trace (Roads API snap)
  // Update driver availability → online
};

export const confirmPayment = async (tripId: string, method: "cash" | "pos") => {
  // Set trip paymentConfirmed = true
  // Set booking paymentMethod
};
```

**Step 2: Build trip list page**

Mobile card layout:
- Cards show: pickup → dropoff, scheduled time, status badge
- Active trip card highlighted at top
- Accept/Reject buttons on newly assigned trips
- Tap card to view detail

**Step 3: Build trip detail page**

- Map showing pickup and dropoff markers with route
- Pickup and dropoff addresses
- Passenger count, special instructions
- "Navigate" button → deep link to Google Maps
- Status-dependent action buttons:
  - `driver_assigned`: Accept / Reject
  - `confirmed`: Start Trip
  - `in_progress`: Complete Trip
  - `completed` (unpaid): Cash / POS payment confirmation

**Step 4: Screenshot on mobile viewport**

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add driver trip list and trip detail with action buttons"
```

---

### Task 4.3: Capacitor setup for driver app

**Files:**
- Create: `packages/web/capacitor.config.ts`
- Create: `packages/web/android/` (generated by Capacitor)
- Create: `packages/web/ios/` (generated by Capacitor)

**Step 1: Install Capacitor**

```bash
cd packages/web
pnpm add @capacitor/core @capacitor/cli
pnpm add @capacitor/geolocation @capacitor/preferences @capacitor/local-notifications
pnpm add @capacitor-community/background-geolocation
npx cap init "TransferGR Driver" "com.transfergr.driver"
```

**Step 2: Configure capacitor.config.ts**

```typescript
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.transfergr.driver",
  appName: "TransferGR Driver",
  webDir: "out", // or point to live URL in production
  server: {
    // In development, load from Next.js dev server
    url: process.env.NODE_ENV === "development" ? "http://localhost:3000/en/driver" : undefined,
    cleartext: true, // Allow HTTP in dev
  },
  plugins: {
    Geolocation: {
      // Request always-on location permission
    },
    LocalNotifications: {
      smallIcon: "ic_notification",
    },
  },
};

export default config;
```

**Step 3: Add Android platform**

```bash
cd packages/web && npx cap add android
```

**Step 4: Create GPS service wrapper**

`packages/web/lib/driver/gps-service.ts`:
```typescript
import { Geolocation } from "@capacitor/geolocation";
import { Preferences } from "@capacitor/preferences";
import { GPS_MAX_ACCURACY_METERS, GPS_UPDATE_INTERVAL_MS } from "@transfergr/shared";

interface GpsPoint {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  bearing: number | null;
  timestamp: number;
}

let watchId: string | null = null;
const pendingQueue: GpsPoint[] = [];

export const startGpsTracking = (onPoint: (point: GpsPoint) => void) => {
  watchId = Geolocation.watchPosition(
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    },
    (position, err) => {
      if (err || !position) return;
      if (position.coords.accuracy > GPS_MAX_ACCURACY_METERS) return;

      const point: GpsPoint = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed,
        bearing: position.coords.heading,
        timestamp: position.timestamp,
      };

      onPoint(point);
    }
  ) as unknown as string;
};

export const stopGpsTracking = () => {
  if (watchId) {
    Geolocation.clearWatch({ id: watchId });
    watchId = null;
  }
};

// Queue management for offline scenarios
export const queueGpsPoint = async (point: GpsPoint) => {
  const { value } = await Preferences.get({ key: "gps_queue" });
  const queue: GpsPoint[] = value ? JSON.parse(value) : [];
  queue.push(point);
  await Preferences.set({ key: "gps_queue", value: JSON.stringify(queue) });
};

export const flushGpsQueue = async (): Promise<GpsPoint[]> => {
  const { value } = await Preferences.get({ key: "gps_queue" });
  const queue: GpsPoint[] = value ? JSON.parse(value) : [];
  await Preferences.remove({ key: "gps_queue" });
  return queue;
};
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Capacitor setup with GPS service for driver app"
```

---

## Milestone 5: WebSocket Server + Live Tracking (Week 8)

### Task 5.1: Build the WS server with Socket.IO + Redis

**Files:**
- Modify: `packages/ws-server/src/index.ts`
- Create: `packages/ws-server/src/redis.ts`
- Create: `packages/ws-server/src/auth.ts`
- Create: `packages/ws-server/src/handlers/gps.ts`
- Create: `packages/ws-server/docker-compose.yml`

**Step 1: Create Redis client**

`packages/ws-server/src/redis.ts`:
```typescript
import { Redis } from "ioredis";

export const pubClient = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
export const subClient = pubClient.duplicate();

export const publishDriverLocation = async (
  driverId: string,
  location: { lat: number; lng: number; accuracy: number; speed: number | null; bearing: number | null; timestamp: number }
) => {
  await pubClient.publish(
    `driver:${driverId}:location`,
    JSON.stringify(location)
  );
  // Also update latest location in a hash for new subscribers
  await pubClient.hset(`driver:${driverId}:latest`, {
    lat: location.lat.toString(),
    lng: location.lng.toString(),
    accuracy: location.accuracy.toString(),
    speed: (location.speed ?? 0).toString(),
    bearing: (location.bearing ?? 0).toString(),
    timestamp: location.timestamp.toString(),
  });
};

export const getLatestDriverLocation = async (driverId: string) => {
  return pubClient.hgetall(`driver:${driverId}:latest`);
};
```

**Step 2: Create JWT auth for WebSocket connections**

`packages/ws-server/src/auth.ts`:
```typescript
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

interface TokenPayload {
  sub: string; // user ID
  role: string;
  driverId?: string;
}

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
};
```

**Step 3: Create GPS handler**

`packages/ws-server/src/handlers/gps.ts`:
```typescript
import { Socket } from "socket.io";
import { gpsUpdateSchema, gpsBatchSchema, WS_EVENTS } from "@transfergr/shared";
import { publishDriverLocation } from "../redis";

export const registerGpsHandlers = (socket: Socket, driverId: string) => {
  // Single GPS update
  socket.on(WS_EVENTS.GPS_UPDATE, async (data: unknown) => {
    const parsed = gpsUpdateSchema.safeParse(data);
    if (!parsed.success) return;
    if (parsed.data.driverId !== driverId) return; // Prevent spoofing

    await publishDriverLocation(driverId, parsed.data);
  });

  // Batch GPS update (reconnection flush)
  socket.on(WS_EVENTS.GPS_BATCH, async (data: unknown) => {
    const parsed = gpsBatchSchema.safeParse(data);
    if (!parsed.success) return;
    if (parsed.data.driverId !== driverId) return;

    // Process each point, publish only the latest
    const sorted = parsed.data.points.sort((a, b) => a.timestamp - b.timestamp);
    for (const point of sorted) {
      await publishDriverLocation(driverId, point);
    }
  });
};
```

**Step 4: Build the full Socket.IO server**

`packages/ws-server/src/index.ts`:
```typescript
import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { pubClient, subClient } from "./redis";
import { verifyToken } from "./auth";
import { registerGpsHandlers } from "./handlers/gps";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.WEB_URL ?? "http://localhost:3000",
    credentials: true,
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
  },
});

// Use Redis adapter for horizontal scaling readiness
io.adapter(createAdapter(pubClient, subClient));

// Auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token as string;
  if (!token) return next(new Error("No token"));

  const payload = verifyToken(token);
  if (!payload) return next(new Error("Invalid token"));

  socket.data.userId = payload.sub;
  socket.data.role = payload.role;
  socket.data.driverId = payload.driverId;
  next();
});

io.on("connection", (socket) => {
  const { role, driverId, userId } = socket.data;
  console.log(`Connected: ${userId} (${role})`);

  if (role === "driver" && driverId) {
    // Driver: join their own room, register GPS handlers
    socket.join(`driver:${driverId}`);
    registerGpsHandlers(socket, driverId);
  }

  if (["superadmin", "orgadmin"].includes(role)) {
    // Dashboard: join admin room for receiving all driver locations
    socket.join("dashboard");

    // Subscribe to specific driver location updates
    socket.on("subscribe:driver", (targetDriverId: string) => {
      socket.join(`watch:${targetDriverId}`);
    });

    socket.on("unsubscribe:driver", (targetDriverId: string) => {
      socket.leave(`watch:${targetDriverId}`);
    });
  }

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${userId} (${role})`);
  });
});

const PORT = Number(process.env.PORT) || 3001;
httpServer.listen(PORT, () => {
  console.log(`WS server running on port ${PORT}`);
});
```

**Step 5: Create docker-compose for local dev**

`packages/ws-server/docker-compose.yml`:
```yaml
version: "3.8"
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

**Step 6: Verify WS server starts**

```bash
cd packages/ws-server && docker compose up -d && pnpm dev
```

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Socket.IO WebSocket server with Redis pub/sub for GPS tracking"
```

---

### Task 5.2: SSE endpoint for dashboard live updates

**Files:**
- Create: `packages/web/app/api/sse/driver-locations/route.ts`
- Create: `packages/web/lib/redis/client.ts`

**Step 1: Create Redis client for Next.js**

`packages/web/lib/redis/client.ts`:
```typescript
import { Redis } from "ioredis";

let redisClient: Redis | null = null;

export const getRedis = () => {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
  }
  return redisClient;
};
```

**Step 2: Create SSE route**

`packages/web/app/api/sse/driver-locations/route.ts`:
```typescript
import { getRedis } from "@/lib/redis/client";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { Redis } from "ioredis";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token || !["superadmin", "orgadmin"].includes(token.role as string)) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get driver IDs from query params (comma-separated)
  const driverIds = request.nextUrl.searchParams.get("drivers")?.split(",") ?? [];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const sub = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

      // Subscribe to each driver's location channel
      for (const driverId of driverIds) {
        sub.subscribe(`driver:${driverId}:location`);
      }

      sub.on("message", (channel, message) => {
        const driverId = channel.split(":")[1];
        const data = JSON.stringify({ driverId, ...JSON.parse(message) });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      });

      // Cleanup on client disconnect
      request.signal.addEventListener("abort", () => {
        sub.unsubscribe();
        sub.quit();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add SSE endpoint for real-time driver location updates to dashboards"
```

---

### Task 5.3: Live map component for operator dashboard

**Files:**
- Create: `packages/web/components/admin/live-map.tsx`
- Create: `packages/web/hooks/use-driver-locations.ts`
- Create: `packages/web/hooks/use-marker-animation.ts`
- Create: `packages/web/app/[locale]/admin/live-map/page.tsx`

**Step 1: Create SSE hook for driver locations**

`packages/web/hooks/use-driver-locations.ts`:
```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import type { GpsUpdate } from "@transfergr/shared";

export const useDriverLocations = (driverIds: string[]) => {
  const [locations, setLocations] = useState<Map<string, GpsUpdate>>(new Map());
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (driverIds.length === 0) return;

    const url = `/api/sse/driver-locations?drivers=${driverIds.join(",")}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as GpsUpdate;
      setLocations((prev) => {
        const next = new Map(prev);
        next.set(data.driverId, data);
        return next;
      });
    };

    return () => {
      eventSource.close();
    };
  }, [driverIds.join(",")]); // Reconnect if driver list changes

  return locations;
};
```

**Step 2: Create marker animation hook**

`packages/web/hooks/use-marker-animation.ts`:
```typescript
"use client";

import { useRef, useCallback } from "react";

interface Position {
  lat: number;
  lng: number;
}

export const useMarkerAnimation = () => {
  const animationFrameRef = useRef<number | null>(null);

  const animateMarker = useCallback(
    (
      marker: google.maps.marker.AdvancedMarkerElement,
      from: Position,
      to: Position,
      durationMs: number = 3800
    ) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const startTime = performance.now();

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / durationMs, 1);

        // Ease-in-out for natural movement
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const lat = from.lat + (to.lat - from.lat) * eased;
        const lng = from.lng + (to.lng - from.lng) * eased;

        marker.position = { lat, lng };

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(step);
        }
      };

      animationFrameRef.current = requestAnimationFrame(step);
    },
    []
  );

  return { animateMarker };
};
```

**Step 3: Build LiveMap component**

`packages/web/components/admin/live-map.tsx`:

Uses `@vis.gl/react-google-maps`:
- `<APIProvider>` wrapping `<Map>` with `<AdvancedMarker>` per driver
- Each marker shows vehicle icon rotated to bearing
- Markers animate between GPS updates using `useMarkerAnimation`
- Click marker → popup with driver name, speed, current trip info
- `@googlemaps/markerclusterer` for zoomed-out clustering

**Step 4: Create live map page**

`packages/web/app/[locale]/admin/live-map/page.tsx`:
- Full-width map filling available space
- Sidebar panel showing list of active drivers with status
- Fetches active driver IDs from server
- Passes to `useDriverLocations` hook
- Passes locations to `LiveMap` component

**Step 5: Screenshot and verify**

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add live map with animated vehicle markers and real-time GPS updates"
```

---

### Task 5.4: Connect driver app to WebSocket server

**Files:**
- Create: `packages/web/lib/driver/socket-client.ts`
- Modify: `packages/web/components/driver/trip-detail.tsx`

**Step 1: Create Socket.IO client for driver**

`packages/web/lib/driver/socket-client.ts`:
```typescript
"use client";

import { io, Socket } from "socket.io-client";
import { WS_EVENTS } from "@transfergr/shared";
import type { GpsUpdate } from "@transfergr/shared";

let socket: Socket | null = null;

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001", {
    auth: { token },
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
  });

  socket.on("connect", () => console.log("Socket connected"));
  socket.on("disconnect", () => console.log("Socket disconnected"));
  socket.on("connect_error", (err) => console.error("Socket error:", err.message));

  return socket;
};

export const sendGpsUpdate = (update: GpsUpdate) => {
  socket?.emit(WS_EVENTS.GPS_UPDATE, update);
};

export const sendGpsBatch = (driverId: string, points: GpsUpdate[]) => {
  socket?.emit(WS_EVENTS.GPS_BATCH, { driverId, points });
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};
```

**Step 2: Integrate GPS service + Socket in trip detail**

When driver taps "Start Trip":
1. Connect to Socket.IO with JWT token
2. Start Capacitor GPS tracking
3. On each GPS point → send via Socket.IO
4. If socket disconnected → queue to Capacitor Preferences
5. On reconnect → flush queue via batch

When driver taps "Complete Trip":
1. Stop GPS tracking
2. Disconnect socket
3. Show payment confirmation

**Step 3: Add `socket.io-client` to web package**

```bash
cd packages/web && pnpm add socket.io-client
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: connect driver app to WebSocket server for live GPS broadcasting"
```

---

### Task 5.5: GPS persistence — write locations to Postgres

**Files:**
- Create: `packages/ws-server/src/persistence.ts`
- Modify: `packages/ws-server/src/handlers/gps.ts`

**Step 1: Create persistence layer**

The WS server doesn't have Prisma — it writes to Postgres directly via a lightweight client or calls a Next.js API endpoint.

Option: WS server calls a Next.js API route to persist locations (keeps DB access in one place).

`packages/web/app/api/internal/driver-locations/route.ts`:
```typescript
import { prisma } from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

// Internal API — called by WS server, authenticated via shared secret
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-internal-secret");
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { driverId, lat, lng, accuracy, speed, bearing } = body;

  await prisma.driverLocation.create({
    data: { driverId, lat, lng, accuracy, speed, bearing },
  });

  return NextResponse.json({ ok: true });
}
```

**Step 2: Add 30-second batched writes in WS server**

`packages/ws-server/src/persistence.ts`:
```typescript
import { GPS_PERSIST_INTERVAL_MS } from "@transfergr/shared";

const WEB_URL = process.env.WEB_URL ?? "http://localhost:3000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET!;

// Buffer: driverId → latest GPS point
const latestPoints = new Map<string, any>();

export const bufferLocationForPersistence = (driverId: string, point: any) => {
  latestPoints.set(driverId, point);
};

// Flush every 30 seconds
setInterval(async () => {
  for (const [driverId, point] of latestPoints) {
    try {
      await fetch(`${WEB_URL}/api/internal/driver-locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": INTERNAL_SECRET,
        },
        body: JSON.stringify({ driverId, ...point }),
      });
    } catch (err) {
      console.error(`Failed to persist location for ${driverId}:`, err);
    }
  }
  latestPoints.clear();
}, GPS_PERSIST_INTERVAL_MS);
```

**Step 3: Wire into GPS handler**

In `handlers/gps.ts`, after publishing to Redis, also call `bufferLocationForPersistence`.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add 30-second batched GPS persistence from WS server to Postgres"
```

---

## Milestone 6: Super Admin Panel + Analytics (Week 9)

### Task 6.1: Super Admin analytics dashboard

**Files:**
- Modify: `packages/web/app/[locale]/admin/page.tsx`
- Create: `packages/web/components/admin/stats-cards.tsx`
- Create: `packages/web/components/admin/recent-bookings.tsx`
- Create: `packages/web/components/admin/driver-utilization.tsx`
- Create: `packages/web/server_actions/analytics.ts`

**Step 1: Create analytics server actions**

```typescript
"use server";

export const getDashboardStats = async () => {
  // Parallel queries:
  // - Total trips today / this week / this month
  // - Active drivers count (availability = on_trip)
  // - Total revenue (sum of actualFare where paymentConfirmed)
  // - Cancellation rate (cancelled / total bookings this month)
};

export const getTopOrganizations = async () => {
  // Top 10 orgs by booking count this month
};

export const getDriverUtilization = async () => {
  // Per driver: trips completed, hours on-trip, avg trip distance
};

export const getRecentBookings = async (limit: number = 10) => {
  // Latest bookings with status, org, driver
};
```

**Step 2: Build stats cards**

- Total trips today (with +/- trend vs yesterday)
- Active drivers now
- Revenue this month
- Cancellation rate

Use shadcn Card components with trend indicators.

**Step 3: Build dashboard page**

Layout:
- Top row: 4 stat cards
- Middle: live map (small, embedded) + recent bookings table
- Bottom: top organizations chart + driver utilization

**Step 4: Screenshot and verify**

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add super admin analytics dashboard with stats, charts, and recent activity"
```

---

### Task 6.2: Audit log

**Files:**
- Create: `packages/web/lib/audit/log.ts`
- Create: `packages/web/app/[locale]/admin/audit-log/page.tsx`
- Create: `packages/web/components/admin/audit-log-table.tsx`

**Step 1: Create audit logging utility**

`packages/web/lib/audit/log.ts`:
```typescript
import { prisma } from "@/lib/db/prisma";

export const auditLog = async (
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  metadata?: Record<string, unknown>
) => {
  await prisma.auditLog.create({
    data: { userId, action, entity, entityId, metadata: metadata ?? undefined },
  });
};
```

**Step 2: Add audit logging to all existing server actions**

Wrap key mutations:
- `createOrganization` → log `create`, `organization`, orgId
- `assignDriverToBooking` → log `assign_driver`, `booking`, bookingId
- `startTrip` → log `start_trip`, `trip`, tripId
- `completeTrip` → log `complete_trip`, `trip`, tripId
- etc.

**Step 3: Build audit log page**

- Table: timestamp, user, action, entity, entity ID
- Filter by entity type, user, date range
- Paginated (50 per page)

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add audit logging to all mutations and audit log viewer page"
```

---

## Milestone 7: SMS Notifications (Week 9)

### Task 7.1: Twilio SMS integration

**Files:**
- Create: `packages/web/lib/notifications/sms.ts`
- Create: `packages/web/lib/notifications/templates.ts`

**Step 1: Install Twilio SDK**

```bash
cd packages/web && pnpm add twilio
```

**Step 2: Create SMS utility**

`packages/web/lib/notifications/sms.ts`:
```typescript
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER!;

export const sendSms = async (to: string, body: string) => {
  try {
    await client.messages.create({ to, from: FROM_NUMBER, body });
  } catch (error) {
    console.error(`SMS send failed to ${to}:`, error);
    // Don't throw — SMS failure should not block the operation
  }
};
```

**Step 3: Create message templates**

`packages/web/lib/notifications/templates.ts`:
```typescript
export const smsTemplates = {
  bookingConfirmed: (bookingId: string, dateTime: string) =>
    `TransferGR: Booking #${bookingId} confirmed for ${dateTime}.`,

  driverAssigned: (driverName: string, vehicleInfo: string, eta: string) =>
    `TransferGR: Driver ${driverName} (${vehicleInfo}) assigned. ETA ${eta}.`,

  driverEnRoute: (trackingUrl: string) =>
    `TransferGR: Your driver is on the way. Track: ${trackingUrl}`,

  tripCompleted: (bookingId: string, distance: string, fare: string) =>
    `TransferGR: Trip #${bookingId} completed. Distance: ${distance}km. Fare: €${fare}.`,
};
```

**Step 4: Wire SMS into booking server actions**

- After `createBooking` → send bookingConfirmed to booker
- After `assignDriverToBooking` → send driverAssigned to booker (and passenger phone if provided)
- After `startTrip` → send driverEnRoute to passenger with tracking link
- After `completeTrip` → send tripCompleted to booker

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Twilio SMS notifications for booking lifecycle events"
```

---

## Milestone 8: Passenger Tracking Link (Week 9)

### Task 8.1: Public trip tracking page

**Files:**
- Create: `packages/web/app/[locale]/track/[tripId]/page.tsx`
- Create: `packages/web/components/tracking/public-tracking-map.tsx`

**Step 1: Create public tracking page**

No authentication required. Fetches trip info by ID, shows:
- Map with driver's live position (SSE subscription to one driver)
- Pickup and dropoff markers
- Driver name and vehicle info
- ETA based on remaining route distance
- Status: "Driver en route" / "Arriving" / "Trip completed"

**Step 2: Create SSE endpoint for single-driver public tracking**

`packages/web/app/api/sse/track/[tripId]/route.ts`:
- No auth required
- Look up trip → get driverId
- Subscribe to `driver:{driverId}:location` Redis channel
- Stream to client

**Step 3: Screenshot and verify**

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add public passenger tracking page with live driver position"
```

---

## Milestone 9: Post-Trip Actual Distance (Week 9-10)

### Task 9.1: Roads API snap-to-roads and actual fare calculation

**Files:**
- Create: `packages/web/lib/google-maps/roads.ts`
- Modify: `packages/web/lib/pricing/calculator.ts`
- Modify: `packages/web/server_actions/driver-trips.ts`

**Step 1: Create Roads API client**

`packages/web/lib/google-maps/roads.ts`:
```typescript
interface SnappedPoint {
  lat: number;
  lng: number;
}

export const snapToRoads = async (
  points: { lat: number; lng: number }[]
): Promise<SnappedPoint[]> => {
  // Roads API accepts max 100 points per request
  const batches: { lat: number; lng: number }[][] = [];
  for (let i = 0; i < points.length; i += 100) {
    batches.push(points.slice(i, i + 100));
  }

  const snapped: SnappedPoint[] = [];

  for (const batch of batches) {
    const path = batch.map((p) => `${p.lat},${p.lng}`).join("|");
    const response = await fetch(
      `https://roads.googleapis.com/v1/snapToRoads?path=${path}&interpolate=true&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    for (const point of data.snappedPoints ?? []) {
      snapped.push({
        lat: point.location.latitude,
        lng: point.location.longitude,
      });
    }
  }

  return snapped;
};
```

**Step 2: Create Haversine distance utility**

```typescript
export const haversineDistanceKm = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export const totalRouteDistanceKm = (points: { lat: number; lng: number }[]): number => {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistanceKm(points[i - 1], points[i]);
  }
  return total;
};
```

**Step 3: Wire into completeTrip**

When `completeTrip` is called:
1. Fetch all `DriverLocation` records for this trip's time window
2. Call `snapToRoads` on the GPS trace
3. Calculate `totalRouteDistanceKm` from snapped points
4. Call `calculateFare` with actual distance
5. Update booking with `actualDistanceKm` and `actualFare`

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Roads API snap-to-roads for post-trip actual distance and fare calculation"
```

---

## Milestone 10: QA, Polish, and Deployment (Week 10)

### Task 10.1: Environment variables and deployment config

**Files:**
- Modify: `packages/web/.env.template`
- Create: `packages/ws-server/.env.template`
- Create: `packages/ws-server/Dockerfile`
- Create: `packages/ws-server/docker-compose.prod.yml`
- Create: `.github/workflows/deploy.yml`

**Step 1: Document all required env vars**

`packages/web/.env.template`:
```env
# Database
DATABASE_URL=
DIRECT_URL=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_API_KEY=

# Redis
REDIS_URL=redis://localhost:6379

# WebSocket
NEXT_PUBLIC_WS_URL=http://localhost:3001

# Internal API
INTERNAL_API_SECRET=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 2: Create WS server Dockerfile**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY packages/ws-server/package.json ./
COPY packages/shared/ ../shared/
RUN npm install --production
COPY packages/ws-server/ ./
CMD ["npx", "tsx", "src/index.ts"]
```

**Step 3: Create GitHub Actions deploy workflow**

- On push to `main`:
  - Build & deploy web to Vercel (auto via Vercel Git integration)
  - SSH to Hetzner → pull latest → rebuild Docker → restart WS server

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add deployment config — Dockerfile, docker-compose, GitHub Actions CI/CD"
```

---

### Task 10.2: End-to-end verification

Run through all acceptance criteria from the spec:

1. Org admin logs in → creates a booking → receives SMS
2. Operator assigns driver + vehicle from dashboard
3. Driver logs into PWA → accepts trip → starts GPS broadcasting
4. Operator dashboard shows driver's live position updating
5. Super admin sees all active trips on one map
6. Driver completes trip → confirms payment (cash/POS)
7. Analytics panel shows accurate stats
8. Simulate 50 concurrent GPS streams → verify no degradation

**For each step:** screenshot, verify, fix issues, re-verify.

---

## Environment Setup Checklist

Before starting implementation, ensure:

- [ ] Supabase project created with Postgres database
- [ ] Google Cloud project with Maps JS API, Places API, Routes API, Roads API enabled
- [ ] Google OAuth credentials configured
- [ ] Twilio account with phone number
- [ ] Hetzner VPS provisioned (CX22 minimum)
- [ ] Redis installed locally (or use Docker)
- [ ] `.env.local` populated in `packages/web/`
- [ ] `.env` populated in `packages/ws-server/`
