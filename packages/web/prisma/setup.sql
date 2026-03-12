-- ============================================
-- TransferGR Database Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- CreateTable
CREATE TABLE IF NOT EXISTS "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "pinHash" TEXT,
    "image" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VehicleClass" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tags" TEXT[],
    "capacity" INTEGER NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VehicleClass_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Vehicle" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "vehicleClassId" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "year" INTEGER,
    "photoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Driver" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "vehicleClassId" TEXT,
    "licenseNo" TEXT,
    "licensePlate" TEXT,
    "vehicleMake" TEXT,
    "vehicleModel" TEXT,
    "vehicleYear" INTEGER,
    "vehicleColor" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "photoUrl" TEXT,
    "availability" TEXT NOT NULL DEFAULT 'offline',
    "inviteStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Booking" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "orgId" TEXT,
    "driverId" TEXT,
    "vehicleId" TEXT,
    "vehicleClassId" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "pickupLat" DOUBLE PRECISION NOT NULL,
    "pickupLng" DOUBLE PRECISION NOT NULL,
    "dropoffAddress" TEXT NOT NULL,
    "dropoffLat" DOUBLE PRECISION NOT NULL,
    "dropoffLng" DOUBLE PRECISION NOT NULL,
    "stops" JSONB,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "passengerCount" INTEGER NOT NULL DEFAULT 1,
    "luggageCount" INTEGER NOT NULL DEFAULT 0,
    "specialInstructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "timeoutAt" TIMESTAMP(3),
    "estimatedDistanceKm" DOUBLE PRECISION,
    "estimatedFareMin" DOUBLE PRECISION,
    "estimatedFareMax" DOUBLE PRECISION,
    "acceptedFare" DOUBLE PRECISION,
    "actualDistanceKm" DOUBLE PRECISION,
    "actualFare" DOUBLE PRECISION,
    "waitingChargeAmount" DOUBLE PRECISION,
    "paymentMethod" TEXT,
    "proxySessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Trip" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "waitingStartedAt" TIMESTAMP(3),
    "waitingEndedAt" TIMESTAMP(3),
    "waitingMinutes" DOUBLE PRECISION,
    "paymentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Rating" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DriverLocation" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "bearing" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DriverLocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PricingRule" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "vehicleClassId" TEXT NOT NULL,
    "minimumFare" DOUBLE PRECISION NOT NULL,
    "ratePerKm" DOUBLE PRECISION NOT NULL,
    "nightMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "airportFixedRate" DOUBLE PRECISION,
    "freeWaitingMinutes" INTEGER NOT NULL DEFAULT 5,
    "waitingRatePerMin" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "extraStopFee" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CancellationPolicy" (
    "id" TEXT NOT NULL,
    "freeWindowMinutes" INTEGER NOT NULL DEFAULT 120,
    "lateCancelFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "noShowFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CancellationPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SavedLocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedLocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON "Organization"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "DeviceToken_token_key" ON "DeviceToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VehicleClass_name_key" ON "VehicleClass"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Vehicle_plateNumber_key" ON "Vehicle"("plateNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "Driver_userId_key" ON "Driver"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Driver_vehicleId_key" ON "Driver"("vehicleId");
CREATE UNIQUE INDEX IF NOT EXISTS "Trip_bookingId_key" ON "Trip"("bookingId");
CREATE UNIQUE INDEX IF NOT EXISTS "Rating_bookingId_key" ON "Rating"("bookingId");
CREATE UNIQUE INDEX IF NOT EXISTS "PricingRule_orgId_vehicleClassId_key" ON "PricingRule"("orgId", "vehicleClassId");

-- Regular indexes
CREATE INDEX IF NOT EXISTS "DeviceToken_userId_idx" ON "DeviceToken"("userId");
CREATE INDEX IF NOT EXISTS "DriverLocation_driverId_recordedAt_idx" ON "DriverLocation"("driverId", "recordedAt");
CREATE INDEX IF NOT EXISTS "SavedLocation_userId_idx" ON "SavedLocation"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");

-- Foreign keys (using DO blocks to skip if already exists)
DO $$ BEGIN ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_vehicleClassId_fkey" FOREIGN KEY ("vehicleClassId") REFERENCES "VehicleClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Driver" ADD CONSTRAINT "Driver_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Driver" ADD CONSTRAINT "Driver_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Driver" ADD CONSTRAINT "Driver_vehicleClassId_fkey" FOREIGN KEY ("vehicleClassId") REFERENCES "VehicleClass"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Booking" ADD CONSTRAINT "Booking_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Booking" ADD CONSTRAINT "Booking_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vehicleClassId_fkey" FOREIGN KEY ("vehicleClassId") REFERENCES "VehicleClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Trip" ADD CONSTRAINT "Trip_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Trip" ADD CONSTRAINT "Trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Rating" ADD CONSTRAINT "Rating_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Rating" ADD CONSTRAINT "Rating_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Rating" ADD CONSTRAINT "Rating_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "DriverLocation" ADD CONSTRAINT "DriverLocation_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_vehicleClassId_fkey" FOREIGN KEY ("vehicleClassId") REFERENCES "VehicleClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SavedLocation" ADD CONSTRAINT "SavedLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- SEED DATA
-- ============================================

-- Vehicle Classes
INSERT INTO "VehicleClass" ("id", "name", "tags", "capacity", "description", "sortOrder", "updatedAt")
VALUES
  ('vc-eclass', 'Mercedes E Class', ARRAY['Business Class'], 3, 'BMW 5 Series, Cadillac XTS or similar', 1, CURRENT_TIMESTAMP),
  ('vc-sclass', 'Mercedes S Class', ARRAY['Business Class', 'VIP', 'Premium'], 3, 'BMW 7, Audi A8, Cadillac Escalade or similar', 2, CURRENT_TIMESTAMP),
  ('vc-vito', 'Mercedes Vito', ARRAY['Family Friendly', 'Group Travel'], 7, 'Ford Custom, Chevrolet Suburban or similar', 3, CURRENT_TIMESTAMP),
  ('vc-vclass', 'Mercedes V Class', ARRAY['Family Friendly', 'Group Travel', 'Premium'], 6, 'Cadillac Escalade or similar', 4, CURRENT_TIMESTAMP),
  ('vc-sprinter', 'Mercedes Sprinter', ARRAY['Group Travel', 'Large Groups'], 16, 'Ford Transit or similar', 5, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Cancellation Policy
INSERT INTO "CancellationPolicy" ("id", "freeWindowMinutes", "lateCancelFeePercent", "noShowFeePercent", "updatedAt")
VALUES ('cp-default', 120, 0.5, 1.0, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Super Admin
INSERT INTO "User" ("id", "email", "name", "role", "updatedAt")
VALUES ('usr-admin', 'admin@transfergr.com', 'Super Admin', 'superadmin', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Demo Organization
INSERT INTO "Organization" ("id", "name", "slug", "status", "commissionRate", "contactEmail", "contactPhone", "updatedAt")
VALUES ('org-demo', 'Demo Transfers', 'demo-transfers', 'verified', 0.15, 'info@demotransfers.gr', '+306900000000', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Pricing Rules
INSERT INTO "PricingRule" ("id", "orgId", "vehicleClassId", "ratePerKm", "minimumFare", "nightMultiplier", "airportFixedRate", "extraStopFee", "updatedAt")
VALUES
  ('pr-eclass', 'org-demo', 'vc-eclass', 1.2, 35, 1.5, 55, 5, CURRENT_TIMESTAMP),
  ('pr-sclass', 'org-demo', 'vc-sclass', 1.8, 55, 1.5, 85, 8, CURRENT_TIMESTAMP),
  ('pr-vito', 'org-demo', 'vc-vito', 1.5, 45, 1.5, 65, 5, CURRENT_TIMESTAMP),
  ('pr-vclass', 'org-demo', 'vc-vclass', 1.7, 50, 1.5, 75, 7, CURRENT_TIMESTAMP),
  ('pr-sprinter', 'org-demo', 'vc-sprinter', 2.0, 65, 1.5, 95, 10, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Demo Driver User (PIN: 1234, hash generated with bcryptjs)
INSERT INTO "User" ("id", "name", "phone", "pinHash", "role", "orgId", "updatedAt")
VALUES ('usr-driver1', 'Demo Driver', '+306911111111', '$2b$10$DVLuCpNObkFKIRF1UFPSyuGHAmp76WmNc2HaWHtuhNuI81UFubeWm', 'driver', 'org-demo', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Demo Driver
INSERT INTO "Driver" ("id", "userId", "orgId", "vehicleClassId", "licensePlate", "vehicleMake", "vehicleModel", "vehicleYear", "vehicleColor", "isOnline", "availability", "inviteStatus", "updatedAt")
VALUES ('drv-demo1', 'usr-driver1', 'org-demo', 'vc-eclass', 'AAA-1234', 'Mercedes-Benz', 'E 220d', 2023, 'Black', true, 'online', 'accepted', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Prisma migrations tracking table (so Prisma knows the schema is in sync)
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);
