"use client";

import Link from "next/link";
import type { CaseSummary } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { EmptyStatePremium } from "@/components/ui/empty-state-premium";
import { FolderOpen, ExternalLink, MoreHorizontal, Eye, Edit, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  data?: CaseSummary[];
  loading?: boolean;
  onCreateMatter?: () => void;
};

const statusConfig: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; color: string }> = {
  OPEN: { variant: "default", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  PENDING: { variant: "outline", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  ON_HOLD: { variant: "secondary", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
  CLOSED: { variant: "outline", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
};

export const CasesTablePremium = ({ data, loading, onCreateMatter }: Props) => {
  if (loading) {
    return (
      <div className="table-container table-container-shadow">
        <table className="table-premium">
          <thead>
            <tr>
              <th>Matter</th>
              <th>Client</th>
              <th>Status</th>
              <th className="hide-mobile">Practice Area</th>
              <th className="hide-mobile">Lead Attorney</th>
              <th>Opened</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="table-loading">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td><div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" /></td>
                <td><div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" /></td>
                <td><div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" /></td>
                <td className="hide-mobile"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" /></td>
                <td className="hide-mobile"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" /></td>
                <td><div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" /></td>
                <td><div className="h-4 w-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse ml-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-8">
        <EmptyStatePremium
          icon={FolderOpen}
          title="No matters yet"
          description="Start your first legal matter to begin tracking cases, documents, and deadlines in Lexora."
          variant="primary"
          action={onCreateMatter ? {
            label: "Create First Matter",
            onClick: onCreateMatter,
            icon: FolderOpen
          } : undefined}
          tips={[
            "Each matter automatically tracks time, documents, and deadlines",
            "Link matters to trust accounts for seamless financial tracking",
            "Assign team members and manage permissions per matter"
          ]}
        />
      </div>
    );
  }

  return (
    <div className="table-container table-container-shadow">
      <table className="table-premium table-striped">
        <thead>
          <tr>
            <th className="sticky-left">Matter</th>
            <th>Client</th>
            <th>Status</th>
            <th className="hide-mobile">Practice Area</th>
            <th className="hide-mobile">Lead Attorney</th>
            <th>Opened</th>
            <th className="sticky-right text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((matter) => (
            <tr key={matter.id} className="group">
              {/* Matter Title & Number */}
              <td className="sticky-left">
                <Link 
                  href={`/cases/${matter.id}`} 
                  className="block"
                >
                  <div className="table-cell-primary font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {matter.title}
                  </div>
                  <div className="table-cell-secondary text-xs mt-0.5 font-mono">
                    {matter.matterNumber}
                  </div>
                </Link>
              </td>

              {/* Client */}
              <td>
                <div className="font-medium text-gray-900 dark:text-white">
                  {matter.client.displayName ?? matter.client.legalName}
                </div>
              </td>

              {/* Status */}
              <td>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                  statusConfig[matter.status]?.color || "bg-gray-100 text-gray-700"
                )}>
                  <span className={cn(
                    "status-dot",
                    matter.status === "OPEN" && "status-dot-success",
                    matter.status === "PENDING" && "status-dot-warning",
                    matter.status === "ON_HOLD" && "status-dot-muted",
                    matter.status === "CLOSED" && "status-dot-muted",
                  )} />
                  {matter.status.replace(/_/g, " ")}
                </span>
              </td>

              {/* Practice Area */}
              <td className="hide-mobile">
                <span className="text-gray-700 dark:text-gray-300">
                  {matter.practiceArea ?? <span className="text-gray-400">—</span>}
                </span>
              </td>

              {/* Lead Attorney */}
              <td className="hide-mobile">
                <div className="flex items-center gap-2">
                  {matter.leadAttorney ? (
                    <>
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                        {matter.leadAttorney.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {matter.leadAttorney.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-400">Unassigned</span>
                  )}
                </div>
              </td>

              {/* Opened Date */}
              <td>
                <span className="text-gray-700 dark:text-gray-300 font-numeric-tabular">
                  {matter.opensOn ? format(new Date(matter.opensOn), "dd MMM yyyy") : <span className="text-gray-400">—</span>}
                </span>
              </td>

              {/* Actions */}
              <td className="sticky-right text-right">
                <div className="table-actions flex items-center justify-end gap-1">
                  <Link href={`/cases/${matter.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">More</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination (if needed) */}
      {data.length > 0 && (
        <div className="table-pagination">
          <div className="pagination-info">
            Showing <span className="font-semibold">{data.length}</span> matters
          </div>
          <div className="pagination-controls">
            <Button variant="outline" size="sm" disabled className="rounded-lg">
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled className="rounded-lg">
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
