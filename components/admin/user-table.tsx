"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminRoles, useAdminUserActions, useAdminUsers } from "@/lib/hooks/use-admin";
import type { AdminUserSummary } from "@/types";

const statusLabels: Record<string, string> = {
  INVITED: "Invited",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  DISABLED: "Disabled",
};

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "status", label: "Status" },
  { value: "last_login", label: "Last login" },
  { value: "verified", label: "Verification" },
];

export const UserTable = () => {
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    roleId: "",
    verified: "",
    page: 1,
    pageSize: 50,
    sortBy: "name",
    sortDirection: "asc" as "asc" | "desc",
  });
  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchText, page: 1 }));
    }, 400);
    return () => clearTimeout(handle);
  }, [searchText]);
  const { data, isFetching } = useAdminUsers(filters);
  const userActions = useAdminUserActions();
  const rolesQuery = useAdminRoles();
  const roleOptions = useMemo(() => {
    const payload = rolesQuery.data as any;
    if (!payload) return [] as RoleSummary[];
    return payload.data ?? payload;
  }, [rolesQuery.data]);
  const users = (data as any)?.users ?? data?.data?.users ?? [];
  const pagination = (data as any)?.pagination ?? data?.data?.pagination ?? { total: 0, page: 1, pageSize: 50 };

  useEffect(() => {
    setSelected(new Set());
  }, [filters.page, filters.search, filters.status, filters.roleId, filters.verified]);

  const toggleSelection = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const bulkAction = (action: "activate" | "deactivate" | "delete") => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    userActions.bulkAction.mutate({ action: `bulk-${action}`, userIds: ids });
  };

  const totalPages = Math.max(Math.ceil(pagination.total / (filters.pageSize || 1)), 1);

  return (
    <Card>
      <CardHeader className="gap-4 space-y-4 md:flex md:items-end md:justify-between md:space-y-0">
        <div>
          <CardTitle className="text-xl">Directory</CardTitle>
          <p className="text-sm text-muted-foreground">Manage every internal and client user from a single table.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search name or email"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="w-56"
          />
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value === "all" ? "" : value, page: 1 }))}
          >
            <SelectTrigger className="w-36">
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
          <Select
            value={filters.verified}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, verified: value === "all" ? "" : value, page: 1 }))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Verification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Verified</SelectItem>
              <SelectItem value="false">Unverified</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.roleId}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, roleId: value === "all" ? "" : value, page: 1 }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {roleOptions.map((role: any) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={`${filters.sortBy}:${filters.sortDirection}`}
            onValueChange={(value) => {
              const [sortBy, sortDirection] = value.split(":");
              setFilters((prev) => ({ ...prev, sortBy, sortDirection: sortDirection as "asc" | "desc" }));
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={`${option.value}:asc`} value={`${option.value}:asc`}>
                  {option.label} (A→Z)
                </SelectItem>
              ))}
              {sortOptions.map((option) => (
                <SelectItem key={`${option.value}:desc`} value={`${option.value}:desc`}>
                  {option.label} (Z→A)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 px-3 py-2 text-sm">
            <span className="font-medium">Bulk actions ({selected.size} selected)</span>
            <Button size="sm" variant="secondary" onClick={() => bulkAction("activate")}>Activate</Button>
            <Button size="sm" variant="secondary" onClick={() => bulkAction("deactivate")}>Suspend</Button>
            <Button size="sm" variant="destructive" onClick={() => bulkAction("delete")}>Delete</Button>
          </div>
        )}
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selected.size > 0 && selected.size === users.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelected(new Set(users.map((user: AdminUserSummary) => user.id)));
                      } else {
                        setSelected(new Set());
                      }
                    }}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                    Loading directory…
                  </TableCell>
                </TableRow>
              )}
              {!isFetching && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                    No users found with the current filters.
                  </TableCell>
                </TableRow>
              )}
              {users.map((user: AdminUserSummary) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox checked={selected.has(user.id)} onCheckedChange={() => toggleSelection(user.id)} aria-label={`Select ${user.fullName}`} />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/admin/users/${user.id}`} className="hover:underline">
                      {user.fullName || user.email}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    {user.roles?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role: any) => (
                          <Badge key={role.id} variant="outline">
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"}>
                      {statusLabels[user.status] ?? user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.emailVerified ? "success" : "outline"}>
                      {user.emailVerified ? "Verified" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/users/${user.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <div>
            Showing {(filters.page - 1) * filters.pageSize + 1}–
            {Math.min(filters.page * filters.pageSize, pagination.total)} of {pagination.total}
          </div>
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

type RoleSummary = {
  id: string;
  name: string;
};
