# TransferGR Architecture Design

**Date:** 2026-03-11
**Status:** Approved (v3 — full feature set)
**Scope:** Architecture, scale, hosting, and technical approach for Phase 1

---

## Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Business model | Uber-style: clients book, orgs compete to accept | Client doesn't choose an org — first to accept wins |
| WS server language | Node.js/TypeScript | Same language as web app, shared types, no Python dependency |
| Monorepo tooling | Plain pnpm workspaces | 2-3 packages, Turborepo overkill for now |
| Launch scale | Small (1-5 orgs, 10-30 vehicles) | Architect for ~100 concurrent GPS streams max |
| Hosting | Vercel (web) + Hetzner VPS (WS + Redis) | Best DX for Next.js + cheap persistent WS hosting |
| Database | Supabase Postgres, no PostGIS | Plain lat/lng + app-level Haversine. PostGIS unnecessary at this scale |
| Real-time strategy | WebSocket for GPS, SSE for notifications + booking broadcasts | Clean separation; SSE works on Vercel, WS needs persistent server |
| Driver auth | NextAuth credentials provider (phone + PIN) | One auth system, two login flows |
| Driver app | Capacitor wrapper around Next.js routes | PWA cannot do background GPS — Capacitor gives native foreground service |
| Pricing model | Per vehicle class: minimum fare OR (rate/km × distance) + waiting time + multi-stop fees | Orgs set their own prices per vehicle class |
| Revenue model | Platform commission per org (% of completed trip fare) | Master admin collects commission monthly |
| Communication | Twilio Proxy for masked driver-client calls/messages | No personal numbers exposed |
| Notifications | Push (Firebase + APNs) primary, SMS fallback | Cheaper and richer than SMS-only |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16 (App Router) | Web app — all panels, booking, admin |
| Styling | Tailwind CSS 4 + shadcn/ui | UI components |
| State | Zustand | Client-side state |
| Auth | NextAuth 4 (Google OAuth + Credentials) | Multi-role authentication |
| ORM | Prisma | Database access |
| Database | Supabase PostgreSQL | All data |
| Real-time GPS | Socket.IO + Redis pub/sub | Driver GPS streaming |
| Real-time notifications | Server-Sent Events (SSE) | Booking broadcasts, status updates |
| Push notifications | Firebase Cloud Messaging + APNs | Client + driver push alerts |
| Maps | Google Maps JS API + @vis.gl/react-google-maps | Live tracking, route preview |
| Distance/Routing | Google Routes API + Roads API + Distance Matrix API | Fare estimates, GPS snap-to-road, nearest driver ETA |
| Address search | Google Places API | Autocomplete for pickup/dropoff/stops |
| Masked communication | Twilio Proxy | Driver-client calls/messages without revealing numbers |
| SMS | Twilio | Fallback notifications |
| Validation | Zod | Shared schemas (web + ws-server) |
| Image processing | sharp | Driver/vehicle photo compression → WebP |
| Driver App | Capacitor (wraps Next.js /driver routes) | Native GPS, background tracking, push |
| Web Hosting | Vercel | Next.js app |
| WS Hosting | Hetzner VPS (CX22) | Socket.IO + Redis |
| Monorepo | pnpm workspaces | 3 packages: web, ws-server, shared |
| CI/CD | GitHub Actions | Auto-deploy to Vercel + Hetzner |
| TypeScript | Strict mode | Everything |

---

## 1. Monorepo Structure

```
transfer-app/
├── pnpm-workspace.yaml
├── packages/
│   ├── web/                  # Next.js 16 app (current codebase moved here)
│   │   ├── app/[locale]/
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── admin/                # Master Admin panel
│   │   │   ├── org/                  # Organization panel (fleet, pricing, dispatch)
│   │   │   ├── book/                 # Client booking flow
│   │   │   ├── account/              # Client trip history, saved locations, settings
│   │   │   ├── track/[tripId]/       # Public passenger tracking page
│   │   │   └── driver/               # Driver UI routes (served via Capacitor)
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── notifications/
│   │   │   │   ├── push.ts           # Firebase Cloud Messaging
│   │   │   │   ├── sms.ts            # Twilio SMS
│   │   │   │   ├── sse.ts            # SSE emitter (Redis → client)
│   │   │   │   └── booking-broadcast.ts  # Find matching orgs, broadcast booking
│   │   │   ├── communication/
│   │   │   │   └── twilio-proxy.ts   # Masked calling/messaging sessions
│   │   │   ├── pricing/
│   │   │   │   ├── calculator.ts     # Fare calculation engine
│   │   │   │   └── waiting-time.ts   # Waiting time charge logic
│   │   │   └── maps/
│   │   │       ├── routes.ts         # Google Routes API (distance, duration)
│   │   │       ├── roads.ts          # Google Roads API (snap-to-roads)
│   │   │       └── distance-matrix.ts # Nearest driver ETA
│   │   └── package.json
│   │
│   ├── ws-server/            # Standalone Node.js WebSocket service
│   │   ├── src/
│   │   │   ├── index.ts              # Socket.IO server entry
│   │   │   ├── redis.ts              # Redis pub/sub client
│   │   │   ├── handlers/
│   │   │   │   ├── gps.ts            # GPS message handling
│   │   │   │   └── waiting.ts        # Waiting timer sync
│   │   │   └── auth.ts               # JWT verification (shared secret with web)
│   │   └── package.json
│   │
│   └── shared/               # Shared TypeScript types & utilities
│       ├── src/
│       │   ├── types/                # All interfaces (Booking, Trip, Driver, Org, VehicleClass, Rating...)
│       │   ├── constants.ts          # Shared enums, status codes, vehicle classes
│       │   └── validation.ts         # Shared Zod schemas
│       └── package.json
```

**Key decisions:**
- Current codebase moves into `packages/web/`
- Driver app lives inside Next.js as a route group (`/driver/`) — not a separate package
- Client booking at `/book/`, client account at `/account/`
- Public tracking page at `/track/[tripId]` (no auth)
- `shared` package referenced via `"@transfergr/shared": "workspace:*"`
- Prisma stays in `packages/web/` — only Next.js API routes access the DB
- WS server communicates via Redis only — no direct DB access

---

## 2. User Roles & Route Groups

| Role | Auth Method | Route Group | Access |
|------|------------|-------------|--------|
| Super Admin (Master) | Google OAuth | `/admin/*` | Everything — all orgs, trips, revenue, commission, vehicle catalog, cancellation policy |
| Org Admin | Google OAuth | `/org/*` | Own fleet, drivers, pricing, bookings, revenue |
| Client | Google OAuth or guest | `/book/*`, `/account/*` | Book rides, track trips, rate, view receipts, saved locations |
| Driver | Phone + PIN | `/driver/*` | Assigned trips from all their orgs, GPS, communication, payment confirm |

**Middleware** checks role on every route group. JWT contains `role` + `orgId` (nullable for super admin and clients).

---

## 3. Booking Flow (Uber-Style Broadcast)

### Client Flow
1. Client enters pickup address (Google Places autocomplete)
2. Client can **add multiple stops** (waypoints) before the final destination
3. Platform queries **Distance Matrix API** to find nearest available drivers → shows ETA ("Closest driver ~4 min away")
4. Client selects vehicle class — sees photo, capacity, fare range (min/max across orgs offering that class)
5. Google Routes API calculates distance (with waypoints) → fare range shown
6. Client selects passenger count, luggage count, date/time, special instructions
7. Client confirms booking

### Broadcast & Accept
1. Booking created with status `pending`, `timeoutAt` set to `now() + 5 minutes`
2. SSE broadcast to **all verified orgs** that offer the requested vehicle class and have available drivers
3. Each org sees: pickup, dropoff, stops, distance, and **their fare** (based on their pricing)
4. **First org to accept wins** — atomic DB update:
   ```sql
   UPDATE bookings SET org_id = ?, status = 'accepted'
   WHERE id = ? AND status = 'pending'
   ```
5. If 0 rows updated → another org already accepted → return "booking no longer available"
6. SSE broadcasts `booking_taken` to all other orgs (booking disappears)
7. Accepting org assigns a driver + vehicle
8. Client receives push notification: **driver photo, name, vehicle photo, plate, ETA**

### Booking Timeout
- Background job checks for `pending` bookings past `timeoutAt`
- After 5 minutes with no acceptance → status changes to `timed_out`
- Client receives push notification + SMS: "No driver available. Try again?"
- Client can retry with same details or modify

### Booking Statuses
```
pending → accepted → driver_assigned → driver_en_route → waiting_at_pickup → in_progress → completed
                                                                                          → cancelled (at any stage before in_progress)
       → timed_out (no org accepted within 5 minutes)
```

---

## 4. Vehicle Class System

### Platform Catalog (managed by Master Admin)

Pre-seeded classes:

| Class | Tags | Capacity | Similar |
|-------|------|----------|---------|
| Mercedes E Class | Business Class | 3 | BMW 5 Series, Cadillac XTS |
| Mercedes S Class | Business Class, VIP, Premium | 3 | BMW 7, Audi A8, Cadillac Escalade |
| Mercedes Vito | Family Friendly, Group Travel | 7 | Ford Custom, Chevrolet Suburban |
| Mercedes V Class | Family Friendly, Group Travel, Premium | 6 | Cadillac Escalade |
| Mercedes Sprinter | Group Travel, Large Groups | 16 | Ford Transit |

### How Organizations Use It
- Org selects which classes they offer from the catalog
- Registers actual vehicles: plate, class, year, **photos** (compressed via sharp → WebP)
- Sets pricing per class (minimum fare + rate/km + waiting + stop fees)
- Only classes with configured pricing appear in booking broadcasts

---

## 5. Pricing & Fare Calculation

### Formula
```
baseFare = MAX(minimumFare, ratePerKm × distance_km)
fare = baseFare
     × nightMultiplier          // 1.0 during day, 1.5 between 00:00-06:00
     + waitingCharge             // (waitMinutes - freeWaitMinutes) × waitingRatePerMin
     + extraStopFee × numStops   // per additional stop
```

If airport pickup/dropoff → use `airportFixedRate` instead of baseFare (surcharges still apply).

### Pre-trip Estimate
- Google Routes API with waypoints → `distanceMeters`
- Query all orgs' pricing rules for selected vehicle class
- Show client fare range: cheapest to most expensive org
- After an org accepts → show exact fare based on that org's pricing

### Post-trip Actual
- GPS trace from 30s-interval points → Google Roads API `snapToRoads` → actual distance
- Add waiting time charges (from waiting timer)
- Apply same formula with actual distance + actual waiting
- Show estimate vs actual to org and master admin

### Nearest Driver ETA
- When client selects vehicle class, query all online drivers with that class
- Google Distance Matrix API: `origins` = driver locations, `destination` = pickup
- Show shortest ETA: "Closest driver ~4 min away"
- Update every 30 seconds while client is on booking screen

---

## 6. Real-Time GPS Pipeline

### Stack
Socket.IO + Redis adapter on the WS server.

### Why Socket.IO over raw WebSocket
- Built-in exponential backoff with jitter (prevents thundering herd on server restart)
- Automatic packet buffering during disconnection and replay on reconnect
- Room-based pub/sub (subscribe to `driver:{id}:location` channels)
- Fallback to HTTP long-polling if WebSocket fails

### Driver → Server flow
1. Capacitor native layer runs a foreground service ("Trip in progress" notification)
2. Native GPS fires every 4 seconds with `enableHighAccuracy: true` (~3-10m accuracy)
3. Points with `coords.accuracy > 50m` are discarded
4. Points batched and sent every 4 seconds over Socket.IO
5. If disconnected, queue to Capacitor Preferences, flush on reconnect with timestamps

### Server → Dashboard flow
1. WS server receives GPS point, publishes to Redis channel `driver:{driverId}:location`
2. Next.js API route subscribes to Redis and proxies to SSE for dashboard clients
3. Dashboard clients only subscribe to drivers relevant to their org/view
4. Client tracking page subscribes to a single driver
5. Passenger shared tracking link subscribes to a single driver (no auth)

### Persistence
- Write to Postgres every 30 seconds (not every 4s — reduces DB writes by 7x)
- Store as plain `lat DOUBLE PRECISION, lng DOUBLE PRECISION, timestamp TIMESTAMPTZ`
- Trip history reconstructed from 30s-interval points

### Bandwidth
- JSON payloads: `{ driverId, lat, lng, accuracy, speed, bearing, timestamp }` (~120 bytes)
- 30 drivers × 15 updates/min = ~54KB/min total. Negligible.

---

## 7. Google Maps Live Vehicle Tracking

### Library
`@vis.gl/react-google-maps` for React bindings + `AdvancedMarkerElement`

### Smooth marker animation
- GPS arrives every 4 seconds, markers animate continuously between points
- `requestAnimationFrame` with linear interpolation over ~3.8s (200ms buffer)
- Calculate bearing between consecutive points, rotate vehicle icon via CSS `transform: rotate()`
- CSS `translate3d` for hardware-accelerated movement (avoids layout thrashing, 60fps)

### Marker management
- Reuse marker instances — never create/destroy on each update
- `@googlemaps/markerclusterer` with SuperCluster for admin "all vehicles" map
- Only render markers within current viewport

### Map views
- **Client booking**: Route from pickup → stops → dropoff with fare estimate + nearest driver ETA
- **Client tracking**: Live driver marker with ETA, status updates, share link
- **Org dashboard**: Live map of their fleet's active drivers. Click for trip details
- **Master Admin**: All drivers across all orgs with clustering
- **Driver**: Static map with pickup → stops → dropoff + route preview. "Navigate" deep-links to Google Maps/Waze

### Passenger tracking link
- Shareable URL: `/track/{tripId}` — no auth required
- Single driver marker on map with ETA
- Driver photo, name, vehicle info displayed
- SSE subscription to one driver's location
- Link expires when trip completes

---

## 8. Waiting Time System

### How it works
1. Driver taps "Arrived at Pickup" → booking status changes to `waiting_at_pickup`
2. WS server starts tracking waiting time for this trip
3. Both driver app and client app show a live countdown/timer synced via SSE
4. Free waiting period (configurable per org, e.g. 5 min) — no charge
5. After free period → waiting charges accrue at org's `waitingRatePerMin`
6. When client is picked up → driver taps "Passenger Picked Up" → timer stops
7. Total waiting charge added to final fare

### Data flow
```
Driver taps "Arrived" → API route sets waiting_started_at on Trip
  → SSE pushes waiting event to client
  → Both apps show synchronized timer
Driver taps "Picked Up" → API calculates waiting duration
  → Waiting charge = max(0, totalMinutes - freeMinutes) × ratePerMin
  → Stored on Trip record
```

---

## 9. Masked Communication (Twilio Proxy)

### How it works
1. When a driver is assigned to a booking, create a **Twilio Proxy Session**
2. Twilio provides a masked phone number for both parties
3. Client calls/texts the masked number → Twilio routes to driver's real number (and vice versa)
4. Neither party sees the other's personal number
5. Session is active only during the trip lifecycle (`driver_assigned` → `completed`)
6. On trip completion → session is closed, masked number is released

### Implementation
- `lib/communication/twilio-proxy.ts` — create/close proxy sessions
- Called from booking server actions when driver is assigned and trip completes
- Proxy number shown in client app and driver app alongside "Call" and "Message" buttons

### Cost
- Twilio Proxy: ~$0.01/min for voice, ~$0.005/message
- At 20 trips/day with avg 1 call of 2 min = ~$12/month

---

## 10. Push Notifications

### Stack
- **Firebase Cloud Messaging (FCM)** for Android + web
- **Apple Push Notification service (APNs)** for iOS (via FCM)
- Capacitor plugin: `@capacitor/push-notifications`

### How it works
1. On login, client/driver app registers with FCM → receives device token
2. Device token stored in DB linked to user
3. When an event occurs (booking accepted, driver assigned, etc.), server sends push via FCM
4. FCM delivers to device → app shows notification

### Notification types

| Event | Recipient | Push Content |
|-------|-----------|-------------|
| Booking confirmed | Client | "Finding your driver..." |
| Org accepted | Client | "Athens Executive Cars accepted your booking" |
| Driver assigned | Client | Driver photo, vehicle photo, name, plate, ETA |
| Driver en route | Client | "Your driver is on the way" |
| Waiting at pickup | Client | "Driver is waiting at pickup" |
| Timeout (no org accepted) | Client | "No driver available. Try again?" |
| Trip completed | Client | Fare + "Rate your experience" |
| New trip assigned | Driver | Trip details with accept/reject actions |

### SMS fallback
SMS sent for critical events (driver assigned, en route, trip completed) regardless of push — ensures delivery even without the app installed.

---

## 11. Driver App (Capacitor)

### Architecture
Next.js route group `/driver/` rendered inside a Capacitor shell.

### Web layer (stays in Next.js)
- All UI: login, trip list, trip details, payment confirmation, waiting timer
- Socket.IO client for GPS sending and receiving assignments
- Service worker for caching trip details offline

### Native layer (Capacitor plugins)
- `@capacitor/geolocation` — native GPS with background support
- `@capacitor-community/background-geolocation` — foreground service with persistent notification
- `@capacitor/push-notifications` — FCM/APNs push notifications
- `@capacitor/local-notifications` — local alerts
- `@capacitor/preferences` — offline GPS queue storage
- Deep links to Google Maps / Waze for navigation

### Driver flow
1. Login with phone + PIN (NextAuth credentials provider)
2. Upload/update profile photo
3. See assigned trips from all organizations they belong to, sorted chronologically
4. Receive push notification for new trip → Accept or reject
5. Tap "Start Trip" → foreground service starts → GPS broadcasting begins
6. Tap "Navigate" → opens Google Maps/Waze with destination (supports waypoints for multi-stop)
7. GPS continues broadcasting while driver uses external navigation
8. Tap "Arrived at Pickup" → waiting timer starts → client notified
9. Tap "Passenger Picked Up" → timer stops → trip is in_progress
10. Contact client via masked number (call or message) at any point
11. For multi-stop trips: navigation updates to next stop automatically
12. Tap "Complete Trip" → stops GPS → payment confirmation screen
13. Select payment method (cash / POS) → trip closed

### Multi-org drivers
- A driver can be invited to multiple organizations
- Trip list shows trips from all their orgs, labeled by org name
- Each org manages the driver independently (can assign vehicles, set availability)

### Offline resilience
- Trip details cached in Capacitor Preferences on assignment
- GPS points queued locally if Socket.IO disconnects
- On reconnect: flush queue with timestamps, server processes in order
- Driver always sees current trip details without connection

---

## 12. Client Accounts

### Features
- **Trip history** — all past rides with route on map, fare breakdown, receipt, driver/vehicle info, rating given
- **Saved locations** — home, office, airport, favorites (stored in DB, synced across devices)
- **Re-book** — one-tap re-book from a previous trip (same route, same vehicle class)
- **Active booking** — real-time tracking of current trip with driver position, ETA, share link

### Data model additions
```prisma
model SavedLocation {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  label     String   // "Home", "Office", "Airport", or custom
  address   String
  lat       Float
  lng       Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

Trip receipts are generated from the Booking + Trip records — no separate receipt table needed.

---

## 13. Auth & Full Data Model

### Authentication
- Google OAuth for master admin, org admins, and clients
- Credentials provider for drivers (phone + PIN)
- JWT strategy for both — single session model
- Role stored in JWT: `superadmin | orgadmin | driver | client`
- Middleware checks role per route group

### Database schema (Prisma)

```prisma
model Organization {
  id              String   @id @default(cuid())
  name            String
  contactEmail    String
  status          String   @default("pending") // pending, verified, suspended
  commissionRate  Float    @default(0.15)       // platform commission (15%)
  users           User[]
  bookings        Booking[]
  vehicles        Vehicle[]
  pricingRules    PricingRule[]
  driverOrgs      DriverOrg[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model User {
  id             String   @id @default(cuid())
  orgId          String?                           // null for super admin and clients
  org            Organization? @relation(fields: [orgId], references: [id])
  role           String                            // superadmin, orgadmin, driver, client
  name           String
  phone          String?  @unique
  email          String?  @unique
  pinHash        String?                           // for driver auth
  image          String?
  emailVerified  DateTime?
  driver         Driver?
  bookings       Booking[] @relation("ClientBookings")
  ratings        Rating[]  @relation("ClientRatings")
  savedLocations SavedLocation[]
  deviceTokens   DeviceToken[]
  auditLogs      AuditLog[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model DeviceToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  token     String   @unique                       // FCM device token
  platform  String                                 // android, ios, web
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

model VehicleClass {
  id          String   @id @default(cuid())
  name        String   @unique                    // "Mercedes E Class"
  tags        String[]                            // ["Business Class", "VIP"]
  capacity    Int
  description String?                             // "BMW 5 Series, Cadillac XTS or similar"
  imageUrl    String?
  sortOrder   Int      @default(0)
  active      Boolean  @default(true)
  vehicles    Vehicle[]
  pricingRules PricingRule[]
  bookings    Booking[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Vehicle {
  id             String       @id @default(cuid())
  orgId          String
  org            Organization @relation(fields: [orgId], references: [id])
  vehicleClassId String
  vehicleClass   VehicleClass @relation(fields: [vehicleClassId], references: [id])
  plateNumber    String       @unique
  year           Int?
  photoUrl       String?                          // compressed via sharp → WebP
  status         String       @default("available") // available, on_trip, maintenance
  driverOrgs     DriverOrg[]
  bookings       Booking[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
}

model Driver {
  id           String        @id @default(cuid())
  userId       String        @unique
  user         User          @relation(fields: [userId], references: [id])
  licenseNo    String
  photoUrl     String?                            // driver profile photo
  driverOrgs   DriverOrg[]
  locations    DriverLocation[]
  trips        Trip[]
  ratings      Rating[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

// Junction table: driver can belong to multiple organizations
model DriverOrg {
  id           String       @id @default(cuid())
  driverId     String
  driver       Driver       @relation(fields: [driverId], references: [id])
  orgId        String
  org          Organization @relation(fields: [orgId], references: [id])
  vehicleId    String?
  vehicle      Vehicle?     @relation(fields: [vehicleId], references: [id])
  availability String       @default("offline") // online, offline, on_trip
  inviteStatus String       @default("pending") // pending, accepted, rejected
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  @@unique([driverId, orgId])
}

model Booking {
  id                     String        @id @default(cuid())
  clientId               String
  client                 User          @relation("ClientBookings", fields: [clientId], references: [id])
  orgId                  String?                               // null until an org accepts
  org                    Organization? @relation(fields: [orgId], references: [id])
  driverId               String?
  driver                 Driver?       @relation(fields: [driverId], references: [id])
  vehicleId              String?
  vehicle                Vehicle?      @relation(fields: [vehicleId], references: [id])
  vehicleClassId         String
  vehicleClass           VehicleClass  @relation(fields: [vehicleClassId], references: [id])
  pickupAddress          String
  pickupLat              Float
  pickupLng              Float
  dropoffAddress         String
  dropoffLat             Float
  dropoffLng             Float
  stops                  Json?                                 // [{address, lat, lng}, ...] for multi-stop
  scheduledAt            DateTime
  passengerCount         Int           @default(1)
  luggageCount           Int           @default(0)
  specialInstructions    String?
  status                 String        @default("pending")
  // pending → accepted → driver_assigned → driver_en_route → waiting_at_pickup → in_progress → completed | cancelled | timed_out
  timeoutAt              DateTime?                             // pending + 5 min
  estimatedDistanceKm    Float?
  estimatedFareMin       Float?                                // cheapest org's fare
  estimatedFareMax       Float?                                // most expensive org's fare
  acceptedFare           Float?                                // winning org's fare
  actualDistanceKm       Float?
  actualFare             Float?
  waitingChargeAmount    Float?                                // waiting time surcharge
  paymentMethod          String?                               // cash, pos
  proxySessionId         String?                               // Twilio Proxy session ID
  trip                   Trip?
  rating                 Rating?
  createdAt              DateTime      @default(now())
  updatedAt              DateTime      @updatedAt
}

model Trip {
  id                String    @id @default(cuid())
  bookingId         String    @unique
  booking           Booking   @relation(fields: [bookingId], references: [id])
  driverId          String
  driver            Driver    @relation(fields: [driverId], references: [id])
  startedAt         DateTime  @default(now())
  endedAt           DateTime?
  waitingStartedAt  DateTime?                                  // driver arrived at pickup
  waitingEndedAt    DateTime?                                  // passenger picked up
  waitingMinutes    Float?                                     // total waiting duration
  paymentConfirmed  Boolean   @default(false)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

model Rating {
  id        String   @id @default(cuid())
  bookingId String   @unique
  booking   Booking  @relation(fields: [bookingId], references: [id])
  clientId  String
  client    User     @relation("ClientRatings", fields: [clientId], references: [id])
  driverId  String
  driver    Driver   @relation(fields: [driverId], references: [id])
  stars     Int                                                // 1-5
  comment   String?
  createdAt DateTime @default(now())
}

model DriverLocation {
  id         String   @id @default(cuid())
  driverId   String
  driver     Driver   @relation(fields: [driverId], references: [id])
  lat        Float
  lng        Float
  accuracy   Float?
  speed      Float?
  bearing    Float?
  recordedAt DateTime @default(now())

  @@index([driverId, recordedAt])
}

model PricingRule {
  id                 String       @id @default(cuid())
  orgId              String
  org                Organization @relation(fields: [orgId], references: [id])
  vehicleClassId     String
  vehicleClass       VehicleClass @relation(fields: [vehicleClassId], references: [id])
  minimumFare        Float                                     // e.g. €8.00
  ratePerKm          Float                                     // e.g. €1.20
  nightMultiplier    Float        @default(1.5)
  airportFixedRate   Float?                                    // null = use formula
  freeWaitingMinutes Int          @default(5)                  // free waiting period
  waitingRatePerMin  Float        @default(0.30)               // charge after free period
  extraStopFee       Float        @default(3.0)                // per additional stop
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  @@unique([orgId, vehicleClassId])
}

model CancellationPolicy {
  id                   String   @id @default(cuid())
  freeWindowMinutes    Int      @default(120)                  // free cancel 2+ hours before
  lateCancelFeePercent Float    @default(0.5)                  // 50% of estimated fare
  noShowFeePercent     Float    @default(1.0)                  // 100% of estimated fare
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

model SavedLocation {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  label     String                                             // "Home", "Office", custom
  address   String
  lat       Float
  lng       Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String
  entity    String
  entityId  String
  metadata  Json?
  createdAt DateTime @default(now())

  @@index([entity, entityId])
  @@index([userId])
}
```

### Booking statuses
```
pending → accepted → driver_assigned → driver_en_route → waiting_at_pickup → in_progress → completed
       → timed_out (no org accepted within 5 minutes)
       → cancelled (at any stage before in_progress)
```

---

## 14. Notifications Architecture

### Push (Primary — Firebase Cloud Messaging)
- Client: booking status, driver assigned (with photos), ETA, waiting, timeout, trip completed + rate
- Driver: new trip assignment with accept/reject, client communication
- Org admin: new available booking (broadcast), low rating alert

### SSE (Real-time dashboards)
- Booking broadcast → all matching verified orgs
- Booking taken → remaining orgs (booking disappears)
- Trip status changes → org dashboard, client tracking page
- GPS updates → live map markers
- Waiting timer sync → client + driver

### SMS (Fallback — Twilio)
- Driver assigned → client (always, even with push)
- Driver en route with tracking link → client/passenger (always)
- Trip completed with fare → client (always)
- Driver invite → driver (always)

### Implementation
- `lib/notifications/push.ts` — Firebase Admin SDK, send to device tokens
- `lib/notifications/sms.ts` — Twilio SDK wrapper
- `lib/notifications/sse.ts` — SSE emitter reading from Redis pub/sub
- `lib/notifications/booking-broadcast.ts` — find matching orgs, send SSE + push to each
- All triggered from server actions after state changes
- SMS sent async (fire-and-forget with error logging)

---

## 15. Hosting & Infrastructure

| Component | Host | Cost |
|-----------|------|------|
| Next.js web app | Vercel (free tier → Pro if needed) | €0-20/mo |
| WS server + Redis | Hetzner CX22 (2 vCPU / 4GB) | ~€4/mo |
| Database | Supabase Postgres (free tier) | €0 |
| SMS | Twilio (pay-per-message) | ~€12/mo |
| Twilio Proxy | Masked calls/messages | ~€12/mo |
| Google Maps APIs | Maps JS + Routes + Roads + Places + Distance Matrix | ~€15-25/mo |
| Firebase | Push notifications | €0 (free tier) |
| **Total at launch** | | **~€40-75/mo** |

### Hetzner VPS setup
- Docker Compose: Socket.IO server + Redis containers
- Nginx reverse proxy with SSL (Let's Encrypt)
- GitHub Actions deploys on push to `main` (ssh + docker pull)

All infrastructure costs are tax-deductible business expenses (invoiced by providers).

---

## 16. Critical Finding: PWA Background GPS Limitation

**PWAs cannot do continuous background geolocation.** The Browser Geolocation API stops when:
- The tab is backgrounded
- The screen is locked
- The user switches to another app (Google Maps for navigation)

This is a fundamental browser limitation on both Android and iOS. **No workaround exists for iOS.**

**Solution:** Wrap the driver UI in Capacitor, which provides:
- Native foreground service with persistent "Trip in progress" notification
- Background GPS continues while driver uses Google Maps for navigation
- Native push notifications via FCM/APNs
- Requires App Store / Play Store deployment
- Web UI still deploys instantly via Vercel — only native plugin changes need store updates
