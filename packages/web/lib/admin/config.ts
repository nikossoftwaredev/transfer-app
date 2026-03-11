import {
  LucideIcon,
  Receipt,
  Settings,
  Users,
  Building2,
  Car,
  BarChart3,
  Map,
  DollarSign,
  FileText,
  Shield,
} from "lucide-react";

interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const adminNavItems: Record<string, AdminNavItem[]> = {
  Management: [
    { label: "Organizations", href: "organizations", icon: Building2 },
    { label: "Users", href: "users", icon: Users },
    { label: "Vehicle Classes", href: "vehicle-classes", icon: Car },
  ],
  Operations: [
    { label: "Analytics", href: "analytics", icon: BarChart3 },
    { label: "Live Map", href: "live-map", icon: Map },
  ],
  Finance: [
    { label: "Commission", href: "commission", icon: DollarSign },
    { label: "Expenses", href: "expenses", icon: Receipt },
  ],
  System: [
    { label: "Cancellation Policy", href: "cancellation-policy", icon: Shield },
    { label: "Audit Log", href: "audit", icon: FileText },
    { label: "Settings", href: "settings", icon: Settings },
  ],
};
