"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, Users, Car, DollarSign, XCircle } from "lucide-react";

interface AdminAnalyticsProps {
  tripsToday: number;
  tripsWeek: number;
  tripsMonth: number;
  activeDrivers: number;
  totalRevenue: number;
  cancelledCount: number;
  topOrgs: {
    id: string;
    name: string;
    tripCount: number;
    commissionRate: number;
  }[];
}

export const AdminAnalytics = ({
  tripsToday,
  tripsWeek,
  tripsMonth,
  activeDrivers,
  totalRevenue,
  cancelledCount,
  topOrgs,
}: AdminAnalyticsProps) => {
  const cancellationRate =
    tripsMonth + cancelledCount > 0
      ? ((cancelledCount / (tripsMonth + cancelledCount)) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Platform-wide metrics and performance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <BarChart3 className="size-4" />
              Trips Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{tripsToday}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <Car className="size-4" />
              Trips This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{tripsMonth}</span>
            <span className="text-sm text-muted-foreground ml-2">
              ({tripsWeek} this week)
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="size-4" />
              Active Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{activeDrivers}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <DollarSign className="size-4" />
              Revenue (Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">
              €{totalRevenue.toFixed(2)}
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="size-5" />
              Cancellation Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cancellationRate}%</div>
            <p className="text-sm text-muted-foreground">
              {cancelledCount} cancelled out of{" "}
              {tripsMonth + cancelledCount} total this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Trips</TableHead>
                  <TableHead>Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topOrgs.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>{org.tripCount}</TableCell>
                    <TableCell>
                      {(org.commissionRate * 100).toFixed(0)}%
                    </TableCell>
                  </TableRow>
                ))}
                {topOrgs.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground"
                    >
                      No data yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
