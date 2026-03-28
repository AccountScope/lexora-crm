/**
 * Client Ledger Detail Page
 * View individual client ledger with transaction history
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface ClientLedger {
  id: string;
  client_id: string;
  client_name: string;
  current_balance: number;
  status: string;
  trust_account_name: string;
  trust_account_id: string;
  created_at: string;
}

interface Transaction {
  id: string;
  date: string;
  type: string;
  amount: number;
  description: string;
  reference_number: string | null;
  balance_after: number;
  created_by_name: string;
}

export default function ClientLedgerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ledgerId = params.id as string;

  const [ledger, setLedger] = useState<ClientLedger | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ledgerId) {
      fetchLedgerDetails();
    }
  }, [ledgerId]);

  async function fetchLedgerDetails() {
    try {
      const response = await fetch(`/api/trust/ledgers/${ledgerId}`);
      if (!response.ok) throw new Error('Failed to fetch ledger');
      const data = await response.json();
      setLedger(data.ledger);
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching ledger details:', error);
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

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function printLedger() {
    window.print();
  }

  function exportToCSV() {
    if (!ledger) return;

    const csv = [
      ['Date', 'Type', 'Description', 'Reference', 'Amount', 'Balance'].join(','),
      ...transactions.map((txn) =>
        [
          txn.date,
          txn.type,
          `"${txn.description}"`,
          txn.reference_number || '',
          txn.amount,
          txn.balance_after
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-${ledger.client_name}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ledger details...</p>
        </div>
      </div>
    );
  }

  if (!ledger) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ledger Not Found</h2>
          <p className="text-gray-600 mb-6">The requested ledger could not be found.</p>
          <Link href="/trust-accounting/ledgers">
            <Button>Back to Ledgers</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/trust-accounting/ledgers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{ledger.client_name}</h1>
          <p className="text-gray-600 mt-1">Client Ledger - {ledger.trust_account_name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={printLedger}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Link href={`/trust-accounting/transactions/new?ledger=${ledgerId}`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </Link>
        </div>
      </div>

      {/* Ledger Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Current Balance</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(ledger.current_balance)}
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Total Transactions</p>
          <p className="text-3xl font-bold text-gray-900">{transactions.length}</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Status</p>
          <Badge variant={ledger.status === 'active' ? 'default' : 'secondary'}>
            {ledger.status}
          </Badge>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-2">Zero Balance</p>
          <p className="text-lg font-semibold">
            {ledger.current_balance === 0 ? (
              <span className="text-green-600">✓ Ready to Close</span>
            ) : (
              <span className="text-gray-500">Active</span>
            )}
          </p>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(txn.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={
                          txn.type === 'deposit'
                            ? 'default'
                            : txn.type === 'withdrawal'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {txn.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {txn.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {txn.reference_number || '—'}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-right font-semibold ${
                        txn.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {txn.type === 'deposit' ? '+' : '-'}
                      {formatCurrency(txn.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                      {formatCurrency(txn.balance_after)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          nav,
          button,
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
