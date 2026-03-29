"use client";

import Link from "next/link";
import type { CaseSummary } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { FolderOpen, Plus } from "lucide-react";

type Props = {
  data?: CaseSummary[];
  loading?: boolean;
};

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning"> = {
  OPEN: "default",
  PENDING: "warning",
  ON_HOLD: "secondary",
  CLOSED: "success",
};

export const CasesTable = ({ data, loading }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active matters</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : data && data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matter</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Practice Area</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Opened</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((matter) => (
                <TableRow key={matter.id} className="text-sm">
                  <TableCell>
                    <Link href={`/cases/${matter.id}`} className="font-semibold hover:underline">
                      {matter.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">{matter.matterNumber}</div>
                  </TableCell>
                  <TableCell>{matter.client.displayName ?? matter.client.legalName}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[matter.status] ?? "secondary"}>{matter.status}</Badge>
                  </TableCell>
                  <TableCell>{matter.practiceArea ?? "—"}</TableCell>
                  <TableCell>{matter.leadAttorney?.name ?? "Unassigned"}</TableCell>
                  <TableCell>
                    {matter.opensOn ? format(new Date(matter.opensOn), "dd MMM yyyy") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={FolderOpen}
            title="No matters yet"
            description="Start your first legal matter to begin tracking cases, documents, and deadlines in Lexora."
            actionLabel="Create matter"
            actionHref="/cases/new"
            secondaryActionLabel="Learn more"
            secondaryActionHref="/docs/cases"
            tips={[
              "Each matter automatically tracks time, documents, and deadlines",
              "Link matters to trust accounts for seamless financial tracking",
              "Assign team members and manage permissions per matter"
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
};
