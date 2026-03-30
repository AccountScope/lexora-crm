'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmailsTablePremium } from '@/components/email/emails-table-premium';
import { Mail, Search, Download, Settings } from 'lucide-react';

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

export function EmailsPageContentPremium() {
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

  return (
    <div className="container-page space-y-6 page-transition pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-h1 text-gray-900 dark:text-white mb-2">
            Emails
          </h1>
          <p className="text-body text-gray-600 dark:text-gray-400">
            View and manage synced emails across all your connected accounts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="default"
            className="rounded-xl gap-2 hidden sm:flex"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          
          <Button
            size="default"
            onClick={() => router.push('/settings/email')}
            className="rounded-xl gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20"
          >
            <Settings className="h-4 w-4" />
            Email Settings
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search emails by subject, sender, or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="rounded-xl"
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Input
            placeholder="Filter by sender..."
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="rounded-xl"
          />
        </div>
        <Select value={linked} onValueChange={setLinked}>
          <SelectTrigger className="w-full sm:w-[150px] rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Emails</SelectItem>
            <SelectItem value="true">Linked</SelectItem>
            <SelectItem value="false">Unlinked</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} className="rounded-xl">
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </div>

      {/* Emails Table */}
      <EmailsTablePremium 
        data={data} 
        loading={isLoading}
        onEmailClick={(id) => router.push(`/emails/${id}`)}
      />
    </div>
  );
}
