"use client";

import { Link } from "@/lib/i18n/navigation";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/general/utils";
import { Users, Car, DollarSign, LayoutDashboard, BookOpen, Map, BarChart3 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/org", label: "Dashboard", icon: LayoutDashboard },
  { href: "/org/drivers", label: "Drivers", icon: Users },
  { href: "/org/fleet", label: "Fleet", icon: Car },
  { href: "/org/pricing", label: "Pricing", icon: DollarSign },
  { href: "/org/bookings", label: "Bookings", icon: BookOpen },
  { href: "/org/live-map", label: "Fleet Map", icon: Map },
  { href: "/org/reports", label: "Reports", icon: BarChart3 },
];

export const OrgSidebar = () => {
  const pathname = usePathname();
  // Strip locale prefix for matching
  const path = pathname.replace(/^\/(en|el)/, "");

  return (
    <aside className="w-64 border-r bg-muted/30 p-4 flex flex-col gap-1">
      <h2 className="text-lg font-semibold px-3 py-2 mb-2">Organization</h2>
      {NAV_ITEMS.map((item) => {
        const active = path === item.href || (item.href !== "/org" && path.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-300",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
};
