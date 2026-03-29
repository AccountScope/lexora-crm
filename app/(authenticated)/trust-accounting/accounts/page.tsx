/**
 * Trust Accounts Page
 * List and manage trust accounts (IOLTA compliance)
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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
    <div className="space-y-6">
      <PageHeader
        title="Trust Accounts"
        description="IOLTA Compliance & Client Trust Funds"
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
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Trust Accounts
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first trust account to manage client funds and ensure IOLTA compliance.
            </p>
            <Link href="/trust-accounting/accounts/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Trust Account
              </Button>
            </Link>
          </div>
        </Card>
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
            <p className="text-sm text-gray-600 mb-2">Total Trust Funds</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(
                accounts.reduce((sum, acc) => sum + acc.current_balance, 0)
              )}
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-gray-600 mb-2">Active Accounts</p>
            <p className="text-3xl font-bold text-gray-900">
              {accounts.filter(a => a.status === 'active').length}
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-gray-600 mb-2">Needs Reconciliation</p>
            <p className="text-3xl font-bold text-amber-600">
              {accounts.filter(a => needsReconciliation(a.last_reconciled_at)).length}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
