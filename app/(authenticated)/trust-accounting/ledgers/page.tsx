/**
 * Client Ledgers Page
 * View all client trust ledgers with balances and transaction history
 */

'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ClientLedger {
  id: string;
  client_id: string;
  client_name: string;
  current_balance: number;
  last_transaction: string | null;
  status: string;
  trust_account_name: string;
}

export default function ClientLedgersPage() {
  const [ledgers, setLedgers] = useState<ClientLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchLedgers();
  }, []);

  async function fetchLedgers() {
    try {
      const response = await fetch('/api/trust/ledgers');
      if (!response.ok) throw new Error('Failed to fetch ledgers');
      const data = await response.json();
      setLedgers(data.ledgers || []);
    } catch (error) {
      console.error('Error fetching ledgers:', error);
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

  function formatDate(date: string | null): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  async function exportToCSV() {
    const csv = [
      ['Client Name', 'Trust Account', 'Balance', 'Last Transaction', 'Status'].join(','),
      ...filteredLedgers.map((ledger) =>
        [
          ledger.client_name,
          ledger.trust_account_name,
          ledger.current_balance,
          ledger.last_transaction || 'Never',
          ledger.status
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-ledgers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  const filteredLedgers = ledgers.filter((ledger) => {
    const matchesSearch =
      searchQuery === '' ||
      ledger.client_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || ledger.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalBalance = filteredLedgers.reduce(
    (sum, ledger) => sum + ledger.current_balance,
    0
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Ledgers"
        description="Individual client balances in trust accounts"
      />
      <div className="flex justify-between items-center mb-8" style={{ display: 'none' }}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Client Ledgers</h1>
          <p className="text-gray-600 mt-1">
            Individual client balances in trust accounts
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Total Ledgers</p>
          <p className="text-3xl font-bold text-gray-900">{filteredLedgers.length}</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Total Balance</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(totalBalance)}
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Active Ledgers</p>
          <p className="text-3xl font-bold text-green-600">
            {filteredLedgers.filter((l) => l.status === 'active').length}
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Zero Balance</p>
          <p className="text-3xl font-bold text-gray-500">
            {filteredLedgers.filter((l) => l.current_balance === 0).length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Ledgers Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trust Account
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLedgers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No client ledgers found
                  </td>
                </tr>
              ) : (
                filteredLedgers.map((ledger) => (
                  <tr
                    key={ledger.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/trust-accounting/ledgers/${ledger.id}`)
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {ledger.client_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {ledger.trust_account_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span
                        className={`font-semibold ${
                          ledger.current_balance === 0
                            ? 'text-gray-500'
                            : 'text-gray-900'
                        }`}
                      >
                        {formatCurrency(ledger.current_balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(ledger.last_transaction)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={ledger.status === 'active' ? 'default' : 'secondary'}
                      >
                        {ledger.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Link
                        href={`/trust-accounting/ledgers/${ledger.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
