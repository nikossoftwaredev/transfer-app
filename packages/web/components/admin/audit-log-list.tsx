"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/i18n/navigation";

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: unknown;
  createdAt: Date;
  user: { name: string; email: string | null } | null;
}

interface AuditLogListProps {
  entries: AuditEntry[];
  total: number;
  pages: number;
  currentPage: number;
}

export const AuditLogList = ({
  entries,
  total,
  pages,
  currentPage,
}: AuditLogListProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">
          {total} total entries
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {new Date(entry.createdAt).toLocaleString()}
              </TableCell>
              <TableCell className="font-medium">
                {entry.user?.name || "System"}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{entry.action}</Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {entry.entity} ({entry.entityId.slice(0, 8)}...)
                </span>
              </TableCell>
              <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                {entry.metadata
                  ? JSON.stringify(entry.metadata).slice(0, 100)
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
          {entries.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground py-8"
              >
                No audit entries yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/audit?page=${currentPage - 1}`}>
                Previous
              </Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {pages}
          </span>
          {currentPage < pages && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/audit?page=${currentPage + 1}`}>Next</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
