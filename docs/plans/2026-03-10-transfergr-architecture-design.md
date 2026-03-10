# TransferGR Architecture Design

**Date:** 2026-03-10
**Status:** Approved
**Scope:** Architecture, scale, hosting, and technical approach for Phase 1

---

## Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| WS server language | Node.js/TypeScript | Same language as web app, shared types, no Python dependency |
| Monorepo tooling | Plain pnpm workspaces | 2-3 packages, Turborepo overkill for now |
| Launch scale | Small (1-5 orgs, 10-30 vehicles) | Architect for ~100 concurrent GPS streams max |
| Hosting | Vercel (web) + Hetzner VPS (WS + Redis) | Best DX for Next.js + cheap persistent WS hosting |
| Database | Supabase Postgres, no PostGIS | Plain lat/lng + app-level Haversine. PostGIS unnecessary at this scale |
| Real-time strategy | WebSocket for GPS, SSE for notifications | Clean separation; SSE works on Vercel, WS needs persistent server |
| Driver auth | NextAuth credentials provider (phone + PIN) | One auth system, two login flows |
| Driver app | Capacitor wrapper around Next.js routes | PWA cannot do background GPS — Capacitor gives native foreground service |

---

## 1. Monorepo Structure

```
transfer-app/
├── pnpm-workspace.yaml
├── packages/
│   ├── web/                  # Next.js 16 app (current codebase moved here)
│   │   ├── app/[locale]/
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── admin/                # Operator + Super Admin panels
│   │   │   ├── dashboard/            # Org Admin + Booker portal
│   │   │   └── driver/               # Driver UI routes (served via Capacitor)
│   │   ├── components/
│   │   ├── lib/
│   │   └── package.json
│   │
│   ├── ws-server/            # Standalone Node.js WebSocket service
│   │   ├── src/
│   │   │   ├── index.ts              # Socket.IO server entry
│   │   │   ├── redis.ts              # Redis pub/sub client
│   │   │   ├── handlers/
│   │   │   │   └── gps.ts            # GPS message handling
│   │   │   └── auth.ts               # JWT verification (shared secret with web)
│   │   └── package.json
│   │
│   └── shared/               # Shared TypeScript types & utilities
│       ├── src/
│       │   ├── types/                # Booking, Trip, Driver, Org interfaces
│       │   ├── constants.ts          # Shared enums, status codes
│       │   └── validation.ts         # Shared Zod schemas
│       └── package.json
```

**Key decisions:**
- Current codebase moves into `packages/web/`
- Driver PWA lives inside Next.js as a route group (`/driver/`) — not a separate package
- `shared` package referenced via `"@transfergr/shared": "workspace:*"`
- Prisma stays in `packages/web/` — only Next.js API routes access the DB
- WS server communicates via Redis only — no direct DB access

---

## 2. Real-Time GPS Pipeline

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

### Persistence
- Write to Postgres every 30 seconds (not every 4s — reduces DB writes by 7x)
- Store as plain `lat DOUBLE PRECISION, lng DOUBLE PRECISION, timestamp TIMESTAMPTZ`
- Trip history reconstructed from 30s-interval points

### Bandwidth
- JSON payloads: `{ driverId, lat, lng, accuracy, speed, bearing, timestamp }` (~120 bytes)
- 30 drivers × 15 updates/min = ~54KB/min total. Negligible.

---

## 3. Google Maps Live Vehicle Tracking

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

### Three map views
- **Driver**: Static map with pickup/dropoff + route preview. "Navigate" deep-links to Google Maps/Waze
- **Operator dashboard**: Live map of all active fleet drivers. Click for trip details
- **Super Admin**: All drivers across all orgs with clustering

### Passenger tracking link
- Shareable URL: `/track/{tripId}` — no auth required
- Single driver marker on map with ETA
- SSE subscription to one driver's location
- Link expires when trip completes

---

## 4. Pricing & Distance Calculation

### Two-phase pricing

**Phase 1 — Pre-trip estimate (booking created):**
- Call Google Routes API (not legacy Directions API — deprecated March 2025) with pickup → dropoff
- Get `distanceMeters` and `duration`
- Apply org's pricing rules, show fare estimate to booker
- Cache route polyline for booking confirmation display

**Phase 2 — Post-trip actual (driver completes trip):**
- Collect GPS trace from 30s-interval stored points
- Call Google Roads API `snapToRoads` with `interpolate=true` (snaps to road network, fills gaps)
- Sum Haversine distances between consecutive snapped points = actual distance
- Apply pricing rules to actual distance
- Show estimate vs actual to operator

### Pricing formula (configurable per org)
```
fare = baseFare
     + (distance_km × ratePerKm)
     + (duration_min × ratePerMin)
     + vehicleSurcharge      // minibus > sedan
     + nightSurcharge         // if trip between 00:00-06:00
     + airportFixedRate       // override for airport pickup/dropoff
```

### API cost at small-start scale
- Routes API: ~$5/1000 requests
- Roads API: ~$10/1000 requests
- 10-30 trips/day = ~€5-10/month

---

## 5. Driver App (Capacitor)

### Architecture
Next.js route group `/driver/` rendered inside a Capacitor shell.

### Web layer (stays in Next.js)
- All UI: login, trip list, trip details, payment confirmation
- Socket.IO client for GPS sending and receiving assignments
- Service worker for caching trip details offline

### Native layer (Capacitor plugins)
- `@capacitor/geolocation` — native GPS with background support
- `@capacitor-community/background-geolocation` — foreground service with persistent notification
- `@capacitor/local-notifications` — new trip assignment alerts
- `@capacitor/preferences` — offline GPS queue storage
- Deep links to Google Maps / Waze for navigation

### Driver flow
1. Login with phone + PIN (NextAuth credentials provider)
2. See assigned trips sorted chronologically
3. Accept or reject new trip (SSE notification triggers alert)
4. Tap "Start Trip" → foreground service starts → GPS broadcasting begins
5. Tap "Navigate" → opens Google Maps/Waze with destination
6. GPS continues broadcasting while driver uses external navigation
7. Tap "Complete Trip" → stops GPS → payment confirmation screen
8. Select payment method (cash / POS) → trip closed

### Offline resilience
- Trip details cached in Capacitor Preferences on assignment
- GPS points queued locally if Socket.IO disconnects
- On reconnect: flush queue with timestamps, server processes in order
- Driver always sees current trip details without connection

### Deployment
- Android: Play Store (or direct APK for testing)
- iOS: TestFlight → App Store
- Web UI updates deploy instantly via Vercel (Capacitor loads remote URL)
- Only native plugin changes require app store updates

---

## 6. Auth & Data Model

### Authentication
- Google OAuth for org admins and bookers (existing NextAuth setup)
- Credentials provider for drivers (phone + PIN)
- JWT strategy for both — single session model
- Role stored in JWT: `superadmin | orgadmin | booker | driver`
- Middleware checks role per route group (`/admin/*`, `/dashboard/*`, `/driver/*`)

### Database schema (Prisma)

```prisma
model Organization {
  id            String   @id @default(cuid())
  name          String
  contactEmail  String
  status        String   @default("active")  // active, suspended
  pricingTier   String   @default("standard")
  users         User[]
  bookings      Booking[]
  vehicles      Vehicle[]
  pricingRules  PricingRule[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model User {
  id            String   @id @default(cuid())
  orgId         String?
  org           Organization? @relation(fields: [orgId], references: [id])
  role          String   // superadmin, orgadmin, booker, driver
  name          String
  phone         String?  @unique
  email         String?  @unique
  pinHash       String?  // for driver auth
  image         String?
  emailVerified DateTime?
  driver        Driver?
  bookings      Booking[] @relation("BookerBookings")
  auditLogs     AuditLog[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Vehicle {
  id           String   @id @default(cuid())
  orgId        String?
  org          Organization? @relation(fields: [orgId], references: [id])
  plateNumber  String   @unique
  type         String   // sedan, minivan, minibus
  capacity     Int
  status       String   @default("available") // available, on_trip, maintenance
  driver       Driver?
  bookings     Booking[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Driver {
  id           String   @id @default(cuid())
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id])
  vehicleId    String?  @unique
  vehicle      Vehicle? @relation(fields: [vehicleId], references: [id])
  licenseNo    String
  availability String   @default("offline") // online, offline, on_trip
  bookings     Booking[]
  locations    DriverLocation[]
  trips        Trip[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Booking {
  id                     String   @id @default(cuid())
  orgId                  String
  org                    Organization @relation(fields: [orgId], references: [id])
  bookerId               String
  booker                 User     @relation("BookerBookings", fields: [bookerId], references: [id])
  driverId               String?
  driver                 Driver?  @relation(fields: [driverId], references: [id])
  vehicleId              String?
  vehicle                Vehicle? @relation(fields: [vehicleId], references: [id])
  pickupAddress          String
  pickupLat              Float
  pickupLng              Float
  dropoffAddress         String
  dropoffLat             Float
  dropoffLng             Float
  scheduledAt            DateTime
  passengerCount         Int      @default(1)
  vehicleTypePreference  String?
  specialInstructions    String?
  status                 String   @default("pending") // pending, confirmed, driver_assigned, in_progress, completed, cancelled
  estimatedDistanceKm    Float?
  estimatedFare          Float?
  actualDistanceKm       Float?
  actualFare             Float?
  paymentMethod          String?  // cash, pos
  trip                   Trip?
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
}

model Trip {
  id               String    @id @default(cuid())
  bookingId        String    @unique
  booking          Booking   @relation(fields: [bookingId], references: [id])
  driverId         String
  driver           Driver    @relation(fields: [driverId], references: [id])
  startedAt        DateTime  @default(now())
  endedAt          DateTime?
  paymentConfirmed Boolean   @default(false)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
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
  id               String   @id @default(cuid())
  orgId            String?
  org              Organization? @relation(fields: [orgId], references: [id])
  vehicleType      String   // sedan, minivan, minibus
  baseFare         Float
  ratePerKm        Float
  ratePerMin       Float
  nightMultiplier  Float    @default(1.0)
  airportFixedRate Float?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([orgId, vehicleType])
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
`pending → confirmed → driver_assigned → in_progress → completed | cancelled`

---

## 7. Notifications

### SSE (in-app real-time for dashboards)
- New booking received → operator dashboard
- Driver assigned → org booker dashboard
- Trip status changes → all relevant dashboards
- Driver goes offline → operator dashboard alert

### SMS via Twilio (transactional)

| Event | Recipient | Content |
|-------|-----------|---------|
| Booking confirmed | Booker | "Booking #123 confirmed for Mar 15 at 09:00" |
| Driver assigned | Booker + Passenger | "Driver Nikos (Toyota, ABC-1234) assigned. ETA 10min" |
| Driver en route | Passenger | "Your driver is on the way. Track: transfergr.com/track/{tripId}" |
| Trip completed | Booker | "Trip #123 completed. Distance: 12.4km. Fare: €18.50" |

### Implementation
- `lib/notifications/sms.ts` — thin wrapper around Twilio SDK
- `lib/notifications/sse.ts` — SSE emitter reading from Redis pub/sub
- Triggered from server actions after state changes
- SMS sent async (fire-and-forget with error logging)

### Not in Phase 1
- Email notifications (Phase 2)
- Native push notifications (Phase 2, comes with Capacitor)

---

## 8. Hosting & Infrastructure

| Component | Host | Cost |
|-----------|------|------|
| Next.js web app | Vercel (free tier → Pro if needed) | €0-20/mo |
| WS server + Redis | Hetzner CX22 (2 vCPU / 4GB) | ~€4/mo |
| Database | Supabase Postgres (free tier) | €0 |
| SMS | Twilio (pay-per-message) | ~€5-15/mo |
| Google Maps APIs | Routes + Roads + Maps JS | ~€10-20/mo |
| **Total** | | **~€20-60/mo** |

### Hetzner VPS setup
- Docker Compose: Socket.IO server + Redis containers
- Nginx reverse proxy with SSL (Let's Encrypt)
- GitHub Actions deploys on push to `main` (ssh + docker pull)

---

## 9. Critical Finding: PWA Background GPS Limitation

**PWAs cannot do continuous background geolocation.** The Browser Geolocation API stops when:
- The tab is backgrounded
- The screen is locked
- The user switches to another app (Google Maps for navigation)

This is a fundamental browser limitation on both Android and iOS. **No workaround exists for iOS.**

**Solution:** Wrap the driver UI in Capacitor, which provides:
- Native foreground service with persistent "Trip in progress" notification
- Background GPS continues while driver uses Google Maps for navigation
- Requires App Store / Play Store deployment
- Web UI still deploys instantly via Vercel — only native plugin changes need store updates

This is a spec-breaking change from the original "PWA-only" approach but is non-negotiable for reliable driver tracking.
