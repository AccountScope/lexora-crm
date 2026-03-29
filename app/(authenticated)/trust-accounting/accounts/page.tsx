/**
 * Trust Accounts Page
 * List and manage trust accounts (IOLTA compliance)
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus, AlertTriangle, CheckCircle, InfoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LegalTerm } from '@/components/ui/legal-term';
import { EmptyState } from '@/components/ui/empty-state';
import { Landmark } from 'lucide-react';

interface TrustAccount {
  id: string;
  name: string;
  bank_name: string;
  account_number_last4: string;
  account_type: string;
  current_balance: number;
  last_reconciled_at: string | null;
  status: string;
  created_at: string;
}

export default function TrustAccountsPage() {
  const [accounts, setAccounts] = useState<TrustAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const response = await fetch('/api/trust/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error fetching trust accounts:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function needsReconciliation(lastReconciledDate: string | null): boolean {
    if (!lastReconciledDate) return true;
    
    const daysSince = Math.floor(
      (Date.now() - new Date(lastReconciledDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSince > 30;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6">
        <PageHeader
          title="Trust Accounts"
          description="SRA-compliant client money accounts (separate from operating funds)"
          action={
            <Link href="/trust-accounting/accounts/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Trust Account
              </Button>
            </Link>
          }
        />
      <div className="flex justify-between items-center mb-8" style={{ display: 'none' }}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trust Accounts</h1>
          <p className="text-gray-600 mt-1">IOLTA Compliance & Client Trust Funds</p>
        </div>
        <Link href="/trust-accounting/accounts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Trust Account
          </Button>
        </Link>
      </div>

      {/* Accounts List */}
      {accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No trust accounts yet"
          description="Trust accounts hold client money separately from your firm's operating funds. This is required by the SRA for proper client money handling."
          actionLabel="Create trust account"
          actionHref="/trust-accounting/accounts/new"
          secondaryActionLabel="Learn about trust accounting"
          secondaryActionHref="/docs/trust-accounting"
          tips={[
            "SRA requires monthly three-way reconciliation for all trust accounts",
            "Client money must never mix with firm operating funds",
            "Each client should have their own ledger within the trust account",
            "Interest earned on trust funds typically goes to the Legal Aid Fund"
          ]}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const needsRecon = needsReconciliation(account.last_reconciled_at);
            
            return (
              <Link
                key={account.id}
                href={`/trust-accounting/accounts/${account.id}`}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {account.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {account.bank_name} (••••{account.account_number_last4})
                      </p>
                    </div>
                    <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                      {account.status}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Current Balance</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(account.current_balance)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Account Type</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {account.account_type}
                      </p>
                    </div>

                    <div className="pt-3 border-t">
                      {needsRecon ? (
                        <div className="flex items-center text-sm text-amber-600">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Needs Reconciliation
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-green-600">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Reconciled
                        </div>
                      )}
                      {account.last_reconciled_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Last: {new Date(account.last_reconciled_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick Stats */}
      {accounts.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Trust Funds</p>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Combined balance of all client money held in trust. This must match your client ledger totals.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(
                accounts.reduce((sum, acc) => sum + acc.current_balance, 0)
              )}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Active Accounts</p>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Trust accounts currently accepting deposits and withdrawals. Inactive accounts are archived.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {accounts.filter(a => a.status === 'active').length}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Needs Reconciliation</p>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Accounts not reconciled in the last 30 days. SRA requires monthly three-way reconciliation.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-3xl font-bold text-amber-600">
              {accounts.filter(a => needsReconciliation(a.last_reconciled_at)).length}
            </p>
          </Card>
        </div>
      )}
      </div>
    </TooltipProvider>
  );
}
