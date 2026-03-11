# TransferGR — Platform Overview

**Prepared for:** Χρήστος MT & Black Horse
**Prepared by:** Hexaigon
**Date:** March 2026
**Version:** 1.0

> **Note:** "TransferGR" is a working title. The final platform name, branding, and domain will be decided before launch.

---

## What Is TransferGR?

TransferGR is a transfer booking platform for Greece — like Uber, but for corporate and private transfers with verified, professional fleets.

Clients open the platform, choose a vehicle class (sedan, VIP, minivan), enter their route, and request a ride. The booking goes out to all available drivers that match the vehicle class. The first driver to accept gets the job — just like Uber. Payment happens at the end — cash or POS terminal. No online payments.

You — the platform owner — see everything: every organization, every trip, every euro. At the end of each month, you collect a commission on all completed trips.

Organizations must be verified by you before they can operate on the platform. Drivers get a dedicated mobile app with GPS tracking and turn-by-turn navigation.

---

## Who Uses the Platform

TransferGR serves four distinct user groups, each with their own interface:

| Role | Who They Are | What They See |
|------|-------------|---------------|
| **Master Admin** (You) | The platform owner | Everything — all organizations, all trips, all revenue, commission reports |
| **Organization Admin** | Verified transport company manager | Their own fleet, drivers, bookings, pricing, and revenue |
| **Driver** | Organization's employed drivers | Accept rides, navigation, GPS tracking, payment confirmation |
| **Client** | Anyone booking a transfer | Book rides, choose vehicle class, track driver, rate the experience |
| **Passenger** | The person being transferred | A live tracking link (no account needed) |

---

## 1. Master Admin Panel — Your Command Center

This is your view. You see everything across all organizations. Your primary role is platform oversight and commission collection.

### Live Operations Map

- Real-time map showing every active driver across all organizations, updated every 4 seconds
- Click any vehicle to see: driver name, organization, current trip, destination, ETA
- Vehicles cluster automatically when zoomed out — expand by zooming in
- Filter by organization, vehicle type, or driver status

### Dashboard & Analytics

| Metric | Detail |
|--------|--------|
| Trips today / this week / this month | With trend indicators (+12% vs last week) |
| Active drivers right now | Across all organizations |
| Total platform revenue | All completed trips, all organizations |
| Your commission earned | This month's commission across all orgs |
| Top organizations | Ranked by trip volume and revenue |
| Per-organization breakdown | Trips, revenue, and your commission per org |
| Cancellation rate | With breakdown by reason |

### Commission Management

- Set a commission percentage per organization (e.g., 15% for Org A, 12% for Org B)
- Set a platform-wide default commission rate for new organizations
- Monthly commission report: per org revenue, your cut, total owed
- View historical commission data by month
- Export commission reports for invoicing

### Vehicle Class Catalog

- Manage the platform-wide vehicle class catalog (classes, tags, capacity, example models)
- Pre-filled with standard classes (E Class, S Class, Vito, V Class, Sprinter)
- Add new classes or retire old ones — changes are available to all organizations
- Organizations choose which classes from the catalog they offer and set their own prices

### Organization Verification & Management

Organizations cannot operate on the platform until you verify them. The process:
1. Organization signs up and submits their business details
2. You meet with them (in person or video call) to verify legitimacy
3. You manually approve them in the admin panel — only then can they add vehicles and receive bookings
4. You can suspend or remove any organization at any time

Management:
- Set commission rate per organization
- View each organization's trip history, revenue, fleet size
- Monitor organization activity and growth

### Cancellation Policy

- You (master admin) set the platform-wide cancellation rules
- Configurable free cancellation window (e.g., free if cancelled 2+ hours before pickup)
- Cancellation fees after the window (e.g., 50% of estimated fare)
- Late cancellation or no-show rules

### Platform Oversight

- See all bookings across all organizations in one view
- Override or cancel any booking if needed (emergency only)
- Full audit log: who did what, when, to which record
- Filter by user, action type, date range
- Full traceability for disputes or compliance

---

## 2. Organization Portal — The Transport Company's View

Each transport organization gets a full management panel where they control their own business.

### Fleet Management

**Vehicle Classes (Pre-filled by Platform):**

The platform comes with a catalog of vehicle classes, maintained by the master admin. Organizations select which classes they offer and set prices per class.

| Class | Tags | Capacity | Examples |
|-------|------|----------|----------|
| Mercedes E Class | Business Class | 3 pax | BMW 5 Series, Cadillac XTS or similar |
| Mercedes S Class | Business Class, VIP, Premium | 3 pax | BMW 7, Audi A8, Cadillac Escalade or similar |
| Mercedes Vito | Family Friendly, Group Travel | 7 pax | Ford Custom, Chevrolet Suburban or similar |
| Mercedes V Class | Family Friendly, Group Travel, Premium | 6 pax | Cadillac Escalade or similar |
| Mercedes Sprinter | Group Travel, Large Groups | 16 pax | Ford Transit or similar |

The master admin can add, edit, or remove vehicle classes from the platform catalog at any time.

**Organization's Fleet:**
- Select which vehicle classes they operate from the platform catalog
- Register their actual vehicles: plate number, vehicle class, year, **vehicle photos** (visible to clients)
- Track vehicle status: available, on trip, in maintenance
- Assign vehicles to drivers

**Drivers:**
- Invite drivers by phone number — driver receives an SMS with a link to join the organization
- Driver accepts the invite, sets their PIN, and is added to the fleet
- Org admin can also create driver accounts directly (name, phone, PIN)
- Each driver belongs to one organization
- Assign or unassign vehicles to drivers
- See real-time availability: online, offline, on trip
- Reset PINs, suspend or remove drivers from the organization

### Pricing (Set by the Organization)

Organizations set their own prices **per vehicle class**. Each vehicle class has its own minimum fare and rate per km.

**Fare = Minimum Fare OR (Rate per km × Distance), whichever is higher**

Every trip has a guaranteed minimum fare for the chosen vehicle class. If the distance-based fare exceeds the minimum, the higher amount applies.

**Example pricing set by an organization:**

| Vehicle Class | Minimum Fare | Rate per km | Night (1.5x) |
|---------------|-------------|-------------|---------------|
| Mercedes E Class | €8.00 | €1.20/km | €1.80/km |
| Mercedes S Class | €15.00 | €2.00/km | €3.00/km |
| Mercedes Vito | €12.00 | €1.50/km | €2.25/km |
| Mercedes V Class | €18.00 | €2.20/km | €3.30/km |
| Mercedes Sprinter | €25.00 | €2.50/km | €3.75/km |

**Additional pricing rules:**

| Parameter | Example | Notes |
|-----------|---------|-------|
| Night surcharge | 1.5x | Multiplier applied between 00:00–06:00 |
| Airport fixed rate | Per class | Fixed price override for airport pickups/dropoffs |
| Free waiting time | 5 min | Driver waits at pickup for free |
| Waiting charge | €0.30/min | Charged after free waiting period expires |
| Extra stop fee | €3.00 | Per additional stop added to the route |

**Example trips (Mercedes E Class at the rates above):**
- 3 km trip → €1.20 × 3 = €3.60 → below minimum → fare is **€8.00**
- 12 km trip → €1.20 × 12 = €14.40 → above minimum → fare is **€14.40**
- 12 km night trip → €1.80 × 12 = €21.60 → fare is **€21.60**
- Airport pickup → fixed rate → e.g. **€35.00**
- 12 km trip + 8 min wait → €14.40 + (3 min × €0.30) = **€15.30**
- Trip with 2 extra stops → fare + (2 × €3.00) = **fare + €6.00**

When a client books a transfer, they choose a vehicle class and see the fare estimate before confirming.

### Bookings & Monitoring

- See all bookings taken by their drivers in real-time
- Drivers receive ride requests directly on their phone and accept them — first driver to accept wins
- Organization monitors all active trips on a live map
- View completed and cancelled trip history
- Revenue is attributed to the organization through their drivers

### Live Operations Map

- Real-time map showing their own drivers' positions
- Click any vehicle to see: driver name, current trip, destination, status
- Only their own fleet — they cannot see other organizations

### Revenue & Reports

- Total trips and revenue: today, this week, this month
- Per-driver performance: trips completed, hours on-trip
- Trip history with full details (route, distance, fare, payment method)
- Monthly revenue summary (before platform commission)

### Organization Users

The org admin can manage who in their company can handle bookings:
- Add or remove bookers (dispatchers, assistants, operations staff)
- Each user sees only their organization's data

---

## 3. Client Experience — Booking a Ride

The client experience works like Uber. No need to know which organization will serve them — they just book.

### How It Works

1. Client opens the platform and enters pickup address (autocomplete as they type)
2. Enters destination address — **can add multiple stops** (e.g., pickup → hotel → airport)
3. Sees the route on a map with estimated distance and **nearest driver ETA** ("Closest driver ~4 min away")
4. Chooses a vehicle class — sees each class with photo, capacity, and estimated fare
5. Selects number of passengers, luggage count, date/time
6. Adds special instructions (e.g., "Flight TK1234, arriving Terminal B")
7. Confirms booking

### What Happens Next

1. The booking is broadcast to **all available drivers** (from verified organizations) that have the chosen vehicle class
2. Drivers receive a **push notification** on their phone with the trip details and fare
3. **First driver to accept wins the job** — just like Uber. All other drivers lose access
4. Client is instantly notified: **driver photo, name, vehicle photo, plate number, and ETA**
5. **If no driver accepts within 5 minutes**, the booking times out — client is notified and can retry or adjust their request

### Communication with Driver

- Once a driver accepts, the client can **call or message the driver** directly through the app
- **Phone numbers are masked** — neither party sees the other's real number (Twilio proxy)
- Driver can also contact the client through the same masked channel
- All communication is tied to the trip and disabled after completion

### During the Trip

- Client sees a live map with the driver's real-time position
- ETA updates automatically as the driver moves
- Status updates: driver assigned → en route to pickup → **waiting at pickup** → passenger picked up → arriving at destination
- **Share trip** — client can share a live tracking link with anyone (family, colleague, hotel)

### Waiting Time

- When the driver arrives at the pickup location, a **waiting timer starts**
- Free waiting period (e.g., 5 minutes) — configurable by you (master admin)
- After the free period, **waiting charges apply** (e.g., €0.30/min) — added to the final fare
- Driver and client both see the waiting timer in real-time

### After the Trip

- Driver confirms payment method (cash or POS)
- Client receives a **trip receipt**: route map, distance, fare breakdown (base + distance + waiting), driver name, vehicle, payment method
- Client is asked to **rate the experience** (1-5 stars + optional comment)
- Rating is visible to the organization and to you (master admin)

### Client Account & Trip History

- Clients have a persistent account with **full trip history**
- Every past ride is saved: route on map, fare, receipt, driver, vehicle, rating given
- **Saved locations** — clients can save frequent addresses (home, office, airport) for quick booking
- Re-book a previous trip with one tap

### Cancellation

- Client can cancel within the platform's cancellation window (set by you) for free
- Late cancellations may incur a fee based on your cancellation policy

### Notifications

| Event | How They're Notified |
|-------|---------------------|
| Booking confirmed | Push notification + SMS |
| Driver accepted | Push notification with driver photo, vehicle, ETA |
| Driver en route | Push notification with live tracking link |
| Waiting timer started | Push notification ("Driver is waiting at pickup") |
| No driver accepted (timeout) | Push notification + SMS ("No driver available, try again") |
| Trip completed | Push notification with fare summary + rate prompt |

---

## 4. Driver Mobile App

Each organization's drivers get a dedicated mobile app that works on any Android or iOS phone. A full native app ensures reliable GPS tracking even in the background.

### What Drivers See

- **Login:** Phone number + PIN (received via invite from their organization, or set by the org admin)
- **Profile:** Driver uploads their photo (visible to clients before pickup)
- **Incoming rides:** Drivers receive push notifications for new ride requests matching their vehicle class — **tap to accept before other drivers do**
- **Trip List:** All accepted and upcoming trips in chronological order
- **Trip Detail:** Pickup/dropoff addresses on a map (including multiple stops), passenger count, special instructions
- **Contact Client:** Tap to call or message the client through masked number (no personal numbers revealed)
- **Navigation:** One tap opens Google Maps or Waze with the destination — turn-by-turn directions in their preferred app
- **Waiting Timer:** When arrived at pickup, timer shows free waiting period and when charges start
- **Trip Actions:** Accept → Start Trip → Arrived at Pickup → Passenger Picked Up → Complete Trip → Confirm Payment

### How GPS Tracking Works

- When a driver taps "Start Trip," their phone begins broadcasting GPS to the platform every 4 seconds
- GPS continues working even when the driver switches to Google Maps for navigation
- If the driver loses internet (tunnel, poor signal), GPS points are saved on the phone and sent when connection returns
- A persistent "Trip in progress" notification keeps tracking active

### Payment Confirmation

At trip end, the driver selects:
- **Cash received** — passenger paid in cash
- **POS completed** — passenger paid by card terminal

This confirmation is recorded and visible in the organization's dashboard and in your master admin panel.

---

## 5. Passenger Experience

Passengers don't need an account or app. When a driver is assigned and starts the trip, the passenger receives an SMS with a tracking link.

### What the Tracking Link Shows

- A live map with the driver's real-time position
- Driver's name and vehicle details (make, plate number)
- Estimated time of arrival, updating in real time
- Status: "Driver en route" → "Arriving" → "Trip completed"

The link expires automatically when the trip ends.

---

## 6. Ratings & Reviews

After every completed trip, the client is prompted to rate their experience.

### How It Works

- Client rates 1-5 stars + optional comment
- Rating is tied to the driver and the organization
- Organization admins see ratings for all their drivers
- Master admin sees ratings across all organizations

### What Ratings Show

| View | What They See |
|------|--------------|
| Client (before booking) | Organization's average rating and total trips completed |
| Organization Admin | Per-driver average rating, recent reviews, flagged low ratings |
| Master Admin | Platform-wide ratings, lowest-rated orgs/drivers, trends |

Low-rated organizations or drivers can be flagged or suspended by the master admin.

---

## 7. Live Tracking — Technical Reliability

### How It Works

1. Driver's phone sends GPS position every 4 seconds
2. Our server relays it instantly to your dashboard and any open tracking links
3. Positions are also saved to the database every 30 seconds for trip history
4. If a driver loses signal, positions queue on their phone and sync on reconnect

### Reliability Features

| Feature | Detail |
|---------|--------|
| Auto-reconnection | If the connection drops, it reconnects automatically with exponential backoff |
| Offline resilience | GPS points buffered on device, flushed on reconnect — no data loss |
| Accuracy filtering | GPS readings with accuracy worse than 50 meters are discarded |
| Background tracking | Works while driver uses Google Maps or any other app |

### Scale

The platform is architected to handle:
- **100+ concurrent GPS streams** at launch configuration
- Upgradeable to **500+ streams** by scaling the tracking server
- Dashboards update in under 1 second from driver to your screen

---

## 8. Pricing & Revenue Model

### How Fares Work

**Organizations set their own prices.** Each transport company configures their minimum fare, rate per km, surcharges, and fixed rates through their own dashboard. The platform calculates fares automatically.

**The formula:** Fare = Minimum Fare OR (Rate per km × Distance), whichever is higher. Night surcharges and vehicle surcharges are applied on top.

**Before the trip (estimate):**
- When a booking is created, the platform calculates the road distance using Google Maps
- The organization's pricing rules are applied to show the client an upfront fare estimate

**After the trip (actual):**
- The driver's GPS trace is matched to actual roads driven
- Actual distance is calculated from the corrected GPS path
- Final fare is computed from actual distance using the organization's rates
- If the actual fare differs from the estimate, both are shown to the organization

### Payment Collection

- **No online payments** — the platform does not process credit cards
- Passengers pay the driver directly: cash or POS terminal
- The driver confirms payment method in the app
- Revenue is recorded and visible to the organization and to you

### Your Commission (Platform Revenue)

You earn a commission on every completed trip across all organizations.

**How it works:**
1. Organization completes a trip — fare is €50
2. Your commission rate for that org is 15%
3. Your commission = €7.50
4. At month end, you see a report: total trips, total revenue, your total commission per org

**Commission settings:**
- Set a default commission rate for all new organizations (e.g., 15%)
- Override with a custom rate per organization (e.g., 10% for a high-volume partner)
- Monthly commission reports with per-organization breakdown
- Export reports for invoicing

**Example monthly report:**

| Organization | Trips | Revenue | Commission Rate | Your Commission |
|-------------|-------|---------|----------------|----------------|
| Athens Executive Cars | 340 | €12,400 | 15% | €1,860 |
| Crete Transfers Ltd | 180 | €6,200 | 12% | €744 |
| Thessaloniki VIP | 95 | €4,100 | 15% | €615 |
| **Total** | **615** | **€22,700** | | **€3,219** |

---

## 9. Notifications

The platform uses **push notifications** as the primary channel (faster, cheaper, richer than SMS). SMS is used as a fallback and for users without the app.

### Push Notifications (Primary)

| Event | Recipient | Content |
|-------|-----------|---------|
| Booking confirmed | Client | "Finding your driver..." |
| Driver accepted | Client | Driver photo, vehicle photo, name, plate, ETA |
| Driver en route | Client | "Your driver is on the way" + live tracking |
| Driver arrived / waiting | Client | "Driver is waiting at pickup" + waiting timer |
| No driver accepted (timeout) | Client | "No driver available. Try again?" |
| Trip completed | Client | Fare summary + "Rate your experience" |
| New ride request | Available drivers | Trip details, fare, distance — tap to accept |
| Ride taken by another driver | Remaining drivers | Request disappears |
| Low rating received | Org admin | "Driver Nikos received a 2-star rating" |
| Driver goes offline | Org dashboard | Alert |

### SMS (Fallback)

| Event | Recipient | When SMS is sent |
|-------|-----------|-----------------|
| Driver assigned | Client | Always (includes driver name, vehicle, ETA) |
| Driver en route | Client/Passenger | Always (includes live tracking link) |
| Trip completed | Client | Always (fare summary) |
| Driver invite | Driver | Always (invite link to join organization) |

### Masked Communication (Twilio Proxy)

- Once a driver accepts, client and driver can call/message each other
- Both sides see a masked Twilio number — personal numbers are never revealed
- Communication channel is active only during the trip
- Automatically disabled when trip completes

### Email (Phase 2)

Email summaries and reports will be added in the next development phase.

---

## 10. Security

### Authentication

| User Type | Login Method |
|-----------|-------------|
| Master Admin | Google account (OAuth 2.0) |
| Organization Admin/Booker | Google account (OAuth 2.0) |
| Driver | Phone number + PIN (set by you) |

- All sessions use encrypted JWT tokens
- Drivers cannot self-register — only their organization's admin can create driver accounts
- Organizations can only see their own data — never another organization's trips, revenue, or drivers
- You (master admin) see everything across all organizations
- Passwords/PINs are hashed and never stored in plain text

### Data Protection

- All data transmitted over HTTPS (SSL/TLS encryption)
- Database hosted on Supabase with encrypted storage
- GPS data stored with timestamps for audit purposes
- Full audit log of every action on the platform

### Access Control

| Role | Can See | Cannot See |
|------|---------|------------|
| Master Admin | All organizations, all trips, all revenue, commission data, all ratings | — |
| Org Admin | Own fleet, drivers, bookings, pricing, revenue, driver ratings | Other orgs, platform commission, master admin settings |
| Driver | Incoming ride requests, accepted trips, navigation, payment | Other drivers, revenue, ratings about them |
| Client | Book rides, track trips, rate drivers, see org ratings | Organization internals, other clients' bookings |

---

## 11. Platform Development Cost

The total cost to build and deliver the platform is:

### **€36,000** (before tax, one-time, fixed price)

| Module | What's Included | Price |
|--------|----------------|-------|
| Platform foundation | Monorepo setup, database design, authentication (Google OAuth + driver PIN), role-based access control | €3,000 |
| Master admin panel | Vehicle class catalog, organization verification, commission management, platform analytics, live map of all drivers, audit log, cancellation policy | €4,000 |
| Organization panel | Fleet management with vehicle photos, driver invites, pricing configuration per vehicle class, live fleet map, revenue and driver performance reports | €4,000 |
| Client booking system | Uber-style booking with broadcast to drivers, first-to-accept, 5-min timeout, nearest driver ETA, multiple stops, vehicle class selection, fare estimates | €4,500 |
| Client accounts | Trip history with receipts, saved locations, ratings (1-5 stars), re-book previous trips, share trip link | €2,500 |
| Driver mobile app | Capacitor native app (Android + iOS), background GPS tracking, turn-by-turn navigation, waiting timer, ride accept flow, payment confirmation, driver profile with photo | €4,500 |
| Real-time infrastructure | Socket.IO + Redis GPS pipeline, Server-Sent Events for dashboards, Google Maps live vehicle tracking with smooth animation, passenger tracking links | €3,500 |
| Communication & notifications | Push notifications (Firebase + APNs), masked calling/messaging via Twilio Proxy, SMS notifications (fallback) | €3,000 |
| Fare calculation engine | Google Routes API integration, GPS snap-to-roads, minimum fare + per-km pricing, night surcharges, airport fixed rates, waiting time charges, multi-stop fees | €2,500 |
| Infrastructure & deployment | Vercel + Hetzner VPS setup, Docker, CI/CD via GitHub Actions, SSL, domain configuration | €2,000 |
| Quality assurance | End-to-end testing, load testing (50 concurrent GPS streams), bug fixes, production deployment | €2,500 |

### What's Included in the Price

- Full source code — you own it
- All infrastructure setup and configuration
- Production deployment and go-live support
- 30 days of post-launch bug fixes

### What's Not Included

- Monthly infrastructure costs (see Section 13) — paid by you directly to each provider
- App Store and Play Store developer account fees (Google Play €25 one-time, Apple €99/year)
- App Store and Play Store submission and review process
- Maintenance and feature development after launch (separate retainer agreement)
- Content creation (translations, marketing copy, images beyond vehicle catalog)

### Payment Schedule

| Milestone | When | Amount |
|-----------|------|--------|
| Project kickoff | Contract signing | €10,800 (30%) |
| Core platform demo | Week 8 (booking + org panel + driver app working) | €14,400 (40%) |
| Production launch | Week 16 (fully deployed, acceptance criteria met) | €10,800 (30%) |

---

## 12. What You Get at Launch

**Client experience:**
- Uber-style booking — choose vehicle class, enter route (with multiple stops), book instantly
- Nearest driver ETA shown before booking ("Closest driver ~4 min away")
- Ride request broadcast to all matching available drivers — first driver to accept wins
- 5-minute booking timeout — if no driver accepts, client is notified to retry
- Driver and vehicle photos shown to client immediately after driver accepts
- Masked in-app calling and messaging between client and driver (Twilio Proxy)
- Live trip tracking on map with real-time ETA
- Share trip link with anyone (family, colleague)
- Waiting time tracking with charges after free period
- Trip receipts with full fare breakdown
- Rating system (1-5 stars + comment)
- Client account with full trip history and saved locations
- Push notifications for all booking events (SMS as fallback)

**Organization features:**
- Organization verification and onboarding (manual approval by master admin)
- Self-managed fleet — vehicles with photos, linked to platform vehicle class catalog
- Self-managed pricing per vehicle class (minimum fare + rate/km + surcharges + waiting charges)
- Driver invite system — each driver belongs to one organization
- Monitor driver activity and accepted rides in real-time
- Live operations map of their own fleet
- Revenue and per-driver performance reports

**Master admin:**
- Live map of all drivers across all organizations
- Commission management — configurable rate per org, monthly reports, export for invoicing
- Vehicle class catalog management (pre-filled with E Class, S Class, Vito, V Class, Sprinter)
- Cancellation policy configuration
- Organization verification and oversight
- Platform-wide analytics and audit log

**Driver app:**
- Native mobile app (Capacitor) with background GPS tracking
- Profile with photo (visible to clients)
- Receive ride requests via push notification — tap to accept
- Masked client communication
- Turn-by-turn navigation via Google Maps / Waze
- Waiting timer at pickup
- Payment confirmation (cash / POS)
- Push notifications for new trip assignments

**Infrastructure:**
- Deployed and production-ready on Vercel + Hetzner

### Not Included (Available in Future Phases)

- Advanced analytics with historical reports
- Email notifications and invoicing exports
- Trip history replay on map
- Webhook API for organization integrations
- Driver performance metrics
- Native iOS + Android driver app (App Store)

These features can be quoted and built after Phase 1 is live and validated.

---

## 13. Infrastructure Costs (Paid by You Monthly)

These are the ongoing costs to keep the platform running. You pay these directly to the service providers — they are not paid to us.

All infrastructure services issue invoices, which are deductible business expenses that reduce your taxable income.

### At Launch (1-5 organizations, 5-20 trips/day)

| Service | What It Does | Monthly Cost |
|---------|-------------|-------------|
| Vercel | Hosts the web application | €0 (free tier) |
| Hetzner VPS (CX22) | GPS tracking server + Redis | ~€4 |
| Supabase | PostgreSQL database | €0 (free tier) |
| Google Maps APIs | Maps, address search, route calculations | €0–5 (covered by Google's $200/mo free credit) |
| Twilio SMS | Booking notifications (~4 SMS per trip) | ~€12 |
| **Total at launch** | | **~€16–21/month** |

### At Growth (10-20 organizations, 50-100 trips/day)

| Service | What It Does | Monthly Cost |
|---------|-------------|-------------|
| Vercel Pro | Higher traffic, analytics | ~€20 |
| Hetzner VPS (CX22) | Same server handles this scale | ~€4 |
| Supabase Pro | More storage, higher limits | ~€25 |
| Google Maps APIs | Higher volume, may exceed free credit | ~€20–40 |
| Twilio SMS | More trips = more SMS | ~€30–60 |
| **Total at growth** | | **~€100–150/month** |

### At Scale (50+ organizations, 200+ trips/day)

| Service | What It Does | Monthly Cost |
|---------|-------------|-------------|
| Vercel Pro | Same | ~€20 |
| Hetzner VPS (CX32 upgrade) | More CPU/RAM for GPS streams | ~€8 |
| Supabase Pro | Same | ~€25 |
| Google Maps APIs | High volume | ~€80–150 |
| Twilio SMS | High volume | ~€120–240 |
| **Total at scale** | | **~€250–450/month** |

### One-Time Costs (Setup)

| Item | Cost |
|------|------|
| Domain name | ~€10–15/year |
| Google Play developer account | €25 (one-time) |
| Apple developer account | €99/year |
| SSL certificate | Free (Cloudflare) |

**Note:** Google provides $200/month free credit for Maps Platform APIs. At launch scale, your Google Maps costs will likely be fully covered by this credit.

---

## 14. How We Build It

### Timeline

| Week | What Gets Built |
|------|----------------|
| 1 | Project setup, database design, environment configuration |
| 2-3 | Login system, organization and user management |
| 4-6 | Client booking flow, fare calculation, driver ride acceptance |
| 6-8 | Driver native app, GPS tracking, navigation, push notifications |
| 8-9 | Live tracking server, real-time maps |
| 9-10 | Masked communication, push notifications |
| 10-12 | Fare engine, master admin panel, commission reports |
| 12-14 | Client accounts, ratings, organization dashboard |
| 14-16 | Testing, bug fixes, production deployment |

### Your Responsibilities

- Provide a Google Maps API key (we'll guide you through setup)
- Provide Twilio account credentials for SMS
- Provide your domain name for the platform
- Provide brand assets (logo, brand colors)
- Review and approve each milestone within 5 business days

### How We Verify It Works

Before we hand over the platform, we verify all of the following in production:

1. An organization admin can register, set up their fleet, and configure pricing per vehicle class
2. A client can book a ride, choosing vehicle class and multiple stops
3. The ride request broadcasts to available drivers — first driver to accept wins
4. If no driver accepts within 5 minutes, the client is notified to retry
5. Nearest driver ETA is shown on the booking screen
6. A driver can accept a ride, navigate, track waiting time, and confirm payment
7. Client and driver can communicate via masked phone numbers
8. Live GPS tracking works on org dashboard, admin map, and client tracking page
9. The organization sees their revenue; you (master admin) see your commission
10. Client has trip history with receipts and can rate drivers
11. Push notifications are delivered on Android and iOS
12. The platform handles 50 simultaneous active drivers without slowdown

---

*TransferGR Platform Overview v1.0 — Hexaigon — Confidential*
