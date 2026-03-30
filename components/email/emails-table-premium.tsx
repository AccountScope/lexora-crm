"use client";

import { format } from "date-fns";
import { EmptyStatePremium } from "@/components/ui/empty-state-premium";
import { Mail, Paperclip, ExternalLink, MoreHorizontal, Eye, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Email = {
  id: string;
  from_email: string;
  from_name: string | null;
  subject: string;
  date: Date;
  case_id: string | null;
  case_number: string | null;
  has_attachments: boolean;
};

type Props = {
  data?: { emails: Email[]; pagination: any };
  loading?: boolean;
  onEmailClick?: (id: string) => void;
};

export function EmailsTablePremium({ data, loading, onEmailClick }: Props) {
  if (loading) {
    return (
      <div className="table-container table-container-shadow">
        <table className="table-premium">
          <thead>
            <tr>
              <th>From</th>
              <th>Subject</th>
              <th className="hide-mobile">Date</th>
              <th>Linked Case</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="table-loading">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td><div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" /></td>
                <td><div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" /></td>
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

  if (!data || data.emails.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-8">
        <EmptyStatePremium
          icon={Mail}
          title="No emails yet"
          description="Connect your email account to start syncing and managing emails directly in LEXORA."
          variant="primary"
          action={{
            label: "Connect Email",
            onClick: () => window.location.href = '/settings/email',
            icon: Mail
          }}
          tips={[
            "Emails are automatically linked to relevant matters",
            "Support for Gmail, Outlook, and IMAP",
            "Full chain-of-custody tracking for compliance"
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
            <th className="sticky-left">From</th>
            <th>Subject</th>
            <th className="hide-mobile">Date</th>
            <th>Linked Case</th>
            <th className="sticky-right text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.emails.map((email) => (
            <tr 
              key={email.id} 
              className="group cursor-pointer"
              onClick={() => onEmailClick?.(email.id)}
            >
              {/* From */}
              <td className="sticky-left">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {(email.from_name || email.from_email).substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="table-cell-primary font-semibold truncate">
                      {email.from_name || email.from_email}
                    </div>
                    {email.from_name && (
                      <div className="table-cell-secondary text-xs truncate">
                        {email.from_email}
                      </div>
                    )}
                  </div>
                </div>
              </td>

              {/* Subject */}
              <td>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-gray-900 dark:text-white truncate">
                    {email.subject || '(No Subject)'}
                  </span>
                  {email.has_attachments && (
                    <Paperclip className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  )}
                </div>
              </td>

              {/* Date */}
              <td className="hide-mobile">
                <span className="text-gray-700 dark:text-gray-300 font-numeric-tabular text-sm">
                  {format(new Date(email.date), 'MMM d, yyyy h:mm a')}
                </span>
              </td>

              {/* Linked Case */}
              <td>
                {email.case_number ? (
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  )}>
                    <LinkIcon className="h-3 w-3" />
                    {email.case_number}
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm">Not linked</span>
                )}
              </td>

              {/* Actions */}
              <td className="sticky-right text-right">
                <div className="table-actions flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEmailClick?.(email.id);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
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
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Link to Case
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Original
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {data.pagination && (
        <div className="table-pagination">
          <div className="pagination-info">
            Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} emails)
          </div>
          <div className="pagination-controls">
            <Button variant="outline" size="sm" className="rounded-lg">
              Previous
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg">
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
