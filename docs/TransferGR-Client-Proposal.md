# TransferGR — Platform Overview

**Prepared for:** [Client Name]
**Prepared by:** Hexaigon
**Date:** March 2026
**Version:** 1.0

---

## What Is TransferGR?

TransferGR is a corporate transfer management platform built for Greece. It connects transport organizations with their clients through a single platform — and gives you full visibility over all of them.

Organizations (transport companies) sign up, manage their own fleet, set their own pricing, and handle their own bookings. You — the platform owner — see everything: every organization, every trip, every euro. At the end of each month, you collect a commission on all completed trips.

No app store installs needed for clients — everything runs in the browser. Drivers get a dedicated mobile app with GPS tracking and turn-by-turn navigation.

---

## Who Uses the Platform

TransferGR serves four distinct user groups, each with their own interface:

| Role | Who They Are | What They See |
|------|-------------|---------------|
| **Master Admin** (You) | The platform owner | Everything — all organizations, all trips, all revenue, commission reports |
| **Organization Admin** | Transport company manager | Their own fleet, drivers, bookings, pricing, and revenue |
| **Driver** | Organization's employed drivers | Assigned trips, navigation, payment confirmation |
| **Passenger** | The person being transferred | A live tracking link (no account needed) |

---

## 1. Master Admin Panel — Your Command Center

This is your view. You see everything across all organizations. Your primary role is platform oversight and commission collection.

### Live Operations Map

- Real-time map showing every active driver across all organizations, updated every 4 seconds
- Click any vehicle to see: driver name, organization, current trip, speed, destination, ETA
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

### Organization Management

- Approve, suspend, or remove organizations from the platform
- Set commission rate per organization
- View each organization's trip history, revenue, fleet size
- Monitor organization activity and growth

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

**Vehicles:**
- Register vehicles: plate number, type (sedan, minivan, minibus), passenger capacity
- Track vehicle status: available, on trip, in maintenance
- Assign vehicles to drivers

**Drivers:**
- Register drivers: name, phone, license number
- Set a login PIN for each driver
- Assign or unassign vehicles
- See real-time availability: online, offline, on trip
- Reset PINs, suspend or remove drivers

### Pricing (Set by the Organization)

Organizations set their own prices. They control:

| Parameter | Example | Notes |
|-----------|---------|-------|
| Base fare | €5.00 | Flat fee per trip |
| Rate per km | €1.20 | Distance-based |
| Rate per minute | €0.15 | Duration-based |
| Night surcharge | 1.5x | Applied between 00:00–06:00 |
| Airport fixed rate | €35.00 | Overrides distance calculation for airport trips |
| Vehicle surcharge | Minibus +€10 | Different rates per vehicle type |

### Booking Management & Dispatch

- See all incoming bookings for their organization
- Assign a driver and vehicle to each booking
- Track all active trips on a live map
- Set or adjust the estimated fare
- View completed and cancelled trip history

### Live Operations Map

- Real-time map showing their own drivers' positions
- Click any vehicle to see: driver name, current trip, speed, destination
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

## 3. Client Booking — How End Customers Book

Organizations can receive bookings from their clients (hotels, corporate accounts, travel agencies) through the platform.

### Booking a Transfer

1. Enter pickup address (autocomplete suggests addresses as they type)
2. Enter destination address
3. See the route on a map with estimated distance and fare
4. Choose date, time, number of passengers, vehicle preference
5. Add special instructions (e.g., "Flight TK1234, arriving Terminal B")
6. Submit — booking goes to the organization for dispatch

### Tracking a Booking

- See real-time status: pending, driver assigned, in progress, completed
- Cancel or modify bookings (subject to organization's lead-time rules)

### Notifications

| Event | How They're Notified |
|-------|---------------------|
| Booking confirmed | SMS + Email |
| Driver assigned | SMS with driver name, vehicle, and ETA |
| Driver en route | SMS with live tracking link |
| Trip completed | Email summary with distance and fare |

---

## 4. Driver Mobile App

Each organization's drivers get a dedicated mobile app that works on any Android or iOS phone. A full native app ensures reliable GPS tracking even in the background.

### What Drivers See

- **Login:** Phone number + PIN (set by their organization's admin, they can't self-register)
- **Trip List:** All assigned trips in chronological order
- **Trip Detail:** Pickup/dropoff addresses on a map, passenger count, special instructions
- **Navigation:** One tap opens Google Maps or Waze with the destination — turn-by-turn directions in their preferred app
- **Trip Actions:** Accept → Start Trip → Complete Trip → Confirm Payment

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

## 6. Live Tracking — Technical Reliability

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

## 7. Pricing & Revenue Model

### How Fares Work

**Organizations set their own prices.** Each transport company configures their pricing rules (base fare, rate per km, night surcharges, etc.) through their own dashboard. The platform calculates fares automatically based on these rules.

**Before the trip (estimate):**
- When a booking is created, the platform calculates the road distance and estimated duration using Google Maps
- The organization's pricing rules are applied to show the client an upfront fare estimate

**After the trip (actual):**
- The driver's GPS trace is matched to actual roads driven
- Actual distance is calculated from the corrected GPS path
- Final fare is computed from actual distance and duration using the organization's rates

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

## 8. Notifications

### SMS Notifications (Twilio)

| Event | Recipient | Message |
|-------|-----------|---------|
| Booking confirmed | Booker | "Booking #123 confirmed for Mar 15 at 09:00" |
| Driver assigned | Booker + Passenger | "Driver Nikos (Toyota Vito, ABC-1234) assigned. ETA 10 min" |
| Driver en route | Passenger | "Your driver is on the way. Track live: [link]" |
| Trip completed | Booker | "Trip completed. 12.4 km, €18.50" |

### In-App Alerts (Real-Time)

| Event | Recipient |
|-------|-----------|
| New booking received | Your dispatch dashboard |
| Driver goes offline unexpectedly | Your dashboard |
| Trip status changes | Organization portal |

### Email (Phase 2)

Email summaries and reports will be added in the next development phase.

---

## 9. Security

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
| Master Admin | All organizations, all trips, all revenue, commission data | — |
| Org Admin | Own fleet, drivers, bookings, pricing, revenue | Other orgs, platform commission, master admin settings |
| Booker / Dispatcher | Own org's bookings and dispatch | Fleet management, pricing, other orgs |
| Driver | Own assigned trips only | Bookings, organizations, revenue, other drivers |

---

## 10. Running Costs

### Monthly Infrastructure

| Service | What It Does | Monthly Cost |
|---------|-------------|-------------|
| Vercel | Hosts the web application | €0 (free tier) to €20 (Pro) |
| Hetzner VPS (CX22) | Runs the GPS tracking server + Redis | ~€4 |
| Supabase | PostgreSQL database | €0 (free tier, up to 500MB) |
| **Infrastructure Total** | | **€4–24/month** |

### Usage-Based Costs

| Service | What It Does | Cost | Estimate at 20 trips/day |
|---------|-------------|------|--------------------------|
| Google Maps JS API | Maps on dashboards and booking | €0 (free up to 28,000 loads/mo) | €0 |
| Google Places API | Address autocomplete | $2.83 per 1,000 requests | ~€2/month |
| Google Routes API | Fare estimates (distance calc) | $5 per 1,000 requests | ~€3/month |
| Google Roads API | Post-trip GPS snap-to-roads | $10 per 1,000 requests | ~€6/month |
| Twilio SMS | Booking notifications | ~€0.05 per SMS | ~€12/month (4 SMS × 20 trips × 30 days) |
| **Usage Total** | | | **~€23/month** |

### Total Estimated Monthly Cost

| Scale | Trips/Day | Monthly Cost |
|-------|-----------|-------------|
| **Launch (1-5 orgs)** | 5-20 | **€15-40/month** |
| **Growth (10-20 orgs)** | 50-100 | **€60-120/month** |
| **Scale (50+ orgs)** | 200+ | **€200-400/month** |

**Note:** Google provides $200/month free credit for Maps Platform APIs. At launch scale, your Google Maps costs may be fully covered by this credit.

### What's NOT Included in Running Costs

- Domain name registration (~€10-15/year)
- SSL certificate (free via Cloudflare)
- Twilio phone number (~€1/month)
- Google Maps API key (free to create, pay per usage)
- App Store developer accounts: Google Play (€25 one-time), Apple (€99/year)

---

## 11. What You Get at Launch

### Included (Phase 1)

- Master admin panel with live map, analytics, commission management, and platform oversight
- Organization onboarding — transport companies manage their own fleet, pricing, and bookings
- Per-organization fleet management — vehicles and drivers registry
- Client booking portal with Google Maps route preview and fare estimates
- Driver mobile app with GPS tracking, navigation, and payment confirmation
- Real-time vehicle tracking on organization and master admin dashboards
- Passenger tracking links via SMS
- Pre-trip fare estimation and post-trip actual fare calculation
- Organization-controlled pricing with your commission on top
- Monthly commission reports with per-organization breakdown
- SMS notifications for booking lifecycle
- Full audit log of all platform actions
- Deployed and production-ready on Vercel + Hetzner

### Not Included (Available in Future Phases)

| Feature | Phase | Estimated Cost |
|---------|-------|----------------|
| Advanced analytics with historical reports | Phase 2 | €7,000–9,000 |
| Email notifications and invoicing exports | Phase 2 | Included in Phase 2 |
| Trip history replay on map | Phase 2 | Included in Phase 2 |
| Webhook API for org integrations | Phase 2 | Included in Phase 2 |
| Driver performance metrics | Phase 2 | Included in Phase 2 |
| Native iOS + Android driver app (App Store) | Phase 3 | €5,500–7,000 |

---

## 12. How We Build It

### Timeline

| Week | What Gets Built |
|------|----------------|
| 1 | Project setup, database design, environment configuration |
| 2-3 | Login system, organization and user management |
| 4-5 | Booking flow, fare calculation, operator dispatch |
| 6-7 | Driver mobile app, GPS tracking, navigation |
| 8 | Live tracking server, real-time maps |
| 9 | Admin analytics, SMS notifications, passenger tracking |
| 10 | Testing, bug fixes, production deployment |

### Your Responsibilities

- Provide a Google Maps API key (we'll guide you through setup)
- Provide Twilio account credentials for SMS
- Provide your domain name for the platform
- Provide brand assets (logo, brand colors)
- Review and approve each milestone within 5 business days

### How We Verify It Works

Before we hand over the platform, we verify all of the following in production:

1. An organization admin can register, set up their fleet, and configure pricing
2. A client can create a booking through the organization's portal
3. The org admin can assign a driver and vehicle from their dashboard
4. A driver can log in, accept a trip, and start GPS tracking
5. The organization's dashboard shows the driver moving in real time
6. You (master admin) can see all active trips across all organizations on one map
7. A trip can be completed and payment confirmed by the driver
8. The organization sees their revenue; you see your commission
9. Monthly commission report generates accurate data per organization
10. The platform handles 50 simultaneous active drivers without slowdown

---

*TransferGR Platform Overview v1.0 — Hexaigon — Confidential*
