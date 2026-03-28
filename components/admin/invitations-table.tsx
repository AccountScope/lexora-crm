"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminInvitations, useInvitationActions } from "@/lib/hooks/use-admin";
import type { InvitationRecord } from "@/types";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  expired: "Expired",
  cancelled: "Cancelled",
};

export const InvitationsTable = () => {
  const [filters, setFilters] = useState({ status: "pending", page: 1, pageSize: 25 });
  const { data, isFetching } = useAdminInvitations(filters);
  const responseData = data as any;
  const invitations = responseData?.invitations ?? responseData?.data?.invitations ?? [];
  const pagination = responseData?.pagination ?? responseData?.data?.pagination ?? { total: invitations.length, page: 1, pageSize: 25 };
  const { resend, cancel } = useInvitationActions();
  const totalPages = Math.max(Math.ceil(pagination.total / (filters.pageSize || 1)), 1);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <CardTitle>Pending invitations</CardTitle>
          <p className="text-sm text-muted-foreground">Track every outstanding invite and resend or cancel with one click.</p>
        </div>
        <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Invited by</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    Loading invitations…
                  </TableCell>
                </TableRow>
              )}
              {!isFetching && invitations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    No invitations match the selected filters.
                  </TableCell>
                </TableRow>
              )}
              {invitations.map((invite: InvitationRecord) => (
                <TableRow key={invite.id}>
                  <TableCell>{invite.email}</TableCell>
                  <TableCell>{invite.role?.name ?? "—"}</TableCell>
                  <TableCell>{invite.invitedBy?.name ?? "—"}</TableCell>
                  <TableCell>{new Date(invite.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{new Date(invite.expiresAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={invite.status === "pending" ? "outline" : invite.status === "accepted" ? "success" : "secondary"}>
                      {statusLabels[invite.status] ?? invite.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={invite.status !== "pending" || resend.isPending}
                      onClick={() => resend.mutate(invite.id)}
                    >
                      Resend
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={invite.status !== "pending" || cancel.isPending}
                      onClick={() => cancel.mutate(invite.id)}
                    >
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(filters.page - 1) * filters.pageSize + 1}–
            {Math.min(filters.page * filters.pageSize, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={filters.page <= 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
            >
              Previous
            </Button>
            <span>
              Page {pagination.page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={filters.page >= totalPages}
              onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
