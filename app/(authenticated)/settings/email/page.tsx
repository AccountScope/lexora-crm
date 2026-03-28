'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, RefreshCw, Trash2, Settings, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type EmailAccount = {
  id: string;
  provider: 'gmail' | 'outlook';
  email_address: string;
  sync_enabled: boolean;
  last_synced_at: Date | null;
  sync_settings: {
    frequency: number;
    downloadUnreadOnly: boolean;
    maxAgeDays: number;
    direction: string;
    folders: string[];
    downloadAttachments: boolean;
  };
  created_at: Date;
};

export default function EmailSettingsPage() {
  const queryClient = useQueryClient();
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);

  const { data: accounts, isLoading } = useQuery<EmailAccount[]>({
    queryKey: ['email-accounts'],
    queryFn: async () => {
      const res = await fetch('/api/email/accounts');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      const json = await res.json();
      return json.data;
    },
  });

  const connectGmail = async () => {
    const res = await fetch('/api/email/oauth/gmail');
    const json = await res.json();
    window.location.href = json.data.authUrl;
  };

  const connectOutlook = async () => {
    const res = await fetch('/api/email/oauth/outlook');
    const json = await res.json();
    window.location.href = json.data.authUrl;
  };

  const syncMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const res = await fetch('/api/email/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });
      if (!res.ok) throw new Error('Sync failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
      setSyncingAccountId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const res = await fetch(`/api/email/accounts?accountId=${accountId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async ({
      accountId,
      syncEnabled,
      syncSettings,
    }: {
      accountId: string;
      syncEnabled?: boolean;
      syncSettings?: any;
    }) => {
      const res = await fetch('/api/email/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, syncEnabled, syncSettings }),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
    },
  });

  const handleSync = (accountId: string) => {
    setSyncingAccountId(accountId);
    syncMutation.mutate(accountId);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Email Integration</h1>
        <p className="text-muted-foreground mt-2">
          Connect your email accounts to sync emails and link them to cases
        </p>
      </div>

      {/* Connect Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connect Email Account</CardTitle>
          <CardDescription>
            Connect Gmail or Outlook to start syncing emails
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={connectGmail}>
            <Mail className="mr-2 h-4 w-4" />
            Connect Gmail
          </Button>
          <Button onClick={connectOutlook} variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Connect Outlook
          </Button>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      {isLoading ? (
        <div>Loading accounts...</div>
      ) : accounts && accounts.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Connected Accounts</h2>
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-base">{account.email_address}</CardTitle>
                      <CardDescription className="capitalize">{account.provider}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={account.sync_enabled ? 'default' : 'secondary'}>
                    {account.sync_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sync Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Last Synced</Label>
                    <p className="text-sm text-muted-foreground">
                      {account.last_synced_at
                        ? formatDistanceToNow(new Date(account.last_synced_at), { addSuffix: true })
                        : 'Never'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSync(account.id)}
                    disabled={syncingAccountId === account.id}
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${syncingAccountId === account.id ? 'animate-spin' : ''}`}
                    />
                    Sync Now
                  </Button>
                </div>

                {/* Sync Enabled Toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor={`sync-${account.id}`}>Enable Automatic Sync</Label>
                  <Switch
                    id={`sync-${account.id}`}
                    checked={account.sync_enabled}
                    onCheckedChange={(checked) =>
                      updateSettingsMutation.mutate({
                        accountId: account.id,
                        syncEnabled: checked,
                      })
                    }
                  />
                </div>

                {/* Sync Frequency */}
                <div className="flex items-center justify-between">
                  <Label>Sync Frequency</Label>
                  <Select
                    value={account.sync_settings.frequency.toString()}
                    onValueChange={(value) =>
                      updateSettingsMutation.mutate({
                        accountId: account.id,
                        syncSettings: {
                          ...account.sync_settings,
                          frequency: parseInt(value),
                        },
                      })
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Every 5 minutes</SelectItem>
                      <SelectItem value="15">Every 15 minutes</SelectItem>
                      <SelectItem value="30">Every 30 minutes</SelectItem>
                      <SelectItem value="60">Every 60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Max Age */}
                <div className="flex items-center justify-between">
                  <Label>Download Emails From</Label>
                  <Select
                    value={account.sync_settings.maxAgeDays.toString()}
                    onValueChange={(value) =>
                      updateSettingsMutation.mutate({
                        accountId: account.id,
                        syncSettings: {
                          ...account.sync_settings,
                          maxAgeDays: parseInt(value),
                        },
                      })
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="365">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Disconnect */}
                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure? This will delete all synced emails.')) {
                        deleteMutation.mutate(account.id);
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Disconnect Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No email accounts connected yet
          </CardContent>
        </Card>
      )}
    </div>
  );
}
