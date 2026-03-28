'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Mail, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type EmailAccount = {
  id: string;
  provider: 'gmail' | 'outlook';
  email_address: string;
  sync_enabled: boolean;
  last_synced_at: Date | null;
};

export function EmailSyncStatus() {
  const { data: accounts } = useQuery<EmailAccount[]>({
    queryKey: ['email-accounts'],
    queryFn: async () => {
      const res = await fetch('/api/email/accounts');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (!accounts || accounts.length === 0) {
    return null;
  }

  const activeAccounts = accounts.filter((a) => a.sync_enabled);
  const mostRecentSync = accounts.reduce((latest, account) => {
    if (!account.last_synced_at) return latest;
    const syncTime = new Date(account.last_synced_at);
    return !latest || syncTime > latest ? syncTime : latest;
  }, null as Date | null);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Sync Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Active accounts</span>
          <Badge variant="outline">{activeAccounts.length}</Badge>
        </div>
        {mostRecentSync && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Last synced</span>
            <span className="text-xs">
              {formatDistanceToNow(mostRecentSync, { addSuffix: true })}
            </span>
          </div>
        )}
        <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle className="h-3 w-3 text-green-500" />
          Syncing automatically
        </div>
      </CardContent>
    </Card>
  );
}
