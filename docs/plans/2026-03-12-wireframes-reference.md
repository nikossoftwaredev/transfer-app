# TransferGR Wireframe Reference

> Adapted from Uber/ride-hailing UI patterns for a **pre-booked luxury transfer** service.
> Use this document as the screen-by-screen blueprint when building each page.

---

## Key Differences from Uber

| Uber | TransferGR |
|------|-----------|
| On-demand hailing | Pre-scheduled transfers (min 2h ahead) |
| Dynamic surge pricing | Fixed pricing per vehicle class + night multiplier |
| Generic vehicle types | Luxury fleet: E-Class, S-Class, Vito, V-Class, Sprinter |
| Single driver-rider | Organization-based fleet management |
| In-app payments only | Cash + card, no wallet |
| Driver finds riders | Org dispatches driver to booking |

---

## 1. CLIENT (PASSENGER) SCREENS

### 1.1 Landing Page `/[locale]/`
**Already exists.** Public marketing page with hero, services, vehicle showcase, booking CTA.

### 1.2 Booking Flow `/[locale]/book/`
**Existing components:** `booking-flow.tsx`, `address-input.tsx`, `vehicle-selector.tsx`, `booking-details.tsx`, `booking-summary.tsx`, `finding-driver.tsx`

#### Step 1: Route Entry
```
+------------------------------------------+
|  [Back]              TransferGR    [Lang] |
|------------------------------------------|
|                                          |
|            [ Google Map ]                |
|         (pickup pin centered)            |
|                                          |
|------------------------------------------|
|  PICKUP                                  |
|  [icon] Athens Airport (ATH)        [x]  |
|                                          |
|  DESTINATION                             |
|  [icon] Where are you going?        [>]  |
|                                          |
|  + Add stop                              |
|------------------------------------------|
|  [Home icon] Home    [Work icon] Work    |
|  [Clock] Recent destinations...          |
+------------------------------------------+
```

**Behavior:**
- Tap pickup/destination -> opens `address-input.tsx` with Google Places autocomplete
- Map shows route polyline once both addresses set
- "Add stop" allows intermediate `stops` (stored as JSONB in Booking)
- Saved locations from `SavedLocation` table shown as shortcuts
- Auto-detect airport addresses -> flag for `airportFixedRate` pricing

#### Step 2: Schedule & Passengers
```
+------------------------------------------+
|  [Back]          Schedule Transfer        |
|------------------------------------------|
|                                          |
|  WHEN                                    |
|  [Calendar icon]  Thu, Mar 14            |
|  [Clock icon]     14:30                  |
|                                          |
|  PASSENGERS          LUGGAGE             |
|  [- 2 +]             [- 1 +]            |
|                                          |
|  SPECIAL INSTRUCTIONS                    |
|  [ Flight TK1234, arriving Gate B ]      |
|                                          |
|  [Continue]                              |
+------------------------------------------+
```

**Data mapping:**
- Date/time -> `Booking.scheduledAt`
- Passengers -> `Booking.passengerCount`
- Luggage -> `Booking.luggageCount`
- Instructions -> `Booking.specialInstructions`
- Must be at least 2h in the future (per `CancellationPolicy.freeWindowMinutes`)

#### Step 3: Vehicle Selection
```
+------------------------------------------+
|  [Back]         Choose Your Vehicle       |
|------------------------------------------|
|  Athens Airport -> Hotel Grande Bretagne  |
|  ~35 km  |  ~40 min                      |
|------------------------------------------|
|                                          |
|  [Photo: E-Class]                        |
|  Mercedes E-Class        3 pax           |
|  Business Class                          |
|  EUR 55 - 65                    [Select] |
|  ----------------------------------------|
|  [Photo: S-Class]                        |
|  Mercedes S-Class        3 pax    VIP    |
|  Premium Business                        |
|  EUR 85 - 100                   [Select] |
|  ----------------------------------------|
|  [Photo: Vito]                           |
|  Mercedes Vito           7 pax           |
|  Group Travel                            |
|  EUR 65 - 75                    [Select] |
|  ----------------------------------------|
|  [Photo: V-Class]                        |
|  Mercedes V-Class        6 pax  Premium  |
|  Group Travel                            |
|  EUR 75 - 90                    [Select] |
|  ----------------------------------------|
|  [Photo: Sprinter]                       |
|  Mercedes Sprinter       16 pax          |
|  Large Groups                            |
|  EUR 95 - 115                   [Select] |
|                                          |
+------------------------------------------+
```

**Data mapping:**
- Vehicle options from `VehicleClass` table (sorted by `sortOrder`)
- Tags shown as badges (from `VehicleClass.tags[]`)
- Fare range from `PricingRule`: min = `minimumFare`, max = calculated from `ratePerKm * estimatedDistanceKm`
- If airport detected -> show `airportFixedRate` instead
- Night bookings (22:00-06:00) -> multiply by `nightMultiplier`
- Extra stops -> add `extraStopFee` per stop
- Grey out vehicles where `passengerCount > capacity`

#### Step 4: Booking Summary & Confirmation
```
+------------------------------------------+
|  [Back]          Booking Summary          |
|------------------------------------------|
|                                          |
|  [Mini map with route]                   |
|                                          |
|  ROUTE                                   |
|  * Athens Airport (ATH)                  |
|  * Hotel Grande Bretagne, Syntagma       |
|                                          |
|  SCHEDULE                                |
|  Thu, Mar 14 at 14:30                    |
|  2 passengers, 1 luggage                 |
|                                          |
|  VEHICLE                                 |
|  Mercedes E-Class  |  Business Class     |
|                                          |
|  FARE ESTIMATE                           |
|  EUR 55 - 65                             |
|  Includes airport pickup fee             |
|                                          |
|  PAYMENT                                 |
|  [Cash]  [Card]                          |
|                                          |
|  CANCELLATION POLICY                     |
|  Free cancellation up to 2h before.      |
|  Late cancel: 50% fee. No-show: 100%.   |
|                                          |
|  [Confirm Booking]                       |
+------------------------------------------+
```

**Data mapping:**
- All fields map to `Booking` table columns
- Payment method -> `Booking.paymentMethod`
- Fare -> `Booking.estimatedFareMin` / `estimatedFareMax`
- Distance -> `Booking.estimatedDistanceKm`
- Cancellation terms from `CancellationPolicy` table

#### Step 5: Finding Driver / Confirmation
```
+------------------------------------------+
|                                          |
|            [Pulsing animation]           |
|                                          |
|       Finding your driver...             |
|                                          |
|  Your booking has been confirmed.        |
|  We'll assign a driver shortly.          |
|                                          |
|  Booking #TGR-2024-0042                  |
|                                          |
|  [Cancel Booking]                        |
|                                          |
+------------------------------------------+
```

Then transitions to:

```
+------------------------------------------+
|  [Back]         Driver Assigned           |
|------------------------------------------|
|                                          |
|  [Driver Photo]                          |
|  Dimitris K.         ★ 4.8              |
|  Mercedes E 220d  |  Black               |
|  AAA-1234                                |
|                                          |
|  [Call]    [Message]    [Share Trip]      |
|                                          |
|  Your driver will arrive at:             |
|  Athens Airport, Terminal A              |
|  Thu, Mar 14 at 14:30                    |
|                                          |
|  [View on Map]                           |
|  [Cancel Booking]                        |
+------------------------------------------+
```

**Data mapping:**
- Driver info from `Driver` + `User` (name, photo)
- Vehicle from `Driver.vehicleMake`, `vehicleModel`, `vehicleColor`, `licensePlate`
- Contact via `Booking.proxySessionId` (Twilio masked calling)
- Rating from average of `Rating.stars` for this driver

### 1.3 Live Trip Tracking (during ride)
```
+------------------------------------------+
|                                          |
|            [ Google Map ]                |
|     (real-time driver position from      |
|      DriverLocation table via WS)        |
|                                          |
|------------------------------------------|
|  EN ROUTE TO DESTINATION                 |
|  ETA: 35 min                             |
|  ----------------------------------------|
|  [Driver Photo]  Dimitris K.  ★ 4.8     |
|  Mercedes E 220d  |  AAA-1234            |
|                                          |
|  [Call]    [Share Trip]    [SOS]          |
+------------------------------------------+
```

**Data mapping:**
- Real-time location from `DriverLocation` via WebSocket (ws-server package)
- Trip status from `Trip.startedAt`, tracking `Trip` record
- Waiting time tracked via `Trip.waitingStartedAt/EndedAt/waitingMinutes`

### 1.4 Trip Complete & Rating
```
+------------------------------------------+
|                                          |
|  Trip Complete!                          |
|                                          |
|  [Route map thumbnail]                   |
|                                          |
|  Athens Airport -> Hotel Grande Bretagne |
|  35 km  |  42 min                        |
|                                          |
|  FARE: EUR 55.00                         |
|  ----------------------------------------|
|  Base fare:          EUR 35.00           |
|  Distance (35 km):   EUR 42.00          |
|  Airport pickup:     EUR 55.00 (fixed)  |
|  Waiting (3 min):    FREE               |
|  ----------------------------------------|
|  Payment: Cash                           |
|                                          |
|  HOW WAS YOUR RIDE?                      |
|  [★] [★] [★] [★] [★]                   |
|                                          |
|  [ Optional comment... ]                 |
|                                          |
|  [Submit Rating]                         |
+------------------------------------------+
```

**Data mapping:**
- Fare from `Booking.actualFare`, `actualDistanceKm`
- Waiting charge from `Booking.waitingChargeAmount`
- Free waiting from `PricingRule.freeWaitingMinutes`
- Rating -> creates `Rating` record (stars, comment, bookingId, clientId, driverId)

### 1.5 Account & History `/[locale]/account/`
```
+------------------------------------------+
|  [Back]           My Account             |
|------------------------------------------|
|  [Avatar]  Nikos P.                      |
|  nikos@email.com  |  +30 690 xxx xxxx   |
|  ----------------------------------------|
|                                          |
|  UPCOMING TRANSFERS                      |
|  [Card] Mar 14, 14:30                   |
|         Airport -> Hotel  |  E-Class     |
|         EUR 55  |  Confirmed     [>]     |
|                                          |
|  PAST TRANSFERS                          |
|  [Card] Mar 10, 09:00                   |
|         Hotel -> Airport  |  Vito        |
|         EUR 65  |  Completed  ★★★★★ [>] |
|                                          |
|  [Card] Feb 28, 18:30                   |
|         Port -> Hotel  |  S-Class        |
|         EUR 85  |  Completed  ★★★★  [>] |
|                                          |
+------------------------------------------+
```

### 1.6 Saved Locations `/[locale]/account/locations/`
```
+------------------------------------------+
|  [Back]        Saved Locations           |
|------------------------------------------|
|  [+ Add Location]                        |
|                                          |
|  [Home icon]  Home                       |
|  Kifisias 42, Marousi            [Edit]  |
|                                          |
|  [Work icon]  Office                     |
|  Syntagma Square 1, Athens       [Edit]  |
|                                          |
|  [Star icon]  Beach House                |
|  Coastal Rd 15, Vouliagmeni     [Edit]  |
+------------------------------------------+
```

**Data mapping:** `SavedLocation` table (label, address, lat, lng)

---

## 2. DRIVER SCREENS

### 2.1 Driver Dashboard `/[locale]/driver/`
```
+------------------------------------------+
|  [Menu]        Driver Portal      [Bell] |
|------------------------------------------|
|                                          |
|  Welcome, Dimitris                       |
|                                          |
|  [=== ONLINE / OFFLINE toggle ===]       |
|                                          |
|  TODAY'S SUMMARY                         |
|  Trips: 4  |  Earnings: EUR 220         |
|  Rating: ★ 4.8  |  Hours: 6h            |
|                                          |
|  UPCOMING TRANSFERS                      |
|  ----------------------------------------|
|  [Card] 14:30 - Airport Pickup           |
|  Athens Airport -> Hotel Grande Bretagne |
|  E-Class  |  2 pax  |  EUR 55           |
|  Client: Nikos P.                        |
|  [Accept]  [Decline]           [Details] |
|  ----------------------------------------|
|  [Card] 17:00 - City Transfer            |
|  Syntagma -> Piraeus Port                |
|  E-Class  |  1 pax  |  EUR 35           |
|  Client: Maria S.                        |
|  [Accept]  [Decline]           [Details] |
|                                          |
+------------------------------------------+
```

**Data mapping:**
- Online toggle -> `Driver.isOnline` / `Driver.availability`
- Upcoming from `Booking` where `driverId` = current, `status` = pending/confirmed
- Earnings aggregated from `Booking.actualFare` for today
- Rating from `Rating` average

### 2.2 Active Trip View (Driver)
```
+------------------------------------------+
|  [Back]         Active Transfer          |
|------------------------------------------|
|                                          |
|  [ Google Maps Navigation ]              |
|  Turn-by-turn to pickup/dropoff         |
|                                          |
|------------------------------------------|
|  STATUS: EN ROUTE TO PICKUP              |
|  ETA: 12 min                             |
|                                          |
|  CLIENT                                  |
|  Nikos P.  |  +30 6xx (masked)           |
|  [Call]  [Message]                        |
|                                          |
|  PICKUP                                  |
|  Athens Airport, Terminal A              |
|  Flight: TK1234, Gate B                 |
|                                          |
|  DESTINATION                             |
|  Hotel Grande Bretagne                   |
|                                          |
|  ----------------------------------------|
|  [I've Arrived]  (then [Start Trip])     |
|  [Start Waiting Timer]                   |
|  [End Trip] (slide to confirm)           |
+------------------------------------------+
```

**Data mapping:**
- GPS broadcast: driver sends `DriverLocation` via WebSocket every 5s
- Trip lifecycle: Arrived -> `Trip.startedAt`, Waiting -> `Trip.waitingStartedAt/EndedAt`
- Contact via `Booking.proxySessionId` (masked)
- Special instructions from `Booking.specialInstructions`

### 2.3 Driver Trips `/[locale]/driver/trips/`
```
+------------------------------------------+
|  [Back]          My Trips                |
|------------------------------------------|
|  [This Week v]                           |
|                                          |
|  TODAY - Thu, Mar 14                     |
|  [Card] 14:30  Airport -> Hotel          |
|         EUR 55  |  ★★★★★  |  35 km      |
|  [Card] 10:00  Hotel -> Museum           |
|         EUR 25  |  ★★★★   |  8 km       |
|                                          |
|  YESTERDAY - Wed, Mar 13                 |
|  [Card] 22:00  Restaurant -> Hotel       |
|         EUR 40 (night)  |  ★★★★★        |
|  [Card] 18:00  Port -> Hotel             |
|         EUR 65  |  ★★★★★  |  42 km      |
|                                          |
|  WEEKLY TOTAL                            |
|  12 trips  |  EUR 680  |  ★ 4.8 avg     |
+------------------------------------------+
```

### 2.4 Driver Profile `/[locale]/driver/profile/`
```
+------------------------------------------+
|  [Back]         My Profile               |
|------------------------------------------|
|  [Photo upload area]                     |
|                                          |
|  NAME: Dimitris Kalogeropoulos           |
|  PHONE: +30 691 111 1111                 |
|  LICENSE: AB-123456                      |
|                                          |
|  VEHICLE                                 |
|  Class: Mercedes E-Class                 |
|  Make: Mercedes-Benz                     |
|  Model: E 220d                           |
|  Year: 2023                              |
|  Color: Black                            |
|  Plate: AAA-1234                         |
|                                          |
|  STATS                                   |
|  Total trips: 342                        |
|  Rating: ★ 4.8 (289 reviews)            |
|  Member since: Jan 2024                  |
|                                          |
|  [Save Changes]                          |
+------------------------------------------+
```

**Data mapping:** `Driver` + `User` tables, `VehicleClass` for class name

---

## 3. ORGANIZATION (FLEET MANAGER) SCREENS

### 3.1 Org Dashboard `/[locale]/org/`
```
+------------------------------------------+
| [Sidebar]    Demo Transfers Dashboard    |
|------------------------------------------|
|  TODAY'S OVERVIEW                        |
|  [Card] Active Bookings: 8              |
|  [Card] Available Drivers: 5/12         |
|  [Card] Revenue Today: EUR 1,240        |
|  [Card] Avg Rating: ★ 4.7              |
|                                          |
|  UPCOMING TRANSFERS (next 4h)            |
|  [Table]                                 |
|  Time  | Client | Route     | Driver     |
|  14:30 | Nikos  | ATH->City | Dimitris   |
|  15:00 | Maria  | City->PIR | Unassigned |
|  16:30 | John   | ATH->Glf  | Yannis     |
|                                          |
|  [Live Map Preview]                      |
|  (shows driver positions)                |
+------------------------------------------+
```

### 3.2 Bookings Management `/[locale]/org/bookings/`
```
+------------------------------------------+
| [Sidebar]        Bookings                |
|------------------------------------------|
|  [Active] [Upcoming] [Past] [Cancelled]  |
|  [Search...] [Filter by vehicle class v] |
|                                          |
|  [Table with columns:]                   |
|  ID | Date/Time | Client | Route |       |
|  Vehicle | Driver | Status | Fare |      |
|  Actions                                 |
|                                          |
|  Each row expandable to show:            |
|  - Full addresses + map                  |
|  - Passenger count, luggage, notes       |
|  - Fare breakdown                        |
|  - [Assign Driver] [Cancel] [Edit]       |
+------------------------------------------+
```

**Key action:** Assign driver = set `Booking.driverId` + `Booking.vehicleId`, send push notification

### 3.3 Drivers Management `/[locale]/org/drivers/`
```
+------------------------------------------+
| [Sidebar]         Drivers                |
|------------------------------------------|
|  [+ Invite Driver]                       |
|  [Online] [All] [Pending Invites]        |
|                                          |
|  [Card Grid or Table:]                   |
|  [Photo] Dimitris K.         ONLINE      |
|  E-Class | AAA-1234 | ★ 4.8             |
|  Today: 4 trips, EUR 220                 |
|  [View] [Assign] [Deactivate]            |
|                                          |
|  [Photo] Yannis M.          OFFLINE      |
|  V-Class | BBB-5678 | ★ 4.6             |
|  Last active: 2h ago                     |
|  [View] [Assign] [Deactivate]            |
|                                          |
|  [Photo] Pending: +30 692...  INVITED    |
|  Sent Mar 12  |  [Resend] [Revoke]       |
+------------------------------------------+
```

**Data mapping:**
- Drivers from `Driver` + `User` (where `orgId` = current org)
- Invite flow: create `User` with role=driver + `Driver` with `inviteStatus=pending`
- Online status from `Driver.isOnline` / `Driver.availability`

### 3.4 Fleet Management `/[locale]/org/fleet/`
```
+------------------------------------------+
| [Sidebar]          Fleet                 |
|------------------------------------------|
|  [+ Add Vehicle]                         |
|  [Filter by class v]                     |
|                                          |
|  [Card Grid:]                            |
|  [Vehicle Photo]                         |
|  Mercedes E 220d  |  2023                |
|  Plate: AAA-1234  |  Available           |
|  Class: E-Class                          |
|  Assigned: Dimitris K.                   |
|  [Edit] [Deactivate]                     |
|                                          |
|  [Vehicle Photo]                         |
|  Mercedes V 250d  |  2024                |
|  Plate: CCC-9012  |  In Service          |
|  Class: V-Class                          |
|  Assigned: None                          |
|  [Edit] [Assign Driver]                  |
+------------------------------------------+
```

**Data mapping:** `Vehicle` table (plateNumber, year, photoUrl, status) + `VehicleClass` + assigned `Driver`

### 3.5 Live Map `/[locale]/org/live-map/`
```
+------------------------------------------+
| [Sidebar]        Live Map                |
|------------------------------------------|
|                                          |
|  [ Full-screen Google Map ]              |
|                                          |
|  Driver markers (color-coded):           |
|  - Green = online/available              |
|  - Blue = on active trip                 |
|  - Grey = offline                        |
|                                          |
|  Click marker -> popup:                  |
|  [Photo] Dimitris K. | E-Class          |
|  Status: En route to pickup              |
|  Booking #TGR-0042                       |
|  [View Booking] [Call Driver]            |
|                                          |
|  Active trip routes shown as polylines   |
|                                          |
|  [Legend] [Filter by status]             |
+------------------------------------------+
```

**Data mapping:** Real-time `DriverLocation` via WebSocket, `Driver.availability`, active `Booking`/`Trip` data

### 3.6 Pricing `/[locale]/org/pricing/`
```
+------------------------------------------+
| [Sidebar]        Pricing Rules           |
|------------------------------------------|
|  Pricing per vehicle class for your org  |
|                                          |
|  [Tabs: E-Class | S-Class | Vito | ...] |
|                                          |
|  MERCEDES E-CLASS                        |
|  Minimum fare:       [EUR 35    ]        |
|  Rate per km:        [EUR 1.20  ]        |
|  Night multiplier:   [1.5x      ]        |
|  Airport fixed rate: [EUR 55    ]        |
|  Free waiting (min): [5         ]        |
|  Waiting rate/min:   [EUR 0.30  ]        |
|  Extra stop fee:     [EUR 5.00  ]        |
|                                          |
|  [Save Changes]                          |
+------------------------------------------+
```

**Data mapping:** `PricingRule` table (one per orgId + vehicleClassId combo, unique index)

### 3.7 Reports `/[locale]/org/reports/`
```
+------------------------------------------+
| [Sidebar]         Reports                |
|------------------------------------------|
|  [This Week v]  [Export CSV]             |
|                                          |
|  REVENUE                                 |
|  [Bar chart: daily revenue]              |
|  Total: EUR 8,450                        |
|  Commission (15%): EUR 1,268             |
|  Net: EUR 7,182                          |
|                                          |
|  TRIPS                                   |
|  [Line chart: trips per day]             |
|  Total: 64 trips                         |
|  Avg fare: EUR 132                       |
|  Cancellation rate: 4.7%                 |
|                                          |
|  TOP DRIVERS                             |
|  1. Dimitris K. | 18 trips | EUR 2,100  |
|  2. Yannis M.   | 14 trips | EUR 1,850  |
|                                          |
|  TOP ROUTES                              |
|  1. Airport <-> City Center (42%)        |
|  2. Port <-> Hotels (28%)                |
+------------------------------------------+
```

---

## 4. SUPER ADMIN SCREENS

### 4.1 Admin Dashboard `/[locale]/admin/`
```
+------------------------------------------+
| [Sidebar]    Platform Dashboard          |
|------------------------------------------|
|  PLATFORM OVERVIEW                       |
|  [Card] Organizations: 12 (3 pending)   |
|  [Card] Total Drivers: 85               |
|  [Card] Bookings Today: 47              |
|  [Card] Revenue Today: EUR 6,200        |
|                                          |
|  [Revenue chart: last 30 days]           |
|                                          |
|  RECENT ACTIVITY                         |
|  - New org "Athens VIP" registered       |
|  - Driver complaint #234 opened          |
|  - Booking #TGR-0098 cancelled (no-show)|
+------------------------------------------+
```

### 4.2 Organizations `/[locale]/admin/organizations/`
```
+------------------------------------------+
| [Sidebar]      Organizations             |
|------------------------------------------|
|  [+ Add Org]  [Pending (3)] [All]        |
|                                          |
|  [Table:]                                |
|  Name | Slug | Status | Drivers |        |
|  Commission | Revenue | Actions          |
|                                          |
|  Demo Transfers | verified | 12 drivers  |
|  15% | EUR 45,000 | [View] [Suspend]     |
|                                          |
|  Athens VIP | pending | 0 drivers        |
|  15% | -- | [Approve] [Reject]           |
+------------------------------------------+
```

**Detail view** `/[locale]/admin/organizations/[id]/`:
- Full org info, driver list, booking history, revenue breakdown
- Edit commission rate (`Organization.commissionRate`)
- Change status: pending -> verified / suspended

### 4.3 Vehicle Classes `/[locale]/admin/vehicle-classes/`
```
+------------------------------------------+
| [Sidebar]     Vehicle Classes            |
|------------------------------------------|
|  [+ Add Class]                           |
|                                          |
|  [Sortable card list:]                   |
|  [Drag] [Photo] Mercedes E-Class        |
|  Tags: Business Class                    |
|  Capacity: 3 | Active: Yes              |
|  [Edit] [Deactivate]                     |
|                                          |
|  [Drag] [Photo] Mercedes S-Class        |
|  Tags: Business, VIP, Premium            |
|  Capacity: 3 | Active: Yes              |
|  [Edit] [Deactivate]                     |
+------------------------------------------+
```

**Data mapping:** `VehicleClass` (name, tags[], capacity, description, imageUrl, sortOrder, active)

### 4.4 Admin Live Map `/[locale]/admin/live-map/`
Same as org live map but shows ALL drivers across ALL organizations, color-coded by org.

### 4.5 Commission `/[locale]/admin/commission/`
```
+------------------------------------------+
| [Sidebar]       Commission               |
|------------------------------------------|
|  [This Month v]                          |
|                                          |
|  TOTAL COLLECTED: EUR 4,200              |
|  PENDING SETTLEMENT: EUR 1,100           |
|                                          |
|  [Table per org:]                        |
|  Org | Bookings | Revenue | Commission | |
|  Rate | Status                            |
|                                          |
|  Demo Transfers | 64 | EUR 8,450 |      |
|  EUR 1,268 | 15% | Settled               |
|                                          |
|  Athens VIP | 23 | EUR 4,100 |           |
|  EUR 615 | 15% | Pending [Settle]        |
+------------------------------------------+
```

### 4.6 Cancellation Policy `/[locale]/admin/cancellation-policy/`
```
+------------------------------------------+
| [Sidebar]    Cancellation Policy         |
|------------------------------------------|
|  PLATFORM-WIDE POLICY                    |
|                                          |
|  Free cancellation window:  [120] min    |
|  Late cancellation fee:     [50] %       |
|  No-show fee:               [100] %      |
|                                          |
|  [Save Changes]                          |
+------------------------------------------+
```

**Data mapping:** Single `CancellationPolicy` record

### 4.7 Audit Log `/[locale]/admin/audit/`
```
+------------------------------------------+
| [Sidebar]        Audit Log               |
|------------------------------------------|
|  [Search...] [Filter: entity v] [Date]   |
|                                          |
|  [Table:]                                |
|  Time | User | Action | Entity | ID |    |
|  Details                                 |
|                                          |
|  14:32 | Admin | approved | Org |        |
|  org-athens | {status: verified}          |
|                                          |
|  14:28 | Dimitris | updated | Driver |   |
|  drv-demo1 | {availability: online}       |
+------------------------------------------+
```

**Data mapping:** `AuditLog` (userId, action, entity, entityId, metadata JSONB)

---

## 5. AUTHENTICATION SCREENS

### 5.1 Client Login (Google OAuth)
```
+------------------------------------------+
|                                          |
|  [TransferGR Logo]                       |
|                                          |
|  Book your premium transfer              |
|                                          |
|  [G] Continue with Google                |
|                                          |
|  By continuing, you agree to our         |
|  Terms of Service & Privacy Policy       |
+------------------------------------------+
```

### 5.2 Driver Login (Phone + PIN)
```
+------------------------------------------+
|                                          |
|  [TransferGR Logo]                       |
|                                          |
|  Driver Login                            |
|                                          |
|  PHONE NUMBER                            |
|  [+30] [691 111 1111]                    |
|                                          |
|  PIN                                     |
|  [* * * *]                               |
|                                          |
|  [Sign In]                               |
|                                          |
|  Forgot PIN? Contact your fleet manager  |
+------------------------------------------+
```

**Data mapping:** `User.phone` + `User.pinHash` (bcrypt)

---

## 6. NOTIFICATION PATTERNS

| Event | Recipient | Channel | Content |
|-------|-----------|---------|---------|
| Booking confirmed | Client | Push + SMS | "Transfer confirmed for {date}. Booking #{id}" |
| Driver assigned | Client | Push | "Driver {name} assigned. {vehicle} {plate}" |
| Driver en route | Client | Push | "Your driver is on the way. ETA: {min} min" |
| Driver arrived | Client | Push + SMS | "Your driver has arrived at {pickup}" |
| Trip completed | Client | Push | "Trip complete. Fare: EUR {amount}" |
| New booking | Driver | Push + Sound | "New transfer: {pickup} -> {dropoff}, {time}" |
| Booking cancelled | Driver | Push | "Booking #{id} was cancelled" |
| Booking assigned | Org | Push | "Booking #{id} assigned to {driver}" |
| Late cancellation | Org | Push | "Late cancel: #{id}, fee: EUR {amount}" |

**Data mapping:** `DeviceToken` (userId, token, platform) for push targeting

---

## 7. KEY USER FLOWS (Sequence)

### Client Booking Flow
```
Landing -> [Book Now] -> Enter Pickup -> Enter Destination ->
Schedule Date/Time -> Set Passengers/Luggage ->
Select Vehicle Class -> Review Summary -> Confirm ->
[Finding Driver...] -> Driver Assigned -> [Wait] ->
Driver Arrives -> Trip In Progress (live tracking) ->
Trip Complete -> Rate Driver -> Done
```

### Driver Shift Flow
```
Login (phone+PIN) -> Dashboard -> Go Online ->
View Upcoming Bookings -> Accept/Decline ->
Navigate to Pickup -> Arrive -> Start Waiting Timer ->
Passenger Boards -> Start Trip -> Navigate to Destination ->
Arrive -> End Trip -> Rate Passenger -> Next Booking
```

### Org Dispatch Flow
```
Login -> Dashboard -> View Incoming Bookings ->
Assign Driver to Booking -> Monitor on Live Map ->
Track Trip Progress -> View Completion ->
Check Daily Revenue -> Generate Reports
```

### Admin Management Flow
```
Login -> Dashboard -> Review Pending Orgs ->
Approve/Reject -> Configure Vehicle Classes ->
Set Cancellation Policy -> Monitor Live Map ->
Review Commission -> Settle Payouts -> Check Audit Log
```
