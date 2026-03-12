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
export default withPWA(withNextIntl(nextConfig) as Record<string, unknown>) as NextConfig;
