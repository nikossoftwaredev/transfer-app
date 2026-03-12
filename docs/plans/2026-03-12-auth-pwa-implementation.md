# Auth Flow + PWA Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add PWA support (installable web app), custom login pages (Google OAuth + driver phone/PIN), session-aware navbar with role-based routing.

**Architecture:** Next.js App Router pages with server component wrappers and client form components. `next-pwa` wraps existing `withNextIntl` config. Middleware in `proxy.ts` already handles auth guards — we update NextAuth `pages` config to point to our custom signin page and add post-login role-based redirect.

**Tech Stack:** Next.js 16, NextAuth 4, next-pwa, shadcn/ui (Card, Input, Button, Label), Lucide icons, next-intl, Zustand (existing), Tailwind 4.

---

### Task 1: Install next-pwa and configure

**Files:**
- Modify: `packages/web/package.json` — add `next-pwa` dependency
- Modify: `packages/web/next.config.ts` — wrap config with `withPWA`
- Create: `packages/web/public/manifest.webmanifest`
- Modify: `packages/web/app/[locale]/layout.tsx` — add PWA meta tags in `<head>`
- Modify: `packages/web/.gitignore` — ignore generated SW files

**Step 1: Install next-pwa**

Run:
```bash
cd packages/web && pnpm add next-pwa && pnpm add -D @types/next-pwa
```

**Step 2: Create manifest**

Create `packages/web/public/manifest.webmanifest`:
```json
{
  "name": "TransferGR",
  "short_name": "TransferGR",
  "description": "Premium transfer booking in Greece",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#171717",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

**Step 3: Generate placeholder PWA icons**

Create `packages/web/public/icons/` directory. Generate simple placeholder PNGs (192x192 and 512x512) with the TransferGR branding. These are temporary — real icons come later.

Use a script or sharp to generate solid-color placeholder icons:
```bash
cd packages/web
node -e "
const sharp = require('sharp');
const sizes = [192, 512];
for (const s of sizes) {
  const svg = \`<svg width=\"\${s}\" height=\"\${s}\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"\${s}\" height=\"\${s}\" fill=\"#171717\"/><text x=\"50%\" y=\"50%\" font-size=\"\${s/4}\" fill=\"white\" text-anchor=\"middle\" dominant-baseline=\"central\" font-family=\"sans-serif\">TGR</text></svg>\`;
  sharp(Buffer.from(svg)).png().toFile(\`public/icons/icon-\${s}.png\`);
  sharp(Buffer.from(svg)).png().toFile(\`public/icons/icon-maskable-\${s}.png\`);
}
console.log('Icons generated');
"
```

**Step 4: Update next.config.ts**

Replace `packages/web/next.config.ts`:
```typescript
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {};

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");
export default withPWA(withNextIntl(nextConfig));
```

**Step 5: Add PWA meta tags to layout**

Modify `packages/web/app/[locale]/layout.tsx`. Update the metadata export and add `<head>` content:

```typescript
export const metadata: Metadata = {
  title: "TransferGR — Premium Transfer Services in Greece",
  description: "Book airport transfers, city rides, and port connections across Greece. Professional drivers, fixed prices, real-time tracking.",
  manifest: "/manifest.webmanifest",
  themeColor: "#171717",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TransferGR",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};
```

**Step 6: Update .gitignore**

Add to `packages/web/.gitignore`:
```
# next-pwa generated files
public/sw.js
public/sw.js.map
public/workbox-*.js
public/workbox-*.js.map
public/worker-*.js
public/worker-*.js.map
```

**Step 7: Verify**

Run:
```bash
cd packages/web && pnpm tsc --noEmit && pnpm lint
```
Expected: PASS with no errors.

**Step 8: Commit**

```bash
git add packages/web/package.json packages/web/pnpm-lock.yaml packages/web/next.config.ts packages/web/public/manifest.webmanifest packages/web/public/icons/ packages/web/app/\[locale\]/layout.tsx packages/web/.gitignore
git commit -m "feat: add PWA support with next-pwa, manifest, and icons"
```

---

### Task 2: Add i18n translations for Auth pages

**Files:**
- Modify: `packages/web/messages/en.json`
- Modify: `packages/web/messages/el.json`

**Step 1: Add Auth namespace to en.json**

Add the following `"Auth"` key at the top level of `packages/web/messages/en.json`:

```json
"Auth": {
  "signin": {
    "title": "Welcome",
    "subtitle": "Sign in to continue to TransferGR",
    "googleButton": "Continue with Google",
    "or": "or",
    "driverLink": "Sign in as Driver",
    "terms": "By continuing, you agree to our Terms of Service and Privacy Policy"
  },
  "driverLogin": {
    "title": "Driver Login",
    "subtitle": "Sign in with your phone number and PIN",
    "phoneLabel": "Phone Number",
    "phonePlaceholder": "691 234 5678",
    "pinLabel": "PIN",
    "pinPlaceholder": "Enter your 4-digit PIN",
    "signInButton": "Sign In",
    "backLink": "Back to main login",
    "errorInvalid": "Invalid phone number or PIN",
    "errorGeneric": "Something went wrong. Please try again."
  },
  "profile": {
    "dashboard": "Go to Dashboard",
    "signOut": "Sign Out",
    "myAccount": "My Account"
  }
}
```

**Step 2: Add Auth namespace to el.json**

Add the following `"Auth"` key at the top level of `packages/web/messages/el.json`:

```json
"Auth": {
  "signin": {
    "title": "Καλώς Ήρθατε",
    "subtitle": "Συνδεθείτε για να συνεχίσετε στο TransferGR",
    "googleButton": "Συνέχεια με Google",
    "or": "ή",
    "driverLink": "Σύνδεση ως Οδηγός",
    "terms": "Συνεχίζοντας, αποδέχεστε τους Όρους Χρήσης και την Πολιτική Απορρήτου"
  },
  "driverLogin": {
    "title": "Σύνδεση Οδηγού",
    "subtitle": "Συνδεθείτε με τον αριθμό τηλεφώνου και το PIN σας",
    "phoneLabel": "Αριθμός Τηλεφώνου",
    "phonePlaceholder": "691 234 5678",
    "pinLabel": "PIN",
    "pinPlaceholder": "Εισάγετε το 4ψήφιο PIN σας",
    "signInButton": "Σύνδεση",
    "backLink": "Πίσω στη σύνδεση",
    "errorInvalid": "Λάθος αριθμός τηλεφώνου ή PIN",
    "errorGeneric": "Κάτι πήγε στραβά. Δοκιμάστε ξανά."
  },
  "profile": {
    "dashboard": "Πίνακας Ελέγχου",
    "signOut": "Αποσύνδεση",
    "myAccount": "Ο Λογαριασμός μου"
  }
}
```

**Step 3: Verify**

Run:
```bash
cd packages/web && pnpm tsc --noEmit
```
Expected: PASS.

**Step 4: Commit**

```bash
git add packages/web/messages/en.json packages/web/messages/el.json
git commit -m "feat: add Auth i18n translations (en + el)"
```

---

### Task 3: Create unified signin page

**Files:**
- Create: `packages/web/app/[locale]/auth/signin/page.tsx` — server component wrapper
- Create: `packages/web/components/auth/signin-form.tsx` — client component

**Step 1: Create the server page**

Create `packages/web/app/[locale]/auth/signin/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import { SigninForm } from "@/components/auth/signin-form";

const ROLE_ROUTES: Record<string, string> = {
  client: "/book",
  driver: "/driver",
  orgadmin: "/org",
  superadmin: "/admin",
};

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

const SigninPage = async ({ params, searchParams }: Props) => {
  const { locale } = await params;
  const { callbackUrl, error } = await searchParams;
  setRequestLocale(locale);

  // If already authenticated, redirect to dashboard
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const role = session.user.role || "client";
    const dest = callbackUrl || ROLE_ROUTES[role] || "/";
    redirect(dest);
  }

  const t = await getTranslations("Auth.signin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <SigninForm
        callbackUrl={callbackUrl}
        error={error}
        translations={{
          title: t("title"),
          subtitle: t("subtitle"),
          googleButton: t("googleButton"),
          or: t("or"),
          driverLink: t("driverLink"),
          terms: t("terms"),
        }}
      />
    </div>
  );
};

export default SigninPage;
```

**Step 2: Create the client form**

Create `packages/web/components/auth/signin-form.tsx`:

```tsx
"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/lib/i18n/navigation";
import { AlertCircle } from "lucide-react";

interface SigninFormProps {
  callbackUrl?: string;
  error?: string;
  translations: {
    title: string;
    subtitle: string;
    googleButton: string;
    or: string;
    driverLink: string;
    terms: string;
  };
}

export const SigninForm = ({ callbackUrl, error, translations: t }: SigninFormProps) => {
  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: callbackUrl || "/book" });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-3 text-center pb-2">
        <div className="text-2xl font-bold tracking-tight">
          Transfer<span className="text-primary">GR</span>
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>Authentication failed. Please try again.</span>
          </div>
        )}

        <Button
          onClick={handleGoogleSignIn}
          variant="outline"
          className="w-full h-11 gap-3 text-sm font-medium"
        >
          <svg className="size-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {t.googleButton}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">{t.or}</span>
          </div>
        </div>

        <Button asChild variant="ghost" className="w-full h-11 text-sm">
          <Link href="/driver/login">
            {t.driverLink} &rarr;
          </Link>
        </Button>
      </CardContent>

      <CardFooter>
        <p className="text-xs text-center text-muted-foreground w-full">
          {t.terms}
        </p>
      </CardFooter>
    </Card>
  );
};
```

**Step 3: Verify**

Run:
```bash
cd packages/web && pnpm tsc --noEmit && pnpm lint
```
Expected: PASS.

**Step 4: Commit**

```bash
git add packages/web/app/\[locale\]/auth/signin/page.tsx packages/web/components/auth/signin-form.tsx
git commit -m "feat: add unified signin page with Google OAuth"
```

---

### Task 4: Create driver login page

**Files:**
- Create: `packages/web/app/[locale]/driver/login/page.tsx` — server component wrapper
- Create: `packages/web/components/auth/driver-login-form.tsx` — client component

**Step 1: Create the server page**

Create `packages/web/app/[locale]/driver/login/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import { DriverLoginForm } from "@/components/auth/driver-login-form";

interface Props {
  params: Promise<{ locale: string }>;
}

const DriverLoginPage = async ({ params }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);

  // If already authenticated as driver, redirect to dashboard
  const session = await getServerSession(authOptions);
  if (session?.user?.role === "driver") {
    redirect("/driver");
  }

  const t = await getTranslations("Auth.driverLogin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <DriverLoginForm
        translations={{
          title: t("title"),
          subtitle: t("subtitle"),
          phoneLabel: t("phoneLabel"),
          phonePlaceholder: t("phonePlaceholder"),
          pinLabel: t("pinLabel"),
          pinPlaceholder: t("pinPlaceholder"),
          signInButton: t("signInButton"),
          backLink: t("backLink"),
          errorInvalid: t("errorInvalid"),
          errorGeneric: t("errorGeneric"),
        }}
      />
    </div>
  );
};

export default DriverLoginPage;
```

**Step 2: Create the client form**

Create `packages/web/components/auth/driver-login-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/lib/i18n/navigation";
import { AlertCircle, ArrowLeft, Loader2, Phone, Lock } from "lucide-react";

interface DriverLoginFormProps {
  translations: {
    title: string;
    subtitle: string;
    phoneLabel: string;
    phonePlaceholder: string;
    pinLabel: string;
    pinPlaceholder: string;
    signInButton: string;
    backLink: string;
    errorInvalid: string;
    errorGeneric: string;
  };
}

export const DriverLoginForm = ({ translations: t }: DriverLoginFormProps) => {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const fullPhone = `+30${phone.replace(/\s/g, "")}`;
      const result = await signIn("driver-login", {
        phone: fullPhone,
        pin,
        redirect: false,
      });

      if (result?.error) {
        setError(t.errorInvalid);
      } else if (result?.ok) {
        router.push("/driver");
      }
    } catch {
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-3 text-center pb-2">
        <div className="text-2xl font-bold tracking-tight">
          Transfer<span className="text-primary">GR</span>
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="size-3.5" />
              {t.phoneLabel}
            </Label>
            <div className="flex gap-2">
              <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                +30
              </div>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder={t.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin" className="flex items-center gap-2">
              <Lock className="size-3.5" />
              {t.pinLabel}
            </Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder={t.pinPlaceholder}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading || !phone || pin.length < 4}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : t.signInButton}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Link href="/auth/signin">
            <ArrowLeft className="size-3.5" />
            {t.backLink}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
```

**Step 3: Verify**

Run:
```bash
cd packages/web && pnpm tsc --noEmit && pnpm lint
```
Expected: PASS.

**Step 4: Commit**

```bash
git add packages/web/app/\[locale\]/driver/login/page.tsx packages/web/components/auth/driver-login-form.tsx
git commit -m "feat: add driver login page with phone + PIN"
```

---

### Task 5: Update NextAuth pages config and proxy redirect

**Files:**
- Modify: `packages/web/lib/auth/auth.ts` — update `pages.signIn` to point to custom page
- Modify: `packages/web/proxy.ts` — add post-login role redirect for `/auth/signin`

**Step 1: Update NextAuth pages config**

In `packages/web/lib/auth/auth.ts`, change the `pages` object from:
```typescript
pages: {
  signIn: "/api/auth/signin",
  error: "/api/auth/error",
},
```
To:
```typescript
pages: {
  signIn: "/auth/signin",
  error: "/auth/signin?error=true",
},
```

This tells NextAuth to redirect to our custom page instead of the default one.

**Step 2: Update proxy.ts — exclude auth/driver-login from protection**

The driver login page is under `/driver/login` which currently requires the `driver` role. We need to exclude it. In `packages/web/proxy.ts`, add an early return before the protected route check:

After line 20 (`const pathWithoutLocale = ...`), add:

```typescript
// Allow unauthenticated access to auth pages and driver login
const PUBLIC_AUTH_ROUTES = ["/auth/signin", "/driver/login"];
if (PUBLIC_AUTH_ROUTES.some((route) => pathWithoutLocale.startsWith(route))) {
  return intlMiddleware(req);
}
```

**Step 3: Verify**

Run:
```bash
cd packages/web && pnpm tsc --noEmit && pnpm lint
```
Expected: PASS.

**Step 4: Commit**

```bash
git add packages/web/lib/auth/auth.ts packages/web/proxy.ts
git commit -m "feat: wire NextAuth to custom signin pages, allow public auth routes"
```

---

### Task 6: Update ProfileAvatar with role-based dashboard link

**Files:**
- Modify: `packages/web/components/auth/profile-avatar.tsx` — add dashboard link based on role

**Step 1: Update ProfileAvatar**

Replace `packages/web/components/auth/profile-avatar.tsx`:

```tsx
"use client";

import { signOut } from "next-auth/react";
import { LogOut, LayoutDashboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { useTranslations } from "next-intl";

const ROLE_ROUTES: Record<string, string> = {
  client: "/book",
  driver: "/driver",
  orgadmin: "/org",
  superadmin: "/admin",
};

interface ProfileAvatarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export const ProfileAvatar = ({ user }: ProfileAvatarProps) => {
  const t = useTranslations("Auth.profile");
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const dashboardRoute = ROLE_ROUTES[user.role || "client"] || "/";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image || ""} alt={user.name || "User"} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={dashboardRoute} className="flex items-center gap-2">
            <LayoutDashboard className="size-4" />
            {t("dashboard")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4 text-destructive" />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

**Step 2: Verify**

Run:
```bash
cd packages/web && pnpm tsc --noEmit && pnpm lint
```
Expected: PASS.

**Step 3: Commit**

```bash
git add packages/web/components/auth/profile-avatar.tsx
git commit -m "feat: add role-based dashboard link to ProfileAvatar dropdown"
```

---

### Task 7: Update LoginButton to pass role to ProfileAvatar

**Files:**
- Modify: `packages/web/components/examples/login-button.tsx` — pass role from session

**Step 1: Update LoginButton**

In `packages/web/components/examples/login-button.tsx`, update the ProfileAvatar call to pass the session user object which includes `role`:

Change line 19 from:
```tsx
if (session?.user) return <ProfileAvatar user={session.user} />;
```
To:
```tsx
if (session?.user) {
  return (
    <ProfileAvatar
      user={{
        ...session.user,
        role: session.user.role,
      }}
    />
  );
}
```

Also update the sign-in button to link to the signin page instead of triggering Google directly:

Change the return button from:
```tsx
return (
  <Button onClick={() => signIn("google")} size="sm" className="gap-2">
    <LogIn className="h-4 w-4" />
    <span className="hidden sm:inline">Sign in</span>
  </Button>
);
```
To:
```tsx
return (
  <Button asChild size="sm" className="gap-2">
    <Link href="/auth/signin">
      <LogIn className="h-4 w-4" />
      <span className="hidden sm:inline">Sign in</span>
    </Link>
  </Button>
);
```

Add the Link import at the top:
```tsx
import { Link } from "@/lib/i18n/navigation";
```

Remove the now-unused `signIn` import (keep `useSession`):
```tsx
import { useSession } from "next-auth/react";
```

**Step 2: Verify**

Run:
```bash
cd packages/web && pnpm tsc --noEmit && pnpm lint
```
Expected: PASS.

**Step 3: Commit**

```bash
git add packages/web/components/examples/login-button.tsx
git commit -m "feat: update LoginButton to link to signin page and pass role"
```

---

### Task 8: Add static params for auth routes

**Files:**
- Create: `packages/web/app/[locale]/auth/signin/layout.tsx` (optional — only if needed for static generation)

**Step 1: Verify static generation works**

The `generateStaticParams` in the root layout already generates locale variants. Check if the signin page needs its own. Since it uses `searchParams`, it's already dynamic. No layout needed.

But we need to make sure `setRequestLocale` is called. It's already called in the page.

**Step 2: Production build test**

Run:
```bash
cd packages/web && pnpm build
```

If there are errors, fix them. Common issues:
- Missing `generateStaticParams` (not needed for pages with `searchParams`)
- Import path issues

**Step 3: Commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: resolve build issues with auth pages"
```

---

### Task 9: Visual verification

**Step 1: Start dev server**

Run:
```bash
cd packages/web && pnpm dev
```

**Step 2: Screenshot signin page**

Run:
```bash
cd packages/web && node screenshot.mjs http://localhost:3000/en/auth/signin signin
```

Read the screenshot and verify:
- Centered card on subtle background
- TransferGR logo
- "Welcome" heading
- Google button with colored logo
- "or" divider
- "Sign in as Driver" link
- Terms text at bottom

**Step 3: Screenshot driver login page**

Run:
```bash
cd packages/web && node screenshot.mjs http://localhost:3000/en/driver/login driver-login
```

Read the screenshot and verify:
- Centered card
- TransferGR logo
- "Driver Login" heading
- Phone input with +30 prefix
- PIN input (masked)
- Sign In button
- Back link

**Step 4: Screenshot landing page navbar (logged out)**

Run:
```bash
cd packages/web && node screenshot.mjs http://localhost:3000/en landing-navbar
```

Verify the "Sign in" button in navbar links to `/auth/signin`.

**Step 5: Fix any visual issues found**

Iterate on screenshots until all pages look correct.

**Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: polish auth page styling after visual review"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | PWA: next-pwa + manifest + icons + config | next.config.ts, manifest, layout, .gitignore |
| 2 | i18n: Auth translations (en + el) | messages/en.json, messages/el.json |
| 3 | Unified signin page (Google OAuth) | auth/signin/page.tsx, signin-form.tsx |
| 4 | Driver login page (phone + PIN) | driver/login/page.tsx, driver-login-form.tsx |
| 5 | Wire NextAuth + proxy to custom pages | auth.ts, proxy.ts |
| 6 | ProfileAvatar: role-based dashboard link | profile-avatar.tsx |
| 7 | LoginButton: link to signin page | login-button.tsx |
| 8 | Build verification | N/A |
| 9 | Visual verification + polish | All auth pages |
