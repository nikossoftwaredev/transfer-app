# TransferGR Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an Uber-style transfer booking platform with real-time GPS tracking, multi-org competition (first to accept wins), masked communication, push notifications, and driver native app.

**Architecture:** pnpm monorepo with 3 packages: `web` (Next.js 16), `ws-server` (Socket.IO + Redis), `shared` (types + validation). Capacitor wraps the driver routes for native GPS + push. Supabase Postgres for data, Vercel + Hetzner for hosting.

**Tech Stack:** Next.js 16, NextAuth 4, Prisma, Socket.IO, Redis, Capacitor, Firebase Cloud Messaging, Twilio (SMS + Proxy), Google Maps/Routes/Roads/Places/Distance Matrix APIs, Zustand, Zod, TypeScript, sharp.

**Design doc:** `docs/plans/2026-03-10-transfergr-architecture-design.md`

**Timeline:** 16 weeks | **Budget:** €32,000

---

## Milestone 1: Monorepo Setup + Database Schema (Week 1)

### Task 1.1: Restructure into pnpm monorepo

**Files:**
- Modify: `pnpm-workspace.yaml`
- Create: `packages/web/` (move entire codebase here)
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`
- Create: `packages/ws-server/package.json`, `packages/ws-server/tsconfig.json`, `packages/ws-server/src/index.ts`

**Steps:**
1. Create `packages/shared/` and `packages/ws-server/` directories
2. Move everything except `.git`, `node_modules`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `docs/` into `packages/web/`
3. Update `pnpm-workspace.yaml` to include `packages/*`
4. Create `packages/shared/package.json` with name `@transfergr/shared`
5. Create `packages/ws-server/package.json` with name `@transfergr/ws-server`
6. Add `"@transfergr/shared": "workspace:*"` to both `web` and `ws-server`
7. Update all import paths in `packages/web/` if needed
8. Run `pnpm install` and verify `pnpm dev` still works

### Task 1.2: Prisma schema — full data model

**Files:**
- Create/Modify: `packages/web/prisma/schema.prisma`

**Steps:**
1. Define all models from architecture doc Section 13:
   - `Organization` (with `commissionRate`, `status: pending/verified/suspended`)
   - `User` (with `role`, nullable `orgId`)
   - `DeviceToken` (FCM push tokens)
   - `VehicleClass` (platform catalog)
   - `Vehicle` (org fleet, with `photoUrl`)
   - `Driver` (with `photoUrl`)
   - `DriverOrg` (junction: driver ↔ org, with `availability`, `inviteStatus`)
   - `Booking` (with `stops` Json, `timeoutAt`, `estimatedFareMin/Max`, `acceptedFare`, `waitingChargeAmount`, `proxySessionId`)
   - `Trip` (with `waitingStartedAt/EndedAt/Minutes`)
   - `Rating` (1-5 stars + comment)
   - `DriverLocation` (indexed on `driverId, recordedAt`)
   - `PricingRule` (per org per class: minimumFare, ratePerKm, waiting, stops)
   - `CancellationPolicy` (singleton, set by master admin)
   - `SavedLocation` (client favorites)
   - `AuditLog`
2. Run `npx prisma migrate dev --name initial-schema`
3. Verify migration succeeds against Supabase

### Task 1.3: Shared types and validation

**Files:**
- Create: `packages/shared/src/types/` — all TypeScript interfaces
- Create: `packages/shared/src/constants.ts` — enums, status codes
- Create: `packages/shared/src/validation.ts` — Zod schemas

**Steps:**
1. Define TypeScript interfaces mirroring Prisma models
2. Define enums: `BookingStatus`, `OrgStatus`, `DriverAvailability`, `InviteStatus`, `PaymentMethod`, `UserRole`
3. Define Zod schemas for API validation: `createBookingSchema`, `createOrgSchema`, `updatePricingSchema`, etc.
4. Export everything from `packages/shared/src/index.ts`

### Task 1.4: Seed vehicle class catalog

**Files:**
- Create: `packages/web/prisma/seed.ts`

**Steps:**
1. Seed the 5 vehicle classes: Mercedes E Class, S Class, Vito, V Class, Sprinter
2. Seed a default CancellationPolicy (120 min free window, 50% late fee, 100% no-show)
3. Seed a super admin user
4. Add seed script to `package.json`

---

## Milestone 2: Authentication + User Management (Week 2-3)

### Task 2.1: NextAuth — Google OAuth + Credentials provider

**Files:**
- Modify: `packages/web/lib/auth/auth.ts`
- Modify: `packages/web/app/api/auth/[...nextauth]/route.ts`

**Steps:**
1. Keep existing Google OAuth provider
2. Add Credentials provider for drivers (phone + PIN)
3. In `authorize` callback: look up user by phone, verify PIN with bcrypt
4. JWT callback: include `role`, `orgId`, `driverId` in token
5. Session callback: expose role and orgId to client
6. Test both login flows

### Task 2.2: Role-based middleware

**Files:**
- Create: `packages/web/middleware.ts` (or modify existing `proxy.ts`)

**Steps:**
1. Define route → role mappings:
   - `/admin/*` → `superadmin`
   - `/org/*` → `orgadmin`
   - `/book/*`, `/account/*` → `client` (or unauthenticated for booking)
   - `/driver/*` → `driver`
2. Check JWT role against route pattern
3. Redirect unauthorized users to appropriate login page
4. Integrate with existing i18n middleware

### Task 2.3: Organization verification flow

**Files:**
- Create: `packages/web/app/[locale]/admin/organizations/` — list, detail, approve/suspend pages
- Create: API routes for org CRUD

**Steps:**
1. Org signup page — submit business name, contact email, details
2. Org lands in `pending` status
3. Master admin sees pending orgs in admin panel
4. Approve button → sets status to `verified`
5. Suspend/remove actions
6. Only `verified` orgs can add vehicles and receive bookings

### Task 2.4: Organization panel — user management

**Files:**
- Create: `packages/web/app/[locale]/org/` — dashboard layout, user management pages

**Steps:**
1. Org admin dashboard layout (sidebar, header)
2. Invite drivers by phone number → create DriverOrg with `inviteStatus: pending`
3. Send SMS with invite link (Twilio)
4. Driver accepts invite → sets PIN → `inviteStatus: accepted`
5. Manage org users (add/remove bookers)

### Task 2.5: Push notification setup (Firebase)

**Files:**
- Create: `packages/web/lib/notifications/push.ts`
- Create: `packages/web/app/api/device-token/route.ts`

**Steps:**
1. Set up Firebase project, get service account credentials
2. Install `firebase-admin` in web package
3. Create API route to register device tokens
4. Create `push.ts` utility: `sendPush(userId, title, body, data)`
5. Query `DeviceToken` table for user's tokens, send via FCM
6. Handle token cleanup (remove invalid tokens on FCM error)

---

## Milestone 3: Vehicle Class Catalog + Fleet Management (Week 3-4)

### Task 3.1: Master admin — vehicle class catalog CRUD

**Files:**
- Create: `packages/web/app/[locale]/admin/vehicle-classes/` — list, create, edit pages
- Create: API routes for vehicle class CRUD

**Steps:**
1. List all vehicle classes with name, tags, capacity, image, sort order
2. Create/edit form: name, tags (multi-select), capacity, description, image upload (sharp → WebP)
3. Activate/deactivate classes
4. Reorder via drag-and-drop or sort field

### Task 3.2: Organization — fleet management

**Files:**
- Create: `packages/web/app/[locale]/org/fleet/` — vehicles list, add/edit pages
- Create: API routes for vehicle CRUD

**Steps:**
1. Org selects which vehicle classes they offer
2. Register vehicles: plate, vehicle class, year, photo upload (sharp → WebP)
3. Vehicle status management: available, on_trip, maintenance
4. Assign/unassign vehicles to drivers (via DriverOrg)
5. Only classes with registered vehicles + pricing rules show in booking broadcasts

### Task 3.3: Organization — pricing configuration

**Files:**
- Create: `packages/web/app/[locale]/org/pricing/` — pricing rules page
- Create: API routes for pricing CRUD

**Steps:**
1. For each vehicle class the org offers, set: minimum fare, rate/km, night multiplier, airport fixed rate, free waiting minutes, waiting rate/min, extra stop fee
2. Form with validation (Zod schemas from shared package)
3. Preview calculator: "A 15km night trip in an E Class would cost €X"
4. Pricing rules are per (org, vehicleClass) — unique constraint

---

## Milestone 4: Client Booking Flow (Week 4-6)

### Task 4.1: Booking page — pickup, dropoff, multiple stops

**Files:**
- Create: `packages/web/app/[locale]/book/` — booking flow pages
- Create: `packages/web/components/booking/` — map, address input, vehicle selector

**Steps:**
1. Address input with Google Places autocomplete (pickup, dropoff)
2. "Add stop" button — add intermediate waypoints (stored as JSON array)
3. Map showing route from pickup → stops → dropoff (Google Routes API)
4. Display estimated distance and duration

### Task 4.2: Nearest driver ETA

**Files:**
- Create: `packages/web/lib/maps/distance-matrix.ts`
- Create: API route for ETA calculation

**Steps:**
1. When client enters pickup + selects vehicle class, query all online drivers with that class
2. Get driver locations from Redis (latest GPS) or DB
3. Call Google Distance Matrix API: origins = driver locations, destination = pickup
4. Return shortest ETA: "Closest driver ~4 min away"
5. Update every 30 seconds while client is on booking page

### Task 4.3: Vehicle class selection + fare estimate

**Files:**
- Create: `packages/web/components/booking/vehicle-selector.tsx`
- Create: `packages/web/lib/pricing/calculator.ts`

**Steps:**
1. Show available vehicle classes with photo, name, tags, capacity
2. For each class, calculate fare range (min/max across all orgs offering it)
3. Include nearest driver ETA per class if available
4. Client selects class → show fare range prominently
5. Fare calculator: `MAX(minimumFare, ratePerKm × distance) × nightMultiplier + stops × extraStopFee`

### Task 4.4: Booking confirmation + broadcast

**Files:**
- Create: `packages/web/lib/notifications/booking-broadcast.ts`
- Create: API route for booking creation

**Steps:**
1. Client confirms: create Booking with `status: pending`, `timeoutAt: now + 5min`
2. Find all verified orgs that: offer the vehicle class AND have at least one online driver
3. SSE broadcast to matching orgs with booking details + their calculated fare
4. Push notification to org admins
5. Client sees "Finding your driver..." screen with countdown

### Task 4.5: Booking accept (race condition safe)

**Files:**
- Create: API route for booking acceptance

**Steps:**
1. Org taps "Accept" → atomic DB update:
   ```sql
   UPDATE bookings SET org_id = ?, status = 'accepted' WHERE id = ? AND status = 'pending'
   ```
2. If 0 rows updated → return error "Booking no longer available"
3. If successful → SSE broadcast `booking_taken` to all other orgs
4. Client receives push notification: "Organization accepted!"
5. Org assigns driver + vehicle → client gets driver photo, vehicle photo, plate, ETA

### Task 4.6: Booking timeout

**Files:**
- Create: `packages/web/lib/booking/timeout.ts`
- Create: Cron job or background check

**Steps:**
1. Background job runs every 30 seconds (or use Vercel Cron)
2. Find bookings where `status = 'pending' AND timeoutAt < now()`
3. Update to `status: timed_out`
4. Push notification + SMS to client: "No driver available. Try again?"
5. Client can retry with same details

---

## Milestone 5: Driver App (Week 6-8)

### Task 5.1: Driver login + profile

**Files:**
- Create: `packages/web/app/[locale]/driver/` — layout, login, profile pages

**Steps:**
1. Phone + PIN login page (uses NextAuth credentials provider)
2. Profile page: upload/change driver photo (sharp → WebP → Supabase storage)
3. Show all organizations the driver belongs to

### Task 5.2: Driver trip list + accept/reject

**Files:**
- Create: `packages/web/app/[locale]/driver/trips/` — trip list, trip detail pages

**Steps:**
1. List assigned trips from ALL the driver's organizations, sorted by date
2. Label each trip with org name
3. New trip notification (push) with accept/reject buttons
4. Accept → trip status changes to `driver_en_route`
5. Reject → org is notified, can assign another driver

### Task 5.3: Trip execution flow

**Files:**
- Create: `packages/web/components/driver/trip-flow.tsx`

**Steps:**
1. "Start Trip" → begins GPS broadcasting (Socket.IO)
2. "Navigate" → deep link to Google Maps/Waze (supports waypoints for multi-stop)
3. "Arrived at Pickup" → sets `waitingStartedAt`, starts waiting timer
4. Waiting timer visible to both driver and client (synced via SSE)
5. "Passenger Picked Up" → sets `waitingEndedAt`, calculates `waitingMinutes`
6. For multi-stop: show next stop, update navigation link
7. "Complete Trip" → stops GPS → payment confirmation screen
8. Select cash/POS → trip closed, `paymentConfirmed: true`

### Task 5.4: Capacitor setup

**Files:**
- Create: `packages/web/capacitor.config.ts`
- Create: `packages/web/android/`, `packages/web/ios/`

**Steps:**
1. Install Capacitor core + CLI
2. Configure to serve from Vercel URL (remote app)
3. Add plugins: geolocation, background-geolocation, push-notifications, local-notifications, preferences
4. Android: configure foreground service for GPS
5. iOS: configure background location permission
6. Build and test on emulator/device

### Task 5.5: Background GPS + offline queue

**Files:**
- Create: `packages/web/lib/driver/gps-service.ts`

**Steps:**
1. Use `@capacitor-community/background-geolocation` for persistent GPS
2. Foreground service with "Trip in progress" notification
3. GPS fires every 4 seconds, filter `accuracy > 50m`
4. Send via Socket.IO to WS server
5. If disconnected: queue to Capacitor Preferences with timestamps
6. On reconnect: flush queue in order

---

## Milestone 6: Real-Time Infrastructure (Week 8-9)

### Task 6.1: WS server — Socket.IO + Redis

**Files:**
- Create: `packages/ws-server/src/index.ts`
- Create: `packages/ws-server/src/redis.ts`
- Create: `packages/ws-server/src/handlers/gps.ts`
- Create: `packages/ws-server/src/auth.ts`

**Steps:**
1. Socket.IO server with Redis adapter
2. JWT authentication on connection (verify with shared secret)
3. GPS handler: receive `{ driverId, lat, lng, accuracy, speed, bearing, timestamp }`
4. Publish to Redis channel `driver:{driverId}:location`
5. Write to Postgres every 30 seconds (batch insert)
6. Rooms: each driver broadcasts to their room, dashboards join rooms

### Task 6.2: SSE endpoints for dashboards

**Files:**
- Create: `packages/web/app/api/sse/` — SSE routes for different consumers

**Steps:**
1. `/api/sse/driver-locations` — subscribe to Redis, stream GPS to dashboard
2. `/api/sse/bookings` — stream new/updated bookings to org dashboards
3. `/api/sse/trip-status` — stream trip status changes to clients
4. `/api/sse/waiting` — stream waiting timer updates
5. Auth check on each SSE endpoint (role-based filtering)

### Task 6.3: Live map components

**Files:**
- Create: `packages/web/components/maps/` — live map, markers, tracking

**Steps:**
1. `@vis.gl/react-google-maps` + `AdvancedMarkerElement`
2. Smooth marker animation with `requestAnimationFrame` + linear interpolation
3. Vehicle icon rotation based on bearing
4. `@googlemaps/markerclusterer` for admin/org maps
5. Four map variants: admin (all drivers), org (own fleet), client tracking, driver (route preview)
6. Passenger tracking page: `/track/[tripId]` — no auth, SSE to one driver

---

## Milestone 7: Communication + Notifications (Week 9-10)

### Task 7.1: Masked communication (Twilio Proxy)

**Files:**
- Create: `packages/web/lib/communication/twilio-proxy.ts`
- Create: API routes for proxy session management

**Steps:**
1. When driver is assigned → create Twilio Proxy Session
2. Add driver + client as participants (their real phone numbers)
3. Twilio returns masked numbers for each
4. Store `proxySessionId` on Booking
5. Show masked numbers in client app and driver app with "Call" / "Message" buttons
6. On trip completion → close Proxy Session

### Task 7.2: SMS notifications

**Files:**
- Create: `packages/web/lib/notifications/sms.ts`

**Steps:**
1. Twilio SDK wrapper: `sendSMS(to, body)`
2. Trigger on: driver assigned, driver en route (with tracking link), trip completed (fare summary), driver invite
3. Fire-and-forget with error logging
4. Template strings with booking data interpolation

### Task 7.3: Push notification integration

**Steps:**
1. Integrate `push.ts` from Task 2.5 into all booking lifecycle events
2. Client push: booking confirmed, org accepted, driver assigned (with photos), en route, waiting, timeout, completed + rate
3. Driver push: new trip assigned with accept/reject action
4. Org admin push: new available booking, low rating alert
5. Test on real devices (Android + iOS)

---

## Milestone 8: Fare Calculation + Pricing Engine (Week 10-11)

### Task 8.1: Google Routes API integration

**Files:**
- Create: `packages/web/lib/maps/routes.ts`

**Steps:**
1. Calculate route distance with waypoints (multi-stop support)
2. Return `distanceMeters`, `duration`, polyline
3. Cache route for booking display
4. Handle errors gracefully (fallback to Haversine if API fails)

### Task 8.2: Google Roads API — snap to roads

**Files:**
- Create: `packages/web/lib/maps/roads.ts`

**Steps:**
1. Post-trip: collect GPS trace from `DriverLocation` records
2. Call Roads API `snapToRoads` with `interpolate=true`
3. Sum Haversine distances between consecutive snapped points = actual distance
4. Compare to estimate

### Task 8.3: Fare calculation engine

**Files:**
- Create: `packages/web/lib/pricing/calculator.ts`
- Create: `packages/web/lib/pricing/waiting-time.ts`

**Steps:**
1. Pre-trip estimate: `MAX(minimumFare, ratePerKm × distance) × nightMultiplier + stops × extraStopFee`
2. Post-trip actual: same formula with actual distance + waiting charges
3. Waiting charge: `MAX(0, waitingMinutes - freeWaitingMinutes) × waitingRatePerMin`
4. Airport override: if pickup/dropoff is airport → use `airportFixedRate`
5. Show fare breakdown: base fare + distance + waiting + stops + night surcharge

### Task 8.4: Commission calculation

**Files:**
- Create: `packages/web/lib/pricing/commission.ts`

**Steps:**
1. On trip completion: `commission = actualFare × org.commissionRate`
2. Store on Trip or calculate on-the-fly for reports
3. Monthly aggregation query: per-org revenue and commission
4. Export to CSV for invoicing

---

## Milestone 9: Master Admin Panel (Week 11-12)

### Task 9.1: Admin dashboard — analytics

**Files:**
- Create: `packages/web/app/[locale]/admin/` — dashboard, analytics pages

**Steps:**
1. Key metrics: trips today/week/month, active drivers, total revenue, your commission
2. Top organizations by volume and revenue
3. Trend indicators (vs previous period)
4. Cancellation rate with reasons
5. Per-org breakdown table

### Task 9.2: Admin — live operations map

**Steps:**
1. Full-screen map showing all active drivers across all orgs
2. Cluster markers when zoomed out
3. Click driver → see trip details, org, speed, destination
4. Filter by org, vehicle class, driver status

### Task 9.3: Admin — commission management

**Files:**
- Create: `packages/web/app/[locale]/admin/commission/` — settings, reports pages

**Steps:**
1. Set default commission rate for new orgs
2. Override commission rate per org
3. Monthly commission report: per-org revenue, commission, total owed
4. Historical data by month
5. Export to CSV

### Task 9.4: Admin — cancellation policy

**Files:**
- Create: `packages/web/app/[locale]/admin/settings/` — cancellation policy page

**Steps:**
1. Configure free cancellation window (minutes before pickup)
2. Late cancellation fee (% of estimated fare)
3. No-show fee (% of estimated fare)
4. Single record — CancellationPolicy table

### Task 9.5: Admin — audit log

**Files:**
- Create: `packages/web/app/[locale]/admin/audit/` — audit log page

**Steps:**
1. List all actions with user, action, entity, timestamp
2. Filter by user, action type, date range, entity
3. Paginated with search

---

## Milestone 10: Client Accounts + Ratings (Week 12-13)

### Task 10.1: Client trip history

**Files:**
- Create: `packages/web/app/[locale]/account/` — trip history, trip detail pages

**Steps:**
1. List all past bookings: date, route, fare, vehicle class, driver, rating
2. Trip detail: route on map, fare breakdown, receipt, driver/vehicle info
3. Pagination + search by date

### Task 10.2: Trip receipts

**Steps:**
1. Receipt view: route map, pickup/dropoff/stops, distance, fare breakdown (base + distance + waiting + stops + night), payment method, driver, vehicle
2. Generated from Booking + Trip records (no separate table)
3. Printable/downloadable format

### Task 10.3: Saved locations

**Files:**
- Create: `packages/web/app/[locale]/account/locations/` — saved locations page
- Create: API routes for saved locations CRUD

**Steps:**
1. Save current addresses as favorites (home, office, airport, custom label)
2. Show saved locations in booking address autocomplete
3. Quick-select from saved locations when booking

### Task 10.4: Rating system

**Files:**
- Create: `packages/web/components/rating/` — star rating component, review form

**Steps:**
1. After trip completion → push notification with rate prompt
2. Rating page: 1-5 stars + optional comment
3. Rating stored on Rating model (linked to booking, client, driver)
4. Org admin sees per-driver ratings
5. Master admin sees platform-wide ratings, can flag low-rated orgs/drivers
6. Organization average rating shown to clients before booking

### Task 10.5: Re-book previous trip

**Steps:**
1. "Book again" button on trip history
2. Pre-fills pickup, dropoff, stops, vehicle class from previous booking
3. Client adjusts date/time and confirms

---

## Milestone 11: Organization Dashboard (Week 13-14)

### Task 11.1: Org — incoming bookings + accept

**Files:**
- Create: `packages/web/app/[locale]/org/bookings/` — booking list, accept flow

**Steps:**
1. Real-time list of available bookings (SSE from booking broadcast)
2. Each booking shows: pickup, dropoff, stops, distance, vehicle class, org's fare
3. "Accept" button with countdown timer
4. Accepted booking → assign driver + vehicle from fleet
5. Booking disappears from list when another org accepts (SSE `booking_taken`)

### Task 11.2: Org — live fleet map

**Steps:**
1. Map showing only this org's active drivers
2. Click driver → trip details, status, speed
3. Filter by driver status

### Task 11.3: Org — revenue reports

**Files:**
- Create: `packages/web/app/[locale]/org/reports/` — revenue, driver performance pages

**Steps:**
1. Total trips + revenue: today, this week, this month
2. Per-driver performance: trips completed, hours on trip, average rating
3. Trip history with full details
4. Monthly revenue summary (before platform commission)

---

## Milestone 12: Deployment + QA (Week 14-16)

### Task 12.1: Hetzner VPS — WS server + Redis

**Steps:**
1. Provision Hetzner CX22 (2 vCPU / 4GB)
2. Docker Compose: Socket.IO server + Redis
3. Nginx reverse proxy with SSL (Let's Encrypt)
4. Configure firewall rules
5. Test WebSocket connectivity

### Task 12.2: CI/CD — GitHub Actions

**Steps:**
1. Web: auto-deploy to Vercel on push to `main` (already built-in)
2. WS server: GitHub Action → SSH to Hetzner → docker pull + restart
3. Shared: build check in CI
4. Run `pnpm lint` + `pnpm tsc --noEmit` on PR

### Task 12.3: Capacitor build + store submission

**Steps:**
1. Android: build APK/AAB, test on real device
2. iOS: build via Xcode, test on real device
3. Prepare store listings (screenshots, description)
4. Note: store submission itself is client's responsibility

### Task 12.4: End-to-end testing

**Steps:**
1. Full booking flow: client books → org accepts → driver assigned → trip executed → payment → rating
2. Booking timeout: no org accepts → client notified
3. Race condition: two orgs try to accept simultaneously → only one succeeds
4. GPS tracking: driver starts trip → positions appear on dashboard in real-time
5. Masked communication: client calls driver via proxy number
6. Waiting time: driver arrives → timer starts → charge applied
7. Multi-stop: booking with waypoints → navigation through all stops
8. Push notifications: verify delivery on Android + iOS
9. Offline: driver loses connection → GPS queued → flushed on reconnect

### Task 12.5: Load testing

**Steps:**
1. Simulate 50 concurrent GPS streams to WS server
2. Verify dashboard update latency < 1 second
3. Simulate 10 simultaneous booking broadcasts
4. Verify race condition handling under load

### Task 12.6: Acceptance criteria verification

All must pass in production:
1. Client can book a ride, choosing vehicle class and multiple stops
2. Booking broadcasts to matching orgs, first to accept wins
3. Booking times out after 5 minutes if no org accepts
4. Nearest driver ETA shows on booking screen
5. Org admin can manage fleet, drivers, and pricing per vehicle class
6. Driver can accept trip, navigate, track waiting time, confirm payment
7. Live GPS tracking works on org dashboard, admin map, and client tracking page
8. Client and driver can communicate via masked numbers
9. Rating system works end-to-end
10. Client has trip history with receipts and saved locations
11. Master admin sees commission reports per org
12. Push notifications delivered on Android and iOS
13. Platform handles 50 concurrent GPS streams without degradation
