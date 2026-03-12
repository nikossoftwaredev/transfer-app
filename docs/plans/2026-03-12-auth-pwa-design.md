# Auth Flow + PWA Setup Design

> Approved 2026-03-12. Covers login pages, post-login routing, PWA configuration.

---

## Decisions

- **PWA now, Capacitor later** — `next-pwa` for installable web app, Capacitor shell for App Store/Play Store in a future milestone
- **Single Google OAuth** for all non-driver users (client, orgadmin, superadmin). Role determines routing.
- **Driver login** via phone + PIN on a dedicated page
- **Landing page stays accessible** to logged-in users — navbar shows ProfileAvatar with "Go to Dashboard" link
- **Post-login redirect** by role: client→`/book`, driver→`/driver`, orgadmin→`/org`, superadmin→`/admin`

---

## 1. PWA Configuration

### Package
- `next-pwa` added to `packages/web`
- Configured in `next.config.ts` wrapping existing `withNextIntl`

### Manifest (`public/manifest.webmanifest`)
```json
{
  "name": "TransferGR",
  "short_name": "TransferGR",
  "description": "Premium transfer booking",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a1a2e",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### Meta Tags (in root layout `<head>`)
```html
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="theme-color" content="#1a1a2e" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

### Cache Strategy
- Network-first for API routes and server actions
- Cache-first for static assets (images, fonts, CSS/JS)
- Offline fallback page for when network unavailable

---

## 2. Auth Pages

### `/[locale]/auth/signin/page.tsx` — Unified Login

**Layout:** Centered card on a subtle gradient background, mobile-first.

**Content:**
- TransferGR logo (top center)
- "Welcome" heading with subtitle "Sign in to continue"
- **[G] Continue with Google** — primary button, calls `signIn("google")`
- Horizontal divider with "or" text
- **"Sign in as Driver →"** — link to `/[locale]/driver/login`
- Footer: "By continuing, you agree to our Terms & Privacy Policy"

**Behavior:**
- Accepts `?callbackUrl=` query param, passes to `signIn()`
- If already authenticated, redirect to role-based dashboard
- i18n: translations under `Auth.signin.*` namespace

### `/[locale]/driver/login/page.tsx` — Driver Login

**Layout:** Same centered card style as main signin.

**Content:**
- TransferGR logo
- "Driver Login" heading
- Phone input: country prefix `+30` (fixed) + phone number field
- PIN input: 4 masked dots, numeric-only
- **[Sign In]** button — calls `signIn("credentials", { phone, pin })`
- Error toast for invalid credentials
- "← Back to main login" link

**Behavior:**
- On success, NextAuth credentials provider validates against `User.pinHash`
- Redirect to `/driver` dashboard
- i18n: translations under `Auth.driverLogin.*` namespace

---

## 3. Post-Login Routing

### In `proxy.ts` (middleware)
After successful authentication, check `token.role` and redirect:

| Role | Default redirect | Accessible routes |
|------|-----------------|-------------------|
| `client` | `/[locale]/book` | `/book`, `/account`, `/account/locations` |
| `driver` | `/[locale]/driver` | `/driver`, `/driver/trips`, `/driver/profile` |
| `orgadmin` | `/[locale]/org` | `/org/*` |
| `superadmin` | `/[locale]/admin` | `/admin/*` + all other routes |

### Auth callback redirect logic
- If `callbackUrl` present and user has permission → use it
- Otherwise → role-based default from table above

---

## 4. Session-Aware Navbar

### Landing page navbar changes:
- **Not authenticated:** "Sign In" button + "Book Now" CTA
- **Authenticated:** `ProfileAvatar` dropdown containing:
  - User name + email
  - "Go to Dashboard" → role-based route
  - "Sign Out" → `signOut()`

### ProfileAvatar component (`components/auth/profile-avatar.tsx`)
- Already exists, needs update to include role-based dashboard link
- Uses `useSession()` client-side
- Dropdown via shadcn `DropdownMenu`

---

## 5. i18n Keys Required

```json
{
  "Auth": {
    "signin": {
      "title": "Welcome",
      "subtitle": "Sign in to continue",
      "googleButton": "Continue with Google",
      "driverLink": "Sign in as Driver",
      "terms": "By continuing, you agree to our Terms & Privacy Policy",
      "or": "or"
    },
    "driverLogin": {
      "title": "Driver Login",
      "phonePlaceholder": "Phone number",
      "pinPlaceholder": "PIN",
      "signInButton": "Sign In",
      "backLink": "Back to main login",
      "errorInvalid": "Invalid phone number or PIN",
      "errorNotFound": "Driver account not found"
    },
    "profile": {
      "dashboard": "Go to Dashboard",
      "signOut": "Sign Out"
    }
  }
}
```

---

## 6. Files to Create/Modify

### New files:
- `app/[locale]/auth/signin/page.tsx` — unified login page (server component wrapper)
- `components/auth/signin-form.tsx` — client component with Google + driver link
- `app/[locale]/driver/login/page.tsx` — driver login page (server component wrapper)
- `components/auth/driver-login-form.tsx` — client component with phone + PIN form
- `public/manifest.webmanifest` — PWA manifest
- `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` — PWA icons

### Modified files:
- `next.config.ts` — add `next-pwa` wrapper
- `app/[locale]/layout.tsx` — add PWA meta tags
- `app/[locale]/page.tsx` — update navbar to show ProfileAvatar when logged in
- `components/auth/profile-avatar.tsx` — add "Go to Dashboard" with role routing
- `proxy.ts` — add post-login role-based redirect logic
- `messages/en.json` — add Auth namespace
- `messages/el.json` — add Auth namespace (Greek translations)
- `package.json` — add `next-pwa` dependency
