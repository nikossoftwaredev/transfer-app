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
import { BarChart3, DollarSign, Star } from "lucide-react";

interface OrgReportsProps {
  tripsToday: number;
  tripsMonth: number;
  revenueMonth: number;
  drivers: {
    name: string;
    tripCount: number;
    avgRating: number | null;
  }[];
}

export const OrgReports = ({
  tripsToday,
  tripsMonth,
  revenueMonth,
  drivers,
}: OrgReportsProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          Revenue and driver performance for your organization.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            <CardTitle className="text-sm text-muted-foreground">
              Trips This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{tripsMonth}</span>
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
              €{revenueMonth.toFixed(2)}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Driver Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Trips (Month)</TableHead>
                <TableHead>Avg Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((d, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>{d.tripCount}</TableCell>
                  <TableCell>
                    {d.avgRating ? (
                      <div className="flex items-center gap-1">
                        <Star className="size-3 fill-yellow-400 text-yellow-400" />
                        <span>{d.avgRating}</span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {drivers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground py-8"
                  >
                    No driver data yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
