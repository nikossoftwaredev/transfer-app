"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, Download } from "lucide-react";
import { exportCommissionCSV } from "@/lib/pricing/commission";

interface CommissionEntry {
  orgId: string;
  orgName: string;
  commissionRate: number;
  tripCount: number;
  totalRevenue: number;
  commission: number;
  netRevenue: number;
}

interface CommissionReportProps {
  report: CommissionEntry[];
  year: number;
  month: number;
}

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const CommissionReport = ({
  report,
  year,
  month,
}: CommissionReportProps) => {
  const totalRevenue = report.reduce((s, r) => s + r.totalRevenue, 0);
  const totalCommission = report.reduce((s, r) => s + r.commission, 0);
  const totalTrips = report.reduce((s, r) => s + r.tripCount, 0);

  const handleExport = async () => {
    const csv = await exportCommissionCSV(year, month);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commission-report-${year}-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Commission Report</h1>
          <p className="text-muted-foreground">
            {MONTH_NAMES[month]} {year}
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">
              €{totalRevenue.toFixed(2)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <DollarSign className="size-4" />
              Your Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-green-600">
              €{totalCommission.toFixed(2)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Trips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{totalTrips}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Per-Organization Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Trips</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.map((r) => (
                <TableRow key={r.orgId}>
                  <TableCell className="font-medium">{r.orgName}</TableCell>
                  <TableCell>{r.tripCount}</TableCell>
                  <TableCell>€{r.totalRevenue.toFixed(2)}</TableCell>
                  <TableCell>
                    {(r.commissionRate * 100).toFixed(0)}%
                  </TableCell>
                  <TableCell className="text-green-600">
                    €{r.commission.toFixed(2)}
                  </TableCell>
                  <TableCell>€{r.netRevenue.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {report.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    No completed trips this month.
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
