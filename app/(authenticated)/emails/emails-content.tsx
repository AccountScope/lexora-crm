'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmailsTablePremium } from '@/components/email/emails-table-premium';
import { Mail, Search } from 'lucide-react';

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

export function EmailsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sender, setSender] = useState(searchParams.get('sender') || '');
  const [linked, setLinked] = useState(searchParams.get('linked') || 'all');
  const page = parseInt(searchParams.get('page') || '1');

  const { data, isLoading } = useQuery({
    queryKey: ['emails', { search, sender, linked, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (sender) params.set('sender', sender);
      if (linked !== 'all') params.set('linked', linked);
      params.set('page', page.toString());
      
      const res = await fetch(`/api/email?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch emails');
      const json = await res.json();
      return json.data;
    },
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (sender) params.set('sender', sender);
    if (linked !== 'all') params.set('linked', linked);
    params.set('page', '1');
    router.push(`/emails?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/emails?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emails"
        description="View and manage synced emails"
        action={
          <Button onClick={() => router.push('/settings/email')}>
            <Mail className="mr-2 h-4 w-4" />
            Email Settings
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="w-[200px]">
          <Input
            placeholder="Filter by sender..."
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Select value={linked} onValueChange={setLinked}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Emails</SelectItem>
            <SelectItem value="true">Linked</SelectItem>
            <SelectItem value="false">Unlinked</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch}>
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </div>

      {/* Emails Table */}
      {isLoading ? (
        <div className="text-center py-12">Loading emails...</div>
      ) : data && data.emails.length > 0 ? (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Linked Case</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.emails.map((email: Email) => (
                  <TableRow
                    key={email.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/emails/${email.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {email.from_name || email.from_email}
                          </div>
                          {email.from_name && (
                            <div className="text-xs text-muted-foreground">
                              {email.from_email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {email.subject || '(No Subject)'}
                        {email.has_attachments && (
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(email.date), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>
                      {email.case_number ? (
                        <Badge variant="outline">{email.case_number}</Badge>
                      ) : (
                        <Badge variant="secondary">Not Linked</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/emails/${email.id}`);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {data.pagination.page} of {data.pagination.totalPages} (
              {data.pagination.total} total emails)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No emails found. Connect an email account in settings to start syncing.
        </div>
      )}
    </div>
  );
}
